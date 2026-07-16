"""
backend/routes/market.py
Real-time market data endpoints
"""

from fastapi import APIRouter, HTTPException
from alphaagents.tools.market import get_live_market_data
from alphaagents.tools.finance import get_real_time_price

router = APIRouter(prefix="/api/market", tags=["Market Data"])


@router.get("/live/{ticker}")
async def get_live_data(ticker: str):
    """Get real-time price + fundamentals"""
    try:
        return get_live_market_data(ticker.upper())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/price/{ticker}")
async def get_price_only(ticker: str):
    """Lightweight real-time price"""
    price_data = get_real_time_price(ticker.upper())
    if not price_data:
        raise HTTPException(status_code=404, detail="Price not found")
    return price_data


@router.get("/quote/{ticker}")
async def get_quote(ticker: str):
    """Alias for live data (for frontend compatibility)"""
    try:
        return get_live_market_data(ticker.upper())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))