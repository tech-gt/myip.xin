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
  
  // Build response object
  const clientInfo = {
    ip: ip,
    city: cf.city || null,
    country: cf.country || null,
    countryName: cf.country || null, // Cloudflare cf.country is 2-letter code, e.g. "US"
    latitude: cf.latitude || null,
    longitude: cf.longitude || null,
    postalCode: cf.postalCode || null,
    asn: cf.asn || null,
    asnOrg: cf.asOrganization || null,
    timezone: cf.timezone || null,
    region: cf.region || null,
    regionCode: cf.regionCode || null,
    userAgent: request.headers.get("user-agent") || "Unknown",
    language: request.headers.get("accept-language") || "Unknown",
    referer: request.headers.get("referer") || "Unknown",
    method: request.method,
    colo: cf.colo || "Unknown"
  };

  // For local development, if CF headers are missing, we can fetch public IP details from a free service
  if (ip === "127.0.0.1" || ip === "::1" || !cf.country) {
    try {
      // First, get client's public IP from a simple service
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      if (ipResponse.ok) {
        const ipData = await ipResponse.json();
        clientInfo.ip = ipData.ip;
        
        // Then query ipwho.is for geo details
        const geoResponse = await fetch(`https://ipwho.is/${clientInfo.ip}`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.success) {
            clientInfo.city = geoData.city;
            clientInfo.country = geoData.country_code;
            clientInfo.countryName = geoData.country;
            clientInfo.latitude = geoData.latitude;
            clientInfo.longitude = geoData.longitude;
            clientInfo.postalCode = geoData.postal;
            clientInfo.asn = geoData.connection?.asn;
            clientInfo.asnOrg = geoData.connection?.org;
            clientInfo.timezone = geoData.timezone?.id;
            clientInfo.region = geoData.region;
          }
        }
      }
    } catch (e) {
      console.error("Local dev geo fetch failed: ", e);
    }
  }

  // Map country code to full name if we only have the code (e.g. from CF headers)
  // We can also let the frontend do this, but providing standard values is nice.
  
  return new Response(JSON.stringify(clientInfo), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
