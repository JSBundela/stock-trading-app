from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.core.logger import logger
from app.auth.router import router as auth_router
from app.market.router import router as market_router
from app.orders.router import router as orders_router
from app.portfolio.router import router as portfolio_router
from app.scripmaster.router import router as scripmaster_router
from app.websocket.router import router as websocket_router
from app.historical.routes import router as historical_router
from app.scripmaster.service import scrip_master
from app.strategy.engine import strategy_engine

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(market_router)
app.include_router(orders_router)
app.include_router(portfolio_router)
app.include_router(scripmaster_router)
app.include_router(websocket_router)
app.include_router(historical_router)

@app.on_event("startup")
async def startup_event():
    """Initialize database on application startup."""
    logger.info("Application starting up...")
    
    # Initialize order history database
    from app.database import init_database
    await init_database()
    
    # NOTE: Scrip master will load AFTER authentication with valid baseUrl
    # Start Strategy Engine
    await strategy_engine.start()

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutting down...")
    await strategy_engine.stop()

@app.get("/")
async def root():
    return {"message": "Kotak Neo Trading API is running"}
