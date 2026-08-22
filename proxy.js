import http from "node:http";
import https from "node:https";

const server = http.createServer((clientReq, clientRes) => {
  const options = {
    hostname: "agentrouter.org",
    port: 443,
    path: clientReq.url,
    method: clientReq.method,
    headers: {
      ...clientReq.headers,
      host: "agentrouter.org",
      originator: "codex_cli_rs",
      "user-agent": "codex_cli_rs/0.101.0 (Mac OS 26.0.1; arm64) Apple_Terminal/464",
      version: "0.101.0",
    },
  };

  const proxy = https.request(options, (res) => {
    clientRes.writeHead(res.statusCode, res.headers);
    res.pipe(clientRes, { end: true });
  });

  clientReq.pipe(proxy, { end: true });
});

server.listen(8318, () => {
  console.log("AgentRouter Proxy listening on http://localhost:8318");
});
