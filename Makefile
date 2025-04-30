# SPDX-FileCopyrightText: Copyright (c) 2025 Zerocracy
# SPDX-License-Identifier: MIT

.PHONY: all test lint it tsc
.ONESHELL:
.SHELLFLAGS := -e -o pipefail -c
.SECONDARY:
SHELL := bash
TSS=$(shell find . -not -path './node_modules/**' -not -path './test/**' -name '*.ts')

all: test lint it tsc

lint:
	npx -y eslint . --config eslint.config.mjs

test:
	npx -y jest --preset ts-jest --no-color --ci

it:
	mkdir -p temp
	npx -y @modelcontextprotocol/inspector \
		--config fixtures/claude-desktop-config.json \
		--server zerocracy \
		--cli --method tools/list > temp/tools.json
	if ! jq empty temp/tools.json; then
		cat temp/tools.json
		./index.ts
		exit 1
	fi

tsc: $(TSS)
	npx -y tsc --target es2020 --module nodenext --outDir dist $(TSS)
