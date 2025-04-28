// SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
// SPDX-License-Identifier: MIT

const { configs } = require('@eslint/js');

module.exports = [
  {
    ...configs.all,
    files: ['**.js', '**.ts'],
    ignores: ['dist/', 'node_modules/'],
    languageOptions: {
      ecmaVersion: 2019,
      sourceType: 'module'
    },
    rules: {
      ...configs.all.rules,
      'capitalized-comments': 'off',
      'no-magic-numbers': 'off',
      'indent': ['error', 2],
      'max-len': ['error', { code: 100 }]
    }
  }
];
