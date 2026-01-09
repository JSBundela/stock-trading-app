import asyncio
import json
import websockets
import time
from typing import Dict, List, Callable, Optional, Set
from app.core.logger import logger
from app.scripmaster.service import scrip_master
from app.utils.symbol_formatter import format_display_name
from app.utils.market_hours import get_market_session_info

class KotakHSMClient:
    """
    Kotak Neo Market Data (HSM) WebSocket Client.
    Follows strict Phase 2 rules:
    - Official Handshake & Heartbeat
    - Scrip Master Validation
    - Price Normalization
    - Standardized Output
    """
    
    def __init__(self):
        self.url = "wss://mlhsm.kotaksecurities.com"
        self.ws = None
        self.connected = False
        self.session_token = None
        self.sid = None
        
        # Internal state
        self._heartbeat_task = None
        self._listen_task = None
        self._callbacks: List[Callable] = []
        
        # Active subscriptions: (token, segment) -> trading_symbol
        self._subscribed_map: Dict[tuple, str] = {}
        
    async def connect(self, session_token: str, sid: str):
        """Connect to HSM and perform handshake."""
        self.session_token = session_token
        self.sid = sid
        
        try:
            logger.info(f"Connecting to Kotak HSM at {self.url}")
            self.ws = await websockets.connect(self.url)
            
            # 1. Send Handshake
            handshake = {
                "Authorization": session_token,
                "Sid": sid,
                "type": "cn"
            }
            await self.ws.send(json.dumps(handshake))
            logger.info("HSM Handshake sent")
            
            self.connected = True
            
            # 2. Start Heartbeat (25 seconds)
            if self._heartbeat_task:
                self._heartbeat_task.cancel()
            self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())
            
            # 3. Start Listener
            if self._listen_task:
                self._listen_task.cancel()
            self._listen_task = asyncio.create_task(self._listen_loop())
            
            logger.info("Kotak HSM Client initialized and listening")
            
        except Exception as e:
            logger.error(f"Failed to connect to Kotak HSM: {e}")
            self.connected = False
            raise
            
    async def _heartbeat_loop(self):
        """Official Heartbeat: {"type": "ti", "scrips": ""} every 25s."""
        while self.connected:
            try:
                await asyncio.sleep(25)
                if self.ws:
                    await self.ws.send(json.dumps({"type": "ti", "scrips": ""}))
                    logger.debug("HSM Heartbeat sent")
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"HSM Heartbeat error: {e}")
                self.connected = False
                break
                
    async def _listen_loop(self):
        """Listen for binary/JSON ticks from Kotak."""
        try:
            async for message in self.ws:
                await self._process_message(message)
        except websockets.ConnectionClosed:
            logger.warning("Kotak HSM connection closed")
            self.connected = False
        except Exception as e:
            logger.error(f"HSM Listener error: {e}")
            self.connected = False

    async def _process_message(self, message):
        """Parse, Validate, and Normalize Ticks."""
        try:
            data = json.loads(message)
            
            # Data usually comes as a list or single update
            if isinstance(data, list):
                for item in data:
                    await self._handle_tick(item)
            else:
                await self._handle_tick(data)
                
        except json.JSONDecodeError:
            # Some responses might be binary if hslib.js logic is applied server-side
            # But the documentation says JSON for HSM
            pass
        except Exception as e:
            logger.error(f"Error processing HSM message: {e}")

    async def _handle_tick(self, tick: dict):
        """
        MANDATORY VALIDATION (PHASE 2):
        1. Map tick via tick.tk -> token, tick.e -> segment
        2. Lookup in Scrip Master
        3. Normalize Price
        4. Enrich with Meta
        """
        token = tick.get('tk')
        segment = tick.get('e')
        
        if not token or not segment:
            return

        # 1. STRICT Scrip Master Lookup
        scrip = scrip_master.get_scrip_by_token(token, segment)
        if not scrip:
            # TICK REJECTION LOGGING (PHASE 2 MANDATORY)
            logger.warning(f"Rejected tick: reason=TOKEN_NOT_FOUND, token={token}, segment={segment}")
            return

        # 2. PRICE NORMALIZATION (PHASE 2 MANDATORY: TICK FIRST)
        # price = raw / (multiplier × precision)
        # We check tick first, then fallback to scrip master
        raw_mul = tick.get('mul')
        raw_prec = tick.get('prec')
        
        mul = float(raw_mul) if raw_mul is not None else float(scrip.get('multiplier', 1))
        prec_val = float(raw_prec) if raw_prec is not None else float(scrip.get('precision', 2))
        
        scale = mul * (10 ** prec_val)
        
        # Log if we had to fallback (for debugging)
        if raw_mul is None or raw_prec is None:
            logger.debug(f"Normalization fallback for {scrip['tradingSymbol']}: tick_mul={raw_mul}, scrip_mul={mul}, tick_prec={raw_prec}, scrip_prec={prec_val}")
        
        def normalize(val):
            if val is None: return 0.0
            try:
                return float(val) / scale
            except:
                return 0.0

        # 3. AMO & SESSION (PHASE 2 MANDATORY: BACKEND DRIVEN)
        session_info = get_market_session_info(scrip['exchangeSegment'])

        # 4. ENRICH & STANDARDIZE
        normalized_tick = {
            "symbol": scrip['tradingSymbol'],
            "displayName": format_display_name(scrip),
            "ltp": normalize(tick.get('ltp')),
            "open": normalize(tick.get('o') or tick.get('op')),
            "high": normalize(tick.get('h')),
            "low": normalize(tick.get('lo') or tick.get('l')),
            "close": normalize(tick.get('c')),
            "volume": int(tick.get('v', 0)),
            "timestamp": int(time.time()),
            "instrumentType": scrip.get('instrumentType'),
            "exchange": "NSE" if "NSE" in str(segment).upper() else "BSE",
            "session": session_info["status"],
            "isAmo": session_info["is_amo"]
        }
        
        # 4. Broadcast to internal callbacks
        for cb in self._callbacks:
            try:
                if asyncio.iscoroutinefunction(cb):
                    await cb(normalized_tick)
                else:
                    cb(normalized_tick)
            except Exception as e:
                logger.error(f"Tick callback error: {e}")

    async def subscribe(self, scrips_str: str):
        """
        Subscribe to scrips: "nse_cm|11536&..."
        """
        if not self.connected:
            return
            
        subscription = {
            "type": "mws",
            "scrips": scrips_str,
            "channelnum": 1
        }
        
        # Track subscriptions for internal validation
        # Parse scrips_str: nse_cm|11536&
        parts = scrips_str.strip('&').split('&')
        for part in parts:
            if '|' in part:
                seg, tk = part.split('|')
                self._subscribed_map[(str(tk), str(seg).lower())] = "ACTIVE"
        
        await self.ws.send(json.dumps(subscription))
        logger.info(f"HSM Subscribed: {scrips_str}")

    def add_callback(self, cb: Callable):
        self._callbacks.append(cb)

    async def disconnect(self):
        self.connected = False
        if self.ws:
            await self.ws.close()
        if self._heartbeat_task:
            self._heartbeat_task.cancel()
        if self._listen_task:
            self._listen_task.cancel()
        logger.info("HSM Client disconnected")

# Singleton for the app lifetime
kotak_hsm = KotakHSMClient()
