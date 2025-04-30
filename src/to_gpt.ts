// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

export const to_gpt = function(txt: string): string {
  return txt
    .replace(/\s+/, ' ')
    .replace(/ (\?|!|\|,|:)/, '\1')
    .trim();
}
