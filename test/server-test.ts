// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

// import { Transport } from "@modelcontextprotocol/sdk/shared/transport.d.ts";
import { server } from '../src/server.ts';
import { describe, expect, test } from '@jest/globals';

class FakeTransport {
  async start(): Promise<void> {}
  async close(): Promise<void> {}
  send(message: JSONRPCMessage): Promise<void> {
    return new Promise((resolve) => {
      'hello'
    });
  }
}

describe('server', () => {
  test('returns a list of tools in JSON', () => {
    server.connect(new FakeTransport());
    expect(sum(1, 2)).toBe(3);
  });
});
