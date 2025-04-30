// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import { z } from 'zod';
import { baza } from './baza';
import { to_gpt } from './to_gpt';
import { server } from './server';

server.tool(
  'give_management_advice',
  to_gpt(
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
  { concern: z.string(), product: z.string() },
  async ({ concern, product }) => {
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
