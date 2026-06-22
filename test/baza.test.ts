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
});
