export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const query = (url.searchParams.get("query") || "").trim();

  if (!query) {
    return new Response(JSON.stringify({ success: false, message: "Query parameter is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
    });
  }

  // Basic check: is it an IP or a domain?
  const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(query) || query.includes(":");
  const rdapType = isIp ? "ip" : "domain";
  
  // Clean query for domain (remove http/https/www if present)
  let cleanQuery = query.toLowerCase();
  if (!isIp) {
    cleanQuery = cleanQuery.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].split(":")[0];
  }

  try {
    const rdapUrl = `https://rdap.org/${rdapType}/${encodeURIComponent(cleanQuery)}`;
    
    const response = await fetch(rdapUrl, {
      headers: {
        "Accept": "application/rdap+json, application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      // Fallback or error return
      return new Response(JSON.stringify({ 
        success: false, 
        message: `RDAP lookup failed with status ${response.status}. The registry may not support RDAP for this TLD.` 
      }), {
        status: response.status,
        headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
      });
    }

    const rawData = await response.json();
    
    // Parse RDAP data
    const parsedData = {
      success: true,
      query: cleanQuery,
      type: rdapType,
      name: rawData.ldhName || cleanQuery,
      status: rawData.status || [],
      nameservers: (rawData.nameservers || []).map(ns => ns.ldhName),
      events: {},
      registrar: "Unknown",
      raw: rawData // Return raw RDAP for complete detail view
    };

    // Parse Events (Dates)
    if (rawData.events && Array.isArray(rawData.events)) {
      for (const event of rawData.events) {
        if (event.eventAction === "registration") {
          parsedData.events.created = event.eventDate;
        } else if (event.eventAction === "expiration") {
          parsedData.events.expires = event.eventDate;
        } else if (event.eventAction === "last changed") {
          parsedData.events.updated = event.eventDate;
        }
      }
    }

    // Parse Registrar Name
    // Normally in entities under a sub-entity with role 'registrar'
    if (rawData.entities && Array.isArray(rawData.entities)) {
      const registrarEntity = rawData.entities.find(entity => 
        entity.roles && entity.roles.includes("registrar")
      );
      if (registrarEntity) {
        // Get name from vcard
        // vcard format: [ "vcard", [ [ "version", {}, "text", "4.0" ], [ "fn", {}, "text", "Registrar Name" ] ] ]
        const fnProp = findVcardProperty(registrarEntity.vcardArray, "fn");
        if (fnProp) {
          parsedData.registrar = fnProp[3];
        } else {
          parsedData.registrar = registrarEntity.handle || "Unknown";
        }
      }
    }

    return new Response(JSON.stringify(parsedData), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
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

// Helper to extract properties from vcardArray
function findVcardProperty(vcardArray, propName) {
  if (!vcardArray || !Array.isArray(vcardArray) || vcardArray.length < 2) return null;
  const props = vcardArray[1];
  if (!Array.isArray(props)) return null;
  return props.find(prop => prop[0] === propName);
}
