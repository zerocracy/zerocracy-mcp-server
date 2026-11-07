// SPDX-FileCopyrightText: Copyright (c) 2025-2026 Zerocracy
// SPDX-License-Identifier: MIT

import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { createServer } from 'node:http';
import { baza } from '../src/baza.js';
import { FakeBaza } from './fakes/FakeBaza.js';

describe('baza', () => {
  const fake = new FakeBaza();
  let host = '';

  beforeAll(async (): Promise<void> => {
    host = await fake.start();
  });

  afterAll(async (): Promise<void> => {
    delete process.env.ZEROCRACY_TIMEOUT_MS;
    await fake.close();
  });

  beforeEach(() => {
    delete process.env.ZEROCRACY_TIMEOUT_MS;
    process.env.ZEROCRACY_HOST = host;
    process.env.ZEROCRACY_TOKEN = 'test-token';
  });

  test('throws when ZEROCRACY_TOKEN is not set', async (): Promise<void> => {
    delete process.env.ZEROCRACY_HOST;
    delete process.env.ZEROCRACY_TOKEN;
    await expect(
      baza('/robots.txt', 'GET', {}, '')
    ).rejects.toThrow('You must set ZEROCRACY_TOKEN environment variable');
  });

  test('fetches plain text', async () => {
    const body = await baza('/robots.txt', 'GET', {}, '');
    expect(body).toContain('Disallow');
  });

  test('fetches non-existing page', async () => {
    await expect(
      baza('/this/path/does/not/exist', 'POST', {}, 'boom')
    ).rejects.toThrow('HTTP error 404');
  });

  test('does not follow redirects', async () => {
    await expect(
      baza('/redirect', 'PUT', {}, '')
    ).rejects.toThrow('HTTP error 303');
  });

  test('wraps network failures in typed Error', async () => {
    const mock = jest.spyOn(globalThis, 'fetch');
    mock.mockRejectedValue(new TypeError('fetch failed'));
    try {
      await expect(baza('/test', 'GET', {}, '')).rejects.toThrow(Error);
      await expect(baza('/test', 'GET', {}, '')).rejects.toThrow(
        'Network failure for GET'
      );
    } finally {
      mock.mockRestore();
    }
  });

  test.each(['stalled-headers', 'stalled-body'])(
    'times out a request with %s and serves the next request', async (path) => {
      process.env.ZEROCRACY_TIMEOUT_MS = '100';
      await expect(baza(`/${path}`, 'GET', {}, '')).rejects.toThrow(
        `Network failure for GET ${host}/${path}?: timed out after 100ms`
      );
      expect(await baza('/robots.txt', 'GET', {}, '')).toContain('Disallow');
    }
  );

  test.each(['0', '-1', 'not-a-number', '1.5', '2147483648'])(
    'rejects invalid request timeout %s', async (timeout) => {
      process.env.ZEROCRACY_TIMEOUT_MS = timeout;
      await expect(baza('/robots.txt', 'GET', {}, '')).rejects.toThrow(
        'ZEROCRACY_TIMEOUT_MS must be an integer between 1 and 2147483647'
      );
    }
  );

  test('closes an unfinished HTTP error body', async () => {
    let disconnected: () => void = () => undefined;
    const closed = new Promise<void>((resolve) => { disconnected = resolve; });
    const http = createServer((_request, response) => {
      response.on('close', disconnected);
      response.writeHead(503, { 'X-Zerocracy-Failure': 'unavailable' });
      response.write('unfinished error body');
    });
    await new Promise<void>((resolve) => { http.listen(0, '127.0.0.1', resolve); });
    const address = http.address();
    if (address === null || typeof address === 'string') {
      throw new Error('No test server address');
    }
    process.env.ZEROCRACY_HOST = `http://127.0.0.1:${address.port}`;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    try {
      await expect(baza('/error', 'GET', {}, '')).rejects.toThrow('HTTP error 503: unavailable');
      await Promise.race([
        closed,
        new Promise<void>((_resolve, reject) => {
          deadline = setTimeout(() => reject(new Error('Error body connection stayed open')), 500);
        })
      ]);
    } finally {
      clearTimeout(deadline);
      http.closeAllConnections();
      await new Promise<void>((resolve) => { http.close(() => resolve()); });
    }
  });

  test.each([new Error('cancelled by caller'), 'cancelled by caller'])(
    'preserves cancellation that precedes the request (%p)', async (reason) => {
      const cancellation = new AbortController();
      cancellation.abort(reason);
      await expect(baza('/robots.txt', 'GET', {}, '', cancellation.signal)).rejects.toThrow(
        'cancelled by caller'
      );
    }
  );

  test('keeps the timeout when the caller does not cancel', async () => {
    process.env.ZEROCRACY_TIMEOUT_MS = '100';
    const cancellation = new AbortController();
    await expect(baza('/stalled-headers', 'GET', {}, '', cancellation.signal)).rejects.toThrow(
      'timed out after 100ms'
    );
    expect(cancellation.signal.aborted).toBe(false);
  });
});
