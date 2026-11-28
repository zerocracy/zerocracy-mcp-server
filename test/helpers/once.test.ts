// SPDX-FileCopyrightText: Copyright (c) 2025-2026 Zerocracy
// SPDX-License-Identifier: MIT

import { describe, expect, test } from '@jest/globals';
import { server } from '../../src/server.js';
import { once } from './once.js';

describe('once', () => {
  test('answers the request and disconnects', async (): Promise<void> => {
    const answer = await once({ jsonrpc: '2.0' as const, id: 1, method: 'prompts/list' });
    expect(answer).toHaveProperty('result');
    expect(server.isConnected()).toBe(false);
  });

  test('serves a second request without a stale connection', async (): Promise<void> => {
    await once({ jsonrpc: '2.0' as const, id: 1, method: 'prompts/list' });
    const answer = await once({ jsonrpc: '2.0' as const, id: 2, method: 'prompts/list' });
    expect(answer).toHaveProperty('result');
  });
});
