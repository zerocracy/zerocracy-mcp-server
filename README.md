[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/zerocracy-zerocracy-mcp-server-badge.png)](https://mseep.ai/app/zerocracy-zerocracy-mcp-server)

# MCP Server for Zerocracy

[![DevOps By Rultor.com](https://www.rultor.com/b/zerocracy/zerocracy-mcp-server)](https://www.rultor.com/p/zerocracy/zerocracy-mcp-server)

[![make](https://github.com/zerocracy/zerocracy-mcp-server/actions/workflows/make.yml/badge.svg)](https://github.com/zerocracy/zerocracy-mcp-server/actions/workflows/make.yml)
[![codecov](https://codecov.io/gh/zerocracy/zerocracy-mcp-server/branch/master/graph/badge.svg)](https://codecov.io/gh/zerocracy/zerocracy-mcp-server)
[![Hits-of-Code](https://hitsofcode.com/github/zerocracy/zerocracy-mcp-server)](https://hitsofcode.com/view/github/zerocracy/zerocracy-mcp-server)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/zerocracy/zerocracy-mcp-server/blob/master/LICENSE.txt)

If you let Zerocracy help manage your product development,
you may also enjoy integrating its management advice into your
AI agent. For example, [Claude Desktop] becomes smarter when connected
to Zerocracy via this [MCP] server.
Add the following configuration to the `claude-desktop-config.json` file
of [Claude Desktop] (you can get the token from [Zerocracy]):

```json
{
  "mcpServers": {
    "zerocracy": {
      "command": "npx",
      "args": [
        "-y",
        "zerocracy/zerocracy-mcp-server",
      ],
      "env": {
        "ZEROCRACY_TOKEN": "<YOUR-ZEROCRACY-TOKEN>"
      }
    }
  }
}
```

Then, restart [Claude Desktop] and ask it something along these lines:
"How is the development of my product progressing? Give me management advice."
If you add the [GitHub MCP server] too,
you can truly enjoy AI-driven vibe-management.

## How to Contribute

To test this project, simply run the following commands (you'll need
[Node] 18+, [Npm], and [GNU make] installed):

```bash
npm install
make
```

If everything builds correctly after your changes, submit a pull request.

[MCP]: https://modelcontextprotocol.io/
[Npm]: https://www.npmjs.com/
[Node]: https://nodejs.org/en
[Claude Desktop]: https://claude.ai/download
[Zerocracy]: https://www.zerocracy.com
[GNU make]: https://www.gnu.org/software/make/
[GitHub MCP server]: https://github.com/github/github-mcp-server
