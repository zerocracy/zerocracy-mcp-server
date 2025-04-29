#! /usr/bin/env npx ts-node

// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from './src/server.ts';

await server.connect(new StdioServerTransport());
