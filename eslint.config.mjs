// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

import ts from 'typescript-eslint';
const [config] = await ts.configs.recommended;

export default [
  {
    ignores: ['dist/', 'node_modules/']
  },
  {
    ...config,
    files: ['**/*.ts'],
    languageOptions: {
      parser: ts.parser,
      ecmaVersion: 2022,
      sourceType: 'module'
    },
    rules: {
      ...config.rules,
      'indent': ['error', 2],
      'max-len': ['error', { code: 100 }],
      'no-magic-numbers': 'off'
    }
  }
];
