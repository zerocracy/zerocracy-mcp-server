# MCP Server for Zerocracy

[![DevOps By Rultor.com](https://www.rultor.com/b/zerocracy/zerocracy-mcp-server)](https://www.rultor.com/p/zerocracy/zerocracy-mcp-server)

[![make](https://github.com/zerocracy/zerocracy-mcp-server/actions/workflows/make.yml/badge.svg)](https://github.com/zerocracy/zerocracy-mcp-server/actions/workflows/make.yml)
[![Hits-of-Code](https://hitsofcode.com/github/zerocracy/zerocracy-mcp-server)](https://hitsofcode.com/view/github/zerocracy/zerocracy-mcp-server)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/zerocracy/zerocracy-mcp-server/blob/master/LICENSE.txt)

Add the following to the `claude-desktop-config.json` file
(if you are with [Claude Desktop]):

```json
{
  "mcpServers": {
    "zerocracy": {
      "args": [
        "-y",
        "zerocracy/zerocracy-mcp-server",
        "--token",
        "48cfeb80-a777-4333-b39b-9f65f9bdfdaa"
      ],
      "command": "npx"
    }
  }
}
```

The token you get from [Zerocracy].

## How to Contribute

In order to test this action, just run (provided, you have
[Node]() 18+, Npm,
and [GNU make](https://www.gnu.org/software/make/) installed):

```bash
npm install
make
```

If it builds after your changes, submit a pull request.

[Claude Desktop]: https://claude.ai/download
[Zerocracy]: https://www.zerocracy.com
