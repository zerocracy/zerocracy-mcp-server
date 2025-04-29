// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { describe, expect, test } from '@jest/globals';
import { server } from '../src/server';

class FakeTransport {
  async start(): Promise<void> {}
  async close(): Promise<void> {}
  send(message: JSONRPCMessage): Promise<void> {
    return new Promise((resolve) => {
      resolve();
    });
  }
}

describe('server', () => {
  test('connects to transport', async () => {
    const transport = new FakeTransport();
    await server.connect(transport);
    expect(server.isConnected()).toBe(true);
  });
});
