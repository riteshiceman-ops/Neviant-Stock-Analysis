export default async (req) => {
  try {
    const url = new URL(req.url);

    const endpoint = url.searchParams.get("endpoint"); // quote | candles
    const exchange = url.searchParams.get("exchange"); // NSE | BSE
    const segment = url.searchParams.get("segment") || "CASH";

    if (!endpoint || !exchange) {
      return new Response(JSON.stringify({ error: "Missing required params: endpoint, exchange" }), { status: 400 });
    }

    const apiKey = process.env.GROWW_API_KEY;
    const apiSecret = process.env.GROWW_API_SECRET;

    if (!apiKey || !apiSecret) {
      return new Response(JSON.stringify({
        error: "Missing GROWW_API_KEY or GROWW_API_SECRET env var"
      }), { status: 500 });
    }

    // Groww headers (API-key auth style)
    // NOTE: If Groww requires Bearer token instead, we’ll switch back to GROWW_ACCESS_TOKEN flow.
    const headers = {
      "Accept": "application/json",
      "X-API-VERSION": "1.0",
      "x-api-key": apiKey,
      "x-api-secret": apiSecret,
    };

    let growwUrl;

    if (endpoint === "quote") {
      const trading_symbol = url.searchParams.get("trading_symbol");
      if (!trading_symbol) {
        return new Response(JSON.stringify({ error: "Missing required param for quote: trading_symbol" }), { status: 400 });
      }

      growwUrl = new URL("https://api.groww.in/v1/live-data/quote");
      growwUrl.searchParams.set("exchange", exchange);
      growwUrl.searchParams.set("segment", segment);
      growwUrl.searchParams.set("trading_symbol", trading_symbol);

    } else if (endpoint === "candles") {
      const groww_symbol = url.searchParams.get("groww_symbol");
      const start_time = url.searchParams.get("start_time");
      const end_time = url.searchParams.get("end_time");
      const candle_interval = url.searchParams.get("candle_interval");

      if (!groww_symbol || !start_time || !end_time || !candle_interval) {
        return new Response(JSON.stringify({
          error: "Missing required candle params: groww_symbol, start_time, end_time, candle_interval"
        }), { status: 400 });
      }

      growwUrl = new URL("https://api.groww.in/v1/historical/candles");
      growwUrl.searchParams.set("exchange", exchange);
      growwUrl.searchParams.set("segment", segment);
      growwUrl.searchParams.set("groww_symbol", groww_symbol);
      growwUrl.searchParams.set("start_time", start_time);
      growwUrl.searchParams.set("end_time", end_time);
      growwUrl.searchParams.set("candle_interval", candle_interval);

    } else {
      return new Response(JSON.stringify({ error: "Invalid endpoint. Use quote|candles" }), { status: 400 });
    }

    const r = await fetch(growwUrl.toString(), { headers });
    const data = await r.json();

    return new Response(JSON.stringify({
      source: "groww",
      auth: "api_key_secret",
      endpoint,
      exchange,
      segment,
      fetched_at_utc: new Date().toISOString(),
      data
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
};
