# Web Compliance MCP

An optional, local **stdio MCP server** for compatible coding assistants. It exposes the toolkit as four read-only tools. The regular [browser studio](https://ward3107.github.io/web-compliance-prompts/) remains the easiest route for customers and needs no MCP, Node, account or terminal.

[Guided connection page](https://ward3107.github.io/web-compliance-prompts/connect.html) · [Download the MCP ZIP](https://ward3107.github.io/web-compliance-prompts/web-compliance-mcp.zip)

## Connect without an npm installation

1. Install a maintained **Node.js 22+** runtime if your coding environment does not already have one. Use the [official Node distribution](https://nodejs.org/en/download). The MCP process needs Node; the banner and browser studio do not.
2. Download the MCP ZIP and extract **all files** to a permanent folder on the machine/environment running your assistant. Keep the relative folders intact. No `npm install`, build, account, API key or external package is required.
3. Open the connection page, select your client and paste the absolute path to `mcp/server.mjs`. It creates a JSON configuration locally, including correct escaping for Windows paths.
4. Add the generated `web-compliance` entry to the appropriate configuration file. Preserve any existing servers. Restart/reconnect the client, review its trust prompt and confirm the four tools appear.
5. Ask: “Use web-compliance. Show what is available, ask about my website, language and privacy policy, then prepare a banner. Show the proposed changes before editing my site. Do not guess missing facts.”

### Claude Code and portable VS Code/Copilot configuration

Save/merge into `.mcp.json` at your **website project's root**, replacing the example absolute path:

```json
{
  "mcpServers": {
    "web-compliance": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/web-compliance-mcp/mcp/server.mjs"]
    }
  }
}
```

Windows paths also work, for example `"C:\\Tools\\web-compliance-mcp\\mcp\\server.mjs"`. If the client cannot locate `node`, replace `command` with its absolute executable path. Arguments are separate values, not a shell command. For remote workspaces, paths and Node must exist in the remote environment where MCP runs.

VS Code's older `.vscode/mcp.json` format uses `servers` instead of `mcpServers`; the connection page can generate that format too. In VS Code, use **MCP: List Servers** to inspect/start the server. In Claude Code, use **/mcp** to inspect it. Other clients may use different settings files; copy `command` and `args` according to their stdio MCP documentation. A remote HTTP connector field cannot run this local server.

### Existing Claude Code plugin

The `web-compliance` plugin includes this MCP server in its manifest. Enabling/updating the plugin starts the local server through Node, alongside its prompt skill. Do not also add the standalone configuration unless you intend duplicate tools. Disable the server/plugin through Claude Code to stop it. The plugin is optional; the standalone ZIP works independently of the marketplace.

## Available tools

| Tool | Input | Result |
|---|---|---|
| `list_templates` | None | 13 template IDs/scopes, 6 jurisdiction codes, 12 theme IDs and guidance |
| `get_template` | Allowlisted `id` | Bundled prompt source and scope; placeholders require real facts |
| `get_jurisdiction` | Allowlisted `code` | Bundled YAML source pack with review status and source links |
| `prepare_banner` | `language`, `theme`, `privacyPolicyUrl`, `platform` | File names and contents for a universal or WordPress banner, as text |

Languages: `he`, `ar`, `en`, `ru`. Platforms: `universal`, `wordpress`. Read the theme list before choosing. Supply an existing relative policy path such as `/privacy`, or an HTTP(S) URL without credentials. The server does not fetch or verify that page. The universal output contains four runtime files, a snippet, local preview, license and instructions. The WordPress output contains the canonical PHP adapter too. All exported consent starts in opt-in mode for every visitor.

The coding assistant may write these returned files using **its own tools**, subject to its permissions and your instructions. The MCP server itself never writes files or installs anything. Review proposed edits, then verify trackers, consent withdrawal, keyboard/mobile behavior and the real policy link. Installing the banner does not automatically block existing trackers or publish legal pages.

## Protocol and security boundaries

- Newline-delimited UTF-8 JSON-RPC over stdin/stdout; no HTTP listener, outbound requests, telemetry, shell execution, credentials or configurable file paths.
- Implements `initialize`, `notifications/initialized`, `ping`, `tools/list` and `tools/call`. Supports protocol revisions `2024-11-05`, `2025-03-26`, `2025-06-18`, `2025-11-25`; an unknown revision negotiates `2025-11-25`. Clients must support one of these initialized-session revisions. This is not a claim to implement every optional MCP capability or newer discovery protocol.
- Strict tool enums, required fields, extra-field rejection and URL validation. Input capped at 64 KiB per line, output capped at 512 KiB; sequential processing respects output backpressure. Malformed messages do not become executable code. Tool annotations declare read-only, idempotent, closed-world behavior.
- Reads only the fixed shipped template/pack/runtime files relative to the server; it does not accept filesystem paths from tools or inspect your repository. Package integrity and the installed Node/client remain trust boundaries.
- Legal packs are unreviewed and may become stale. No scan, legal approval, accessibility certification or automatic production deployment is provided.
- Tool results and any facts you share with your assistant may be sent to its AI provider. The server's lack of network requests does not make the coding assistant private or offline.
- To uninstall, remove the `web-compliance` configuration entry (or disable/uninstall the Claude Code plugin), stop the process and delete the extracted folder. This does not remove any code your assistant applied to your website.

## Verification and official references

`node --test tests/mcp.test.cjs` exercises the actual stdio subprocess, negotiation, framing, bounds, unknown tools, path/URL rejection and output files. The browser experience suite also extracts the published MCP ZIP and runs the same tests against that copy from an unrelated working directory. The configuration page is tested in browser automation. Actual authenticated Claude Code/VS Code sessions are not part of these automated tests; client configuration follows their official documentation.

- [MCP stdio transport](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
- [MCP lifecycle/version negotiation](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle)
- [MCP tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
- [Claude Code configuration](https://code.claude.com/docs/en/mcp)
- [Claude plugin manifest](https://code.claude.com/docs/en/plugins-reference)
- [VS Code MCP configuration](https://code.visualstudio.com/docs/agent-customization/mcp-servers)
