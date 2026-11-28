// SPDX-FileCopyrightText: Copyright (c) 2025-2026 Zerocracy
// SPDX-License-Identifier: MIT

import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { baza } from '../src/baza.js';
import { FakeBaza } from './fakes/FakeBaza.js';

describe('baza', () => {
  const fake = new FakeBaza();
  let host = '';

  beforeAll(async (): Promise<void> => {
    host = await fake.start();
  });

  afterAll(async (): Promise<void> => {
    await fake.close();
  });

  beforeEach(() => {
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

  test('retries a 503 and then succeeds', async (): Promise<void> => {
    const mock = jest.spyOn(globalThis, 'fetch');
    mock
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(new Response('recovered', { status: 200 }));
    try {
      expect(await baza('/test', 'GET', {}, '')).toBe('recovered');
      expect(mock).toHaveBeenCalledTimes(2);
    } finally {
      mock.mockRestore();
    }
  });

  test('honors Retry-After seconds', async (): Promise<void> => {
    const mock = jest.spyOn(globalThis, 'fetch');
    mock
      .mockResolvedValueOnce(new Response('', {
        status: 503, headers: { 'Retry-After': '1' }
      }))
      .mockResolvedValueOnce(new Response('done', { status: 200 }));
    const start = Date.now();
    try {
      expect(await baza('/test', 'GET', {}, '')).toBe('done');
      expect(Date.now() - start).toBeGreaterThanOrEqual(900);
    } finally {
      mock.mockRestore();
    }
  });

  test('honors Retry-After HTTP-date', async (): Promise<void> => {
    const mock = jest.spyOn(globalThis, 'fetch');
    mock
      .mockResolvedValueOnce(new Response('', {
        status: 503,
        headers: { 'Retry-After': new Date(Date.now() + 2000).toUTCString() }
      }))
      .mockResolvedValueOnce(new Response('done', { status: 200 }));
    const start = Date.now();
    try {
      expect(await baza('/test', 'GET', {}, '')).toBe('done');
      expect(Date.now() - start).toBeGreaterThanOrEqual(900);
    } finally {
      mock.mockRestore();
    }
  });

  test('does not retry a permanent 4xx', async (): Promise<void> => {
    const mock = jest.spyOn(globalThis, 'fetch');
    mock.mockResolvedValue(new Response('', {
      status: 404, headers: { 'X-Zerocracy-Failure': 'No such page' }
    }));
    try {
      await expect(baza('/test', 'GET', {}, '')).rejects.toThrow(
        'HTTP error 404: No such page'
      );
      expect(mock).toHaveBeenCalledTimes(1);
    } finally {
      mock.mockRestore();
    }
  });

  test('does not retry a non-idempotent POST', async (): Promise<void> => {
    const mock = jest.spyOn(globalThis, 'fetch');
    mock.mockResolvedValue(new Response('', {
      status: 503, headers: { 'Retry-After': '0' }
    }));
    try {
      await expect(baza('/test', 'POST', {}, 'boom')).rejects.toThrow(
        'HTTP error 503'
      );
      expect(mock).toHaveBeenCalledTimes(1);
    } finally {
      mock.mockRestore();
    }
  });

  test('gives up after a bounded number of retries', async (): Promise<void> => {
    const mock = jest.spyOn(globalThis, 'fetch');
    mock.mockResolvedValue(new Response('', { status: 503 }));
    const start = Date.now();
    try {
      await expect(baza('/test', 'GET', {}, '')).rejects.toThrow(
        'HTTP error 503'
      );
      expect(mock).toHaveBeenCalledTimes(4);
      expect(Date.now() - start).toBeGreaterThanOrEqual(1700);
    } finally {
      mock.mockRestore();
    }
  });

  test('falls back to backoff when Retry-After is unusable', async (): Promise<void> => {
    const mock = jest.spyOn(globalThis, 'fetch');
    mock
      .mockResolvedValueOnce(new Response('', {
        status: 503, headers: { 'Retry-After': 'soon' }
      }))
      .mockResolvedValueOnce(new Response('', {
        status: 503, headers: { 'Retry-After': '-5' }
      }))
      .mockResolvedValueOnce(new Response('done', { status: 200 }));
    const start = Date.now();
    try {
      expect(await baza('/test', 'GET', {}, '')).toBe('done');
      expect(mock).toHaveBeenCalledTimes(3);
      expect(Date.now() - start).toBeGreaterThanOrEqual(700);
    } finally {
      mock.mockRestore();
    }
  });

  test('retries a 429 on PUT', async (): Promise<void> => {
    const mock = jest.spyOn(globalThis, 'fetch');
    mock
      .mockResolvedValueOnce(new Response('', {
        status: 429, headers: { 'Retry-After': '0' }
      }))
      .mockResolvedValueOnce(new Response('done', { status: 200 }));
    try {
      expect(await baza('/test', 'PUT', {}, 'body')).toBe('done');
      expect(mock).toHaveBeenCalledTimes(2);
    } finally {
      mock.mockRestore();
    }
  });

  test('caps a huge Retry-After', async (): Promise<void> => {
    jest.useFakeTimers();
    const mock = jest.spyOn(globalThis, 'fetch');
    try {
      mock
        .mockResolvedValueOnce(new Response('', {
          status: 503, headers: { 'Retry-After': '3600' }
        }))
        .mockResolvedValueOnce(new Response('done', { status: 200 }));
      const call = baza('/test', 'GET', {}, '');
      await jest.advanceTimersByTimeAsync(10000);
      expect(await call).toBe('done');
      expect(mock).toHaveBeenCalledTimes(2);
    } finally {
      mock.mockRestore();
      jest.useRealTimers();
    }
  });
});
