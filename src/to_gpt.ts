// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

// Replace all whitespace with a single space and remove spaces before punctuation
export const to_gpt = function(txt: string): string {
  return txt
    .replace(/\s+/g, ' ')
    .replace(/ (\?|!|\|,|:)/g, '$1')
    .trim();
}
