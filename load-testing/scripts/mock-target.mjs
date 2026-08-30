#!/usr/bin/env node
/**
 * Local MOCK target for validating the load-test harness itself — NOT the app.
 *
 * Serves the same URL surface the scripts hit (page routes + /rest/v1/<table>)
 * with tiny synthetic payloads and configurable latency, so anyone can prove
 * the k6/Artillery scripts, thresholds and reports work end-to-end WITHOUT
 * sending a single request to production or Supabase:
 *
 *   npm run mock                        # terminal 1 → http://localhost:9000
 *   BASE_URL=http://localhost:9000 SUPABASE_URL=http://localhost:9000 \
 *   SUPABASE_ANON_KEY=mock npm run k6:smoke        # terminal 2
 *
 * Knobs (env):
 *   MOCK_PORT        listen port                    (default 9000)
 *   MOCK_LATENCY_MS  ~mean artificial latency, ms   (default 60)
 *   MOCK_ERROR_RATE  0–1 share of 500 responses     (default 0) — set e.g.
 *                    0.05 to watch the error-rate threshold fail on purpose
 *
 * The responses are labelled mock data and are intentionally NOT realistic in
 * size or latency — results against this server say nothing about the app.
 */

import http from 'node:http';

const PORT = Number(process.env.MOCK_PORT || 9000);
const LATENCY_MS = Number(process.env.MOCK_LATENCY_MS || 60);
const ERROR_RATE = Number(process.env.MOCK_ERROR_RATE || 0);

const latency = () => LATENCY_MS / 2 + Math.random() * LATENCY_MS;

const server = http.createServer((req, res) => {
  setTimeout(() => {
    if (ERROR_RATE > 0 && Math.random() < ERROR_RATE) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end('{"mock":true,"error":"injected failure (MOCK_ERROR_RATE)"}');
      return;
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (url.pathname.startsWith('/rest/v1/')) {
      const table = url.pathname.slice('/rest/v1/'.length);
      const limit = Math.min(Number(url.searchParams.get('limit') || 100), 1000);
      const headers = {
        'Content-Type': 'application/json',
        'Content-Range': `0-${Math.max(0, limit - 1)}/4321`,
      };
      if (req.method === 'HEAD') {
        res.writeHead(200, headers);
        res.end();
        return;
      }
      const rows = Array.from({ length: Math.min(limit, 200) }, (_, i) => ({ id: i, mock: true, table }));
      res.writeHead(200, headers);
      res.end(JSON.stringify(rows));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!doctype html><title>mock ${url.pathname}</title><h1>Load-test mock target — ${url.pathname}</h1>`);
  }, latency());
});

server.listen(PORT, () => {
  console.log(`Mock target on http://localhost:${PORT} — latency ~${LATENCY_MS}ms, error rate ${ERROR_RATE * 100}%`);
  console.log('This is a harness self-test double. It says NOTHING about real app performance.');
});
