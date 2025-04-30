// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";

export class FakeTransport {
  async start(): Promise<void> {}
  async close(): Promise<void> {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  send(_message: JSONRPCMessage): Promise<void> {
    return new Promise((resolve) => {
      resolve();
    });
  }
}
