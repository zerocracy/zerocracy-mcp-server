# SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
# SPDX-License-Identifier: MIT

.PHONY: all test

all: test

lint:
	eslint

test:
	npx ts-node test/server-test.ts

it:
	npx @modelcontextprotocol/inspector --cli node index.ts --method tools/list
