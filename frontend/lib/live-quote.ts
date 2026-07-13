"use client";

import { useEffect, useMemo, useState } from "react";
import { api, NoteData } from "@/lib/api";

export function useLiveQuote(note: NoteData | null, pollMs: number = 15000) {
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [liveCurrency, setLiveCurrency] = useState<string | undefined>(undefined);

  const ticker = useMemo(() => note?.ticker?.trim() || "", [note?.ticker]);

  useEffect(() => {
    if (!ticker) return;

    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      try {
        const quote = await api.getLiveQuote(ticker);
        if (!active) return;
        setLivePrice(quote.price);
        setLiveCurrency(quote.currency);
      } catch (err) {
        console.error(`Failed to fetch live quote for ${ticker}:`, err);
      }
    };

    setLivePrice(null);
    setLiveCurrency(undefined);
    load();
    timer = setInterval(load, pollMs);

    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [ticker, pollMs]);

  return {
    price: livePrice ?? note?.financial_data?.current_price ?? null,
    currency: liveCurrency ?? note?.financial_data?.currency,
  };
}
