export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  let query = url.searchParams.get("query") || url.searchParams.get("ip") || "";

  query = query.trim();

  // If query is empty, fall back to myip logic
  if (!query) {
    // We can just redirect or call the same logic
    let ip = request.headers.get("CF-Connecting-IP") || 
             request.headers.get("X-Real-IP") || 
             request.headers.get("X-Forwarded-For") || 
             "127.0.0.1";
             
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    query = ip;
  }

  // Handle local dev IPs when they are looked up
  if (query === "127.0.0.1" || query === "::1") {
    try {
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      if (ipResponse.ok) {
        const ipData = await ipResponse.json();
        query = ipData.ip;
      }
    } catch (e) {
      console.error("Failed to fetch public IP for local lookup: ", e);
    }
  }

  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(query)}`);
    if (!response.ok) {
      return new Response(JSON.stringify({ success: false, message: "Failed to fetch geolocation data" }), {
        status: 502,
        headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
      });
    }

    const data = await response.json();
    
    // Normalize response for our client application
    const result = {
      success: data.success,
      ip: data.ip || query,
      type: data.type || null,
      city: data.city || null,
      country: data.country_code || null,
      countryName: data.country || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      postalCode: data.postal || null,
      asn: data.connection?.asn || null,
      asnOrg: data.connection?.org || null,
      isp: data.connection?.isp || null,
      timezone: data.timezone?.id || null,
      region: data.region || null,
      flag: data.flag?.emoji || null
    };

    if (!data.success) {
      result.message = data.message || "Invalid IP address or domain";
    }

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600", // cache result for 1 hour
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
    });
  }
}
