export async function onRequest(context) {
  const { request } = context;
  
  // Get client IP
  let ip = request.headers.get("CF-Connecting-IP") || 
           request.headers.get("X-Real-IP") || 
           request.headers.get("X-Forwarded-For") || 
           "127.0.0.1";
           
  // X-Forwarded-For can contain multiple IPs, take the first one
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  const cf = request.cf || {};
  
  let hostname = "";
  let city = cf.city || "";
  let region = cf.region || "";
  let country = cf.country || "";
  let loc = cf.latitude && cf.longitude ? `${cf.latitude},${cf.longitude}` : "";
  let org = cf.asn ? `AS${cf.asn} ${cf.asOrganization || ""}`.trim() : "";
  let postal = cf.postalCode || "";
  let timezone = cf.timezone || "";

  // Local development fallback
  if (ip === "127.0.0.1" || ip === "::1" || !cf.country) {
    try {
      // First, get client's public IP from a simple service
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      if (ipResponse.ok) {
        const ipData = await ipResponse.json();
        ip = ipData.ip;
        
        // Then query ipwho.is for geo details
        const geoResponse = await fetch(`https://ipwho.is/${ip}`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.success) {
            hostname = geoData.connection?.domain || "";
            city = geoData.city || "";
            region = geoData.region || "";
            country = geoData.country_code || "";
            loc = geoData.latitude && geoData.longitude ? `${geoData.latitude},${geoData.longitude}` : "";
            org = geoData.connection?.asn ? `AS${geoData.connection.asn} ${geoData.connection.org || ""}`.trim() : "";
            postal = geoData.postal || "";
            timezone = geoData.timezone?.id || "";
          }
        }
      }
    } catch (e) {
      console.error("Local dev geo fetch failed:", e);
    }
  }

  const responseData = {
    ip,
    hostname,
    city,
    region,
    country,
    loc,
    org,
    postal,
    timezone
  };

  return new Response(JSON.stringify(responseData, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
