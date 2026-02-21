
export default async (req) => {
  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint"); // quote | ohlcv | fundamentals
    const symbol = url.searchParams.get("symbol");
    const outputsize = url.searchParams.get("outputsize") || "full";

    if (!endpoint || !symbol) {
      return new Response(JSON.stringify({ error: "Missing required params: endpoint, symbol" }), { status: 400 });
    }

    const apiKey = process.env.ALPHAVANTAGE_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing ALPHAVANTAGE_KEY env var" }), { status: 500 });
    }

    let fn;
    if (endpoint === "quote") fn = "GLOBAL_QUOTE";
    else if (endpoint === "ohlcv") fn = "TIME_SERIES_DAILY_ADJUSTED";
    else if (endpoint === "fundamentals") fn = "OVERVIEW";
    else {
      return new Response(JSON.stringify({ error: "Invalid endpoint. Use quote|ohlcv|fundamentals" }), { status: 400 });
    }

    const avUrl = new URL("https://www.alphavantage.co/query");
    avUrl.searchParams.set("function", fn);
    avUrl.searchParams.set("symbol", symbol);
    avUrl.searchParams.set("apikey", apiKey);

    if (endpoint === "ohlcv") avUrl.searchParams.set("outputsize", outputsize);

    const r = await fetch(avUrl.toString());
    const data = await r.json();

    return new Response(JSON.stringify({ source: "alphavantage", symbol, endpoint, fetched_at_utc: new Date().toISOString(), data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
};
