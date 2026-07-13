"""
backend/routes/market.py
Live market quote endpoints.
"""

from fastapi import APIRouter, HTTPException, Query
import yfinance as yf

router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/quote")
async def get_live_quote(ticker: str = Query(..., min_length=1)):
    """Return a live quote snapshot for a ticker."""
    try:
        yticker = yf.Ticker(ticker.strip())
        info = yticker.fast_info or {}

        last_price = info.get("lastPrice")
        if last_price is None:
            full_info = yticker.info or {}
            last_price = full_info.get("currentPrice") or full_info.get("regularMarketPrice")

        if last_price is None:
            raise HTTPException(status_code=404, detail=f"Live quote unavailable for ticker '{ticker}'")

        currency = info.get("currency")
        if not currency:
            full_info = yticker.info or {}
            currency = full_info.get("currency", "USD")

        return {
            "ticker": ticker.strip(),
            "price": float(last_price),
            "currency": currency,
            "updated_at": info.get("lastPriceTimestamp"),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch live quote for '{ticker}': {exc}") from exc
