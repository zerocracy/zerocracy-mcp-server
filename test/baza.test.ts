// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { baza } from '../src/baza';

describe('baza', () => {
  const before = process.env.ZEROCRACY_TOKEN;

  beforeEach(() => {
    process.env.ZEROCRACY_TOKEN = '00000000-0000-0000-0000-000000000000';
  });

  afterEach(() => {
    if (before === undefined) {
      delete process.env.ZEROCRACY_TOKEN;
    } else {
      process.env.ZEROCRACY_TOKEN = before;
    }
  });

  test('throws when ZEROCRACY_TOKEN is not set', async (): Promise<void> => {
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
      'Network failure for GET https://www.zerocracy.com/robots.txt?: fetch failed'
    );
    expect(Object.getOwnPropertyDescriptor(thrown, 'cause')?.value).toBe(failure);
  });

  test('does not follow redirects', async () => {
    await expect(
      baza('/mcp/tool', 'PUT', {}, '')
    ).rejects.toThrow('HTTP error 303');
  });
});
