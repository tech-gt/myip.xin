export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const userAgent = request.headers.get("user-agent") || "";
  
  // Intercept CLI tools (like curl, wget, httpie) requesting the root path
  if (url.pathname === "/" && /curl|wget|httpie/i.test(userAgent)) {
    let ip = request.headers.get("CF-Connecting-IP") || 
             request.headers.get("X-Real-IP") || 
             request.headers.get("X-Forwarded-For") || 
             "127.0.0.1";
             
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    
    // For local development
    if (ip === "127.0.0.1" || ip === "::1") {
      try {
        const ipResponse = await fetch("https://api.ipify.org?format=json");
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          ip = ipData.ip;
        }
      } catch (e) {
        console.error("Local dev IP fetch failed:", e);
      }
    }
    
    return new Response(ip + "\n", {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "X-Content-Type-Options": "nosniff"
      }
    });
  }

  const response = await context.next();
  
  // Set security and CORS headers
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS, POST");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  return response;
}
