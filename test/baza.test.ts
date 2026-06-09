// SPDX-FileCopyrightText: Copyright (c) 2025-2026 Zerocracy
// SPDX-License-Identifier: MIT

import { afterAll, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import { baza } from '../src/baza';
import { FakeBaza } from './fakes/FakeBaza';

const hasToken = (): boolean => {
  const token = process.env.ZEROCRACY_TOKEN;
  return token !== undefined && token !== '00000000-0000-0000-0000-000000000000';
};

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
    process.env.ZEROCRACY_TOKEN = '00000000-0000-0000-0000-000000000000';
  });

  test('throws when ZEROCRACY_TOKEN is not set', async (): Promise<void> => {
    delete process.env.ZEROCRACY_HOST;
    delete process.env.ZEROCRACY_TOKEN;
    await expect(
      baza('/robots.txt', 'GET', {}, '')
    ).rejects.toThrow('You must set ZEROCRACY_TOKEN environment variable');
  });

  test('fetches plain text', async () => {
    if (!hasToken()) {
      return;
    }
    const body = await baza('/robots.txt', 'GET', {}, '');
    expect(body).toContain('Disallow');
  });

  test('fetches non-existing page', async () => {
    if (!hasToken()) {
      return;
    }
    await expect(
      baza('/this/path/does/not/exist', 'POST', {}, 'boom')
    ).rejects.toThrow('HTTP error 404');
  });

  test('does not follow redirects', async () => {
    if (!hasToken()) {
      return;
    }
    await expect(
      baza('/redirect', 'PUT', {}, '')
    ).rejects.toThrow('HTTP error 303');
  });
});
