// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { to_gpt } from './to_gpt';
import { server } from './server';

server.prompt(
  'investigate-productivity-bottlenecks',
  { product: z.string() },
  ({ product }) => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: to_gpt(
          `
          I'm seriously concerned about the lackluster productivity in the development
            of "${product}" under the supervision of Zerocracy.
          The team is clearly underperforming, and this needs to change immediately.
          I want one concrete action—no fluff, no vague suggestions.
          Should we overhaul the roadmap, tighten CI/CD,
            enforce stricter code reviews, raise rewards, or ramp up consequences?
          Give me one specific, high-impact recommendation in a short, straight-to-the-point paragraph.
          `
        )
      }
    }]
  })
);
