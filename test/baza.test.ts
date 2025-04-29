// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import { describe, expect, test } from '@jest/globals';
import { baza } from '../src/baza';

describe('baza', () => {
  test('fetches plain text', async () => {
    const body = await baza('/robots.txt', 'GET', {}, '');
    expect(body).toContain('Disallow');
  });

  test('fetches non-existing page', async () => {
    await expect(
      baza('this/path/does/not/exist', 'GET', {}, '')
    ).rejects.toThrow('HTTP error 404');
  });
});
