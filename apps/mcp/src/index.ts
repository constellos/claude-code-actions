import { Elysia } from "elysia";

const PORT = process.env.PORT || 3002;

// Tool definitions
const TOOLS = [
  {
    name: "list_actions",
    description: "List available Claude Code actions",
    inputSchema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          description: "Filter by action type",
        },
        limit: {
          type: "number",
          description: "Maximum number of actions to return (default: 20)",
        },
      },
    },
  },
  {
    name: "run_action",
    description: "Execute a Claude Code action",
    inputSchema: {
      type: "object" as const,
      properties: {
        action_id: {
          type: "string",
          description: "The action ID to execute",
        },
        params: {
          type: "object",
          description: "Parameters for the action",
        },
      },
      required: ["action_id"],
    },
  },
];

// Tool handlers
async function handleToolCall(name: string, args: Record<string, unknown>) {
  if (name === "list_actions") {
    const { type, limit = 20 } = args as { type?: string; limit?: number };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            actions: [],
            total: 0,
            filters: { type, limit },
          }),
        },
      ],
    };
  }

  if (name === "run_action") {
    const { action_id, params } = args as { action_id: string; params?: object };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            action_id,
            status: "completed",
            result: { success: true },
          }),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
}

// Create Elysia app with MCP endpoints
const app = new Elysia()
  .get("/", () => ({
    name: "claude-code-actions-mcp",
    version: "0.1.0",
    status: "running",
    tools: TOOLS.map((t) => t.name),
  }))
  .get("/health", () => ({ status: "ok" }))
  .post("/mcp", async ({ body, set }) => {
    try {
      const request = body as {
        jsonrpc: string;
        id: number | string;
        method: string;
        params?: any;
      };

      if (request.method === "initialize") {
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { name: "claude-code-actions-mcp", version: "0.1.0" },
          },
        };
      }

      if (request.method === "notifications/initialized") {
        return { jsonrpc: "2.0", id: request.id, result: {} };
      }

      if (request.method === "tools/list") {
        return { jsonrpc: "2.0", id: request.id, result: { tools: TOOLS } };
      }

      if (request.method === "tools/call") {
        const { name, arguments: args } = request.params || {};
        const result = await handleToolCall(name, args || {});
        return { jsonrpc: "2.0", id: request.id, result };
      }

      return {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32601, message: "Method not found" },
      };
    } catch (err) {
      set.status = 500;
      return {
        jsonrpc: "2.0",
        id: (body as any)?.id || null,
        error: { code: -32603, message: err instanceof Error ? err.message : "Internal error" },
      };
    }
  })
  .listen(PORT);

console.log(`Claude Code Actions MCP server running at http://localhost:${PORT}`);

export type App = typeof app;
