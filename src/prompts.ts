// SPDX-FileCopyrightText: Copyright (c) 2025-2026 Zerocracy
// SPDX-License-Identifier: MIT

import { z } from 'zod';
import { to_gpt } from './to_gpt.js';
import { server } from './server.js';

// @ts-ignore Zod v3/v4 type compat with SDK v1.29
server.registerPrompt(
  'investigate-productivity-bottlenecks',
  { argsSchema: { product: z.string() } },
  ({ product }: { product: string }) => ({
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
          Give me one specific, high-impact recommendation in a short,
            straight-to-the-point paragraph.
          `
        )
      }
    }]
  })
);
