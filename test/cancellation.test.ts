// SPDX-FileCopyrightText: Copyright (c) 2025-2026 Zerocracy
// SPDX-License-Identifier: MIT

import { describe, expect, jest, test } from '@jest/globals';
import { createServer } from 'node:http';
import { AddressInfo } from 'node:net';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { server } from '../src/server.js';
import '../src/tools.js';
import '../src/resources.js';

describe('MCP cancellation', () => {
  test.each(['tool', 'tool-body', 'list', 'read'])(
    'closes the pending %s HTTP response and permits a later request',
    async (operation) => {
      const previous = { host: process.env.ZEROCRACY_HOST, token: process.env.ZEROCRACY_TOKEN };
      let received!: () => void;
      let disconnected!: () => void;
      const arrived = new Promise<void>((resolve) => { received = resolve; });
      const closed = new Promise<void>((resolve) => { disconnected = resolve; });
      let headersReceived!: () => void;
      const headers = new Promise<void>((resolve) => { headersReceived = resolve; });
      const nativeFetch = globalThis.fetch;
      const fetch = jest.spyOn(globalThis, 'fetch').mockImplementation(async (...args) => {
        const response = await nativeFetch(...args);
        headersReceived();
        return response;
      });
      let stalled = true;
      const http = createServer((_request, response) => {
        if (stalled) {
          response.once('close', disconnected);
          if (operation === 'tool-body') {
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            response.write('unfinished');
          }
          received();
          return;
        }
        response.end('product1');
      });
      await new Promise<void>((resolve) => http.listen(0, '127.0.0.1', resolve));
      process.env.ZEROCRACY_HOST = `http://127.0.0.1:${(http.address() as AddressInfo).port}`;
      process.env.ZEROCRACY_TOKEN = 'test-only';
      const client = new Client({ name: 'cancellation-test', version: '0.0.0' });
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      let deadline: ReturnType<typeof setTimeout> | undefined;
      try {
        await server.close();
        await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
        const cancellation = new AbortController();
        const options = { signal: cancellation.signal };
        const result = operation === 'list'
          ? client.listResources(undefined, options)
          : operation === 'read'
            ? client.readResource({ uri: 'products://product1' }, options)
            : client.callTool({
              name: 'give_management_advice',
              arguments: { product: 'product1', concern: 'delayed release' }
            }, undefined, options);
        const rejected = expect(result).rejects.toThrow();
        await arrived;
        if (operation === 'tool-body') {
          await headers;
        }
        cancellation.abort();
        await rejected;
        await Promise.race([
          closed,
          new Promise<void>((_resolve, reject) => {
            deadline = setTimeout(() => {
              reject(new Error('HTTP response stayed open after cancellation'));
            }, 1000);
          })
        ]);
        clearTimeout(deadline);
        stalled = false;
        const next = await client.listResources();
        expect(next.resources.map((resource) => resource.name)).toEqual(['product1']);
      } finally {
        clearTimeout(deadline);
        fetch.mockRestore();
        await client.close();
        await server.close();
        http.closeAllConnections();
        await new Promise<void>((resolve) => http.close(() => resolve()));
        if (previous.host === undefined) {
          delete process.env.ZEROCRACY_HOST;
        } else {
          process.env.ZEROCRACY_HOST = previous.host;
        }
        if (previous.token === undefined) {
          delete process.env.ZEROCRACY_TOKEN;
        } else {
          process.env.ZEROCRACY_TOKEN = previous.token;
        }
      }
    }
  );
});
