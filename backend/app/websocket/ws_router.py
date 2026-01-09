from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.kotak_ws_hsm import kotak_hsm
from app.utils.cache import get_trade_session
from app.scripmaster.service import scrip_master
from app.core.logger import logger
import json
import asyncio

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        # symbol -> set of websockets
        self.subscriptions: Dict[str, Set[WebSocket]] = {}
        self.initialized = False

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        # Initialize Kotak HSM connection if first client
        if not self.initialized:
            await self.ensure_hsm_connected()
            self.initialized = True
            kotak_hsm.add_callback(self.broadcast_tick)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        # Clear subscriptions for this socket
        for symbol in list(self.subscriptions.keys()):
            if websocket in self.subscriptions[symbol]:
                self.subscriptions[symbol].remove(websocket)
                if not self.subscriptions[symbol]:
                    del self.subscriptions[symbol]

    async def ensure_hsm_connected(self):
        """Lazy-connect to Kotak HSM using stored session."""
        token, sid, _, _ = get_trade_session()
        if token and sid:
            try:
                await kotak_hsm.connect(token, sid)
                logger.info("HSM Connection established via Broker")
            except Exception as e:
                logger.error(f"Broker failed to connect HSM: {e}")
        else:
            logger.warning("No trade session found. HSM connection pending.")

    async def subscribe_client(self, websocket: WebSocket, symbol: str):
        """Map symbol -> token and subscribe in Kotak HSM if needed."""
        scrip = scrip_master.get_scrip(symbol)
        if not scrip:
            logger.warning(f"Client requested unknown symbol: {symbol}")
            return

        if symbol not in self.subscriptions:
            self.subscriptions[symbol] = set()
            # New subscription for HSM
            sub_str = f"{scrip['exchangeSegment']}|{scrip['instrumentToken']}&"
            await kotak_hsm.subscribe(sub_str)
        
        self.subscriptions[symbol].add(websocket)
        logger.info(f"Client subscribed to {symbol}")

    async def broadcast_tick(self, tick: dict):
        """Push tick to all interested frontend clients."""
        symbol = tick.get('symbol')
        if symbol in self.subscriptions:
            dead_links = []
            for ws in self.subscriptions[symbol]:
                try:
                    await ws.send_json(tick)
                except Exception:
                    dead_links.append(ws)
            
            # Cleanup dead connections found during broadcast
            for dead in dead_links:
                self.disconnect(dead)

manager = ConnectionManager()

@router.websocket("/ws/market-data")
async def websocket_market_data(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                msg_type = message.get("type")
                
                if msg_type == "subscribe":
                    symbols = message.get("symbols", [])
                    if isinstance(symbols, list):
                        for sym in symbols:
                            await manager.subscribe_client(websocket, sym)
                    elif isinstance(symbols, str):
                        await manager.subscribe_client(websocket, symbols)
                        
                elif msg_type == "unsubscribe":
                    # For simplicity, we just clear from local set
                    # Kotak doesn't have easy unsubscribe, so we keep aggregation active
                    pass
                    
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket router error: {e}")
        manager.disconnect(websocket)
