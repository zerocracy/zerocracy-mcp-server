// SPDX-FileCopyrightText: Copyright (c) 2025-2026 Zerocracy
// SPDX-License-Identifier: MIT

import { z } from 'zod';
import { baza } from './baza.js';
import { to_gpt } from './to_gpt.js';
import { server } from './server.js';

// @ts-ignore Zod v3/v4 type compat with SDK v1.29
server.registerTool(
  'give_management_advice',
  {
    description: to_gpt(
      `
      Analyze the most critical concern related to product development,
      providing clear insights into the underlying issues, identifying areas for
      improvement, and outlining specific corrective and preventive actions. The
      objective is to directly address and resolve this concern, helping the team
      become more productive, focused, and result-oriented. These recommendations can
      later be converted into new GitHub issues or added as comments to existing
      issues or pull requests.
      `
    ),
    inputSchema: { concern: z.string(), product: z.string() }
  },
  // @ts-ignore TS2589 type depth
  async ({ concern, product }: { concern: string; product: string }) => {
    return ({
      content: [{
        text: await baza(
          '/mcp/tool', 'PUT',
          { name: 'advice', product: product },
          concern
        ),
        type: 'text'
      }]
    });
  }
);
