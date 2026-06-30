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

  test('wraps network failures', async (): Promise<void> => {
    const failure = new TypeError('fetch failed');
    const fetch = jest.spyOn(globalThis, 'fetch').mockRejectedValue(failure);
    let thrown: unknown;
    try {
      await baza('/robots.txt', 'GET', {}, '');
    } catch (error: unknown) {
      thrown = error;
    } finally {
      fetch.mockRestore();
    }
    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe(
      `Network failure for GET ${host}/robots.txt?: fetch failed`
    );
    expect(Object.getOwnPropertyDescriptor(thrown, 'cause')?.value).toBe(failure);
  });

  test('wraps non-error network failures', async (): Promise<void> => {
    const fetch = jest.spyOn(globalThis, 'fetch').mockRejectedValue('socket closed');
    try {
      await expect(
        baza('/robots.txt', 'GET', {}, '')
      ).rejects.toThrow(`Network failure for GET ${host}/robots.txt?: socket closed`);
    } finally {
      fetch.mockRestore();
    }
  });

  test('does not follow redirects', async () => {
    await expect(
      baza('/redirect', 'PUT', {}, '')
    ).rejects.toThrow('HTTP error 303');
  });
});
