
const targetUrl = "https://www.google.com";
const proxyHost = "192.168.2.154";
const proxyPort = "19270";

async function testProxy(protocol: string) {
    const proxyUrl = `${protocol}://${proxyHost}:${proxyPort}`;
    console.log(`\nTesting proxy: ${proxyUrl} -> ${targetUrl}`);
    
    try {
        const response = await fetch(targetUrl, {
            proxy: proxyUrl,
            tls: {
                rejectUnauthorized: false // Ignore self-signed certs if proxy intercepts
            }
        });
        console.log(`[SUCCESS] ${protocol.toUpperCase()}: Status ${response.status}`);
        // Read body to complete request
        await response.text();
        return true;
    } catch (error: any) {
        console.log(`[FAILED] ${protocol.toUpperCase()}: ${error.message}`);
        if (error.code) console.log(`Error Code: ${error.code}`);
        return false;
    }
}

console.log("Starting Proxy Protocol Detection...");
console.log("----------------------------------------");

// Clear env vars to ensure no interference
process.env.HTTP_PROXY = "";
process.env.HTTPS_PROXY = "";
process.env.ALL_PROXY = "";

// Test 1: HTTP
const httpSuccess = await testProxy("http");

// Test 2: SOCKS5
const socksSuccess = await testProxy("socks5");

console.log("\n----------------------------------------");
console.log("Summary:");
console.log(`HTTP Proxy:   ${httpSuccess ? "WORKING" : "NOT WORKING"}`);
console.log(`SOCKS5 Proxy: ${socksSuccess ? "WORKING" : "NOT WORKING"}`);

if (httpSuccess && !socksSuccess) {
    console.log("\nCONCLUSION: The proxy is HTTP-only.");
    console.log("Action: Update env vars to use 'http://' for everything.");
} else if (!httpSuccess && socksSuccess) {
    console.log("\nCONCLUSION: The proxy is SOCKS5-only.");
    console.log("Action: Update env vars to use 'socks5://' for everything.");
} else if (httpSuccess && socksSuccess) {
    console.log("\nCONCLUSION: The proxy supports both protocols.");
} else {
    console.log("\nCONCLUSION: Neither protocol worked. Check proxy IP/Port or network connectivity.");
}
