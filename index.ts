#!/usr/bin/env npx tsx

// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from './src/server';

(async (): Promise<void> => {
  await server.connect(new StdioServerTransport());
})();
