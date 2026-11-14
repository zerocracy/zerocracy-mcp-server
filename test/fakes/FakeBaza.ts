// SPDX-FileCopyrightText: Copyright (c) 2025-2026 Zerocracy
// SPDX-License-Identifier: MIT

import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http';

const route = (req: IncomingMessage, res: ServerResponse): void => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = url.pathname;
  const product = url.searchParams.get('product');
  if (path === '/robots.txt') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('User-agent: *\nDisallow: /\n');
  } else if (path === '/products') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('hello-world\nfoo-bar');
  } else if (path === '/mcp/tool') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Advice about ${product}`);
  } else if (path === '/mcp/resource') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Details about ${product}`);
  } else if (path === '/redirect') {
    res.writeHead(303, { 'Location': 'http://localhost/elsewhere' });
    res.end('');
  } else {
    res.writeHead(404, { 'X-Zerocracy-Failure': `No page at ${path}` });
    res.end('');
  }
};

// A fake Baza endpoint, bound to an ephemeral local port,
// that lets the tests exercise the real fetch logic of
// the baza function without ever reaching the Internet.
export class FakeBaza {
  private readonly http: Server;
  constructor() {
    this.http = createServer(route);
  }
  async start(): Promise<string> {
    await new Promise<void>((resolve): void => {
      this.http.listen(0, '127.0.0.1', resolve);
    });
    const addr = this.http.address();
    if (addr === null || typeof addr === 'string') {
      throw new Error('FakeBaza is not listening on a TCP port');
    }
    return `http://127.0.0.1:${addr.port}`;
  }
  async close(): Promise<void> {
    await new Promise<void>((resolve): void => {
      this.http.close((): void => resolve());
    });
  }
}
