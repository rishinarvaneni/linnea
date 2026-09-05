#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { db as prisma } from '../src/lib/db';
import { McpProtocolAdapter } from '../src/lib/agent-commerce/mcp-adapter';
import { CommerceEngine } from '../src/lib/agent-commerce/commerce-engine';
import { TrustedCommerceContext } from '../src/lib/agent-commerce/types';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MCP_MERCHANT_ID = process.env.MCP_MERCHANT_ID as string;
const MCP_AI_BUYER_EMAIL = process.env.MCP_AI_BUYER_EMAIL || 'ai-buyer@example.com';

if (!MCP_MERCHANT_ID) {
  console.error("Missing required MCP configuration: MCP_MERCHANT_ID");
  process.exit(1);
}

// Function to resolve or create the AI Buyer customer identity
async function getMcpCustomerContext() {
  const merchant = await prisma.merchant.findUnique({
    where: { id: MCP_MERCHANT_ID }
  });
  
  if (!merchant) {
    throw new Error(`Merchant not found: ${MCP_MERCHANT_ID}`);
  }

  let customer = await prisma.merchantCustomer.findFirst({
    where: {
      merchantId: MCP_MERCHANT_ID,
      email: MCP_AI_BUYER_EMAIL
    }
  });

  if (!customer) {
    customer = await prisma.merchantCustomer.create({
      data: {
        merchantId: MCP_MERCHANT_ID,
        email: MCP_AI_BUYER_EMAIL,
        name: "AI Buyer"
      }
    });
  }

  return { merchantId: MCP_MERCHANT_ID, customerId: customer.id };
}

// Set up MCP server
const server = new Server(
  {
    name: "ai-buyer-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_products",
        description: "Search for products in the merchant's catalog.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            category: { type: "string" },
            minPricePaise: { type: "number" },
            maxPricePaise: { type: "number" },
            inStockOnly: { type: "boolean" }
          }
        }
      },
      {
        name: "get_product",
        description: "Get detailed information about a specific product.",
        inputSchema: {
          type: "object",
          properties: {
            productId: { type: "string" }
          },
          required: ["productId"]
        }
      },
      {
        name: "get_cart",
        description: "Get the current state of the AI Buyer's cart.",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "add_to_cart",
        description: "Add a product to the cart.",
        inputSchema: {
          type: "object",
          properties: {
            productId: { type: "string" },
            quantity: { type: "number" }
          },
          required: ["productId", "quantity"]
        }
      },
      {
        name: "create_cart",
        description: "Create or reset the cart (clears existing items).",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "create_order",
        description: "Creates an order from the current cart. Use this before generating a checkout link.",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "generate_checkout_link",
        description: "Generates a Razorpay Test Mode checkout link for an order.",
        inputSchema: {
          type: "object",
          properties: {
            orderId: { type: "string" }
          },
          required: ["orderId"]
        }
      },
      {
        name: "get_payment_status",
        description: "Check the authoritative status of an order.",
        inputSchema: {
          type: "object",
          properties: {
            orderNumber: { type: "string" }
          },
          required: ["orderNumber"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { merchantId, customerId } = await getMcpCustomerContext();
    const { name, arguments: args } = request.params;
    
    const context: TrustedCommerceContext = {
      merchantId,
      customerId,
      actor: "AI_BUYER",
      protocol: "MCP"
    };

    const adapter = new McpProtocolAdapter();
    const intent = adapter.normalizeRequest({ name, arguments: args });
    
    const result = await CommerceEngine.execute(intent, context);



    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  } catch (error: any) {
    console.error(`[MCP Error] Tool ${request.params.name} failed:`, error.message);
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AI Buyer MCP Server running on stdio");
}

run().catch((error) => {
  console.error("Fatal error starting server:", error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.error("SIGINT received, closing server...");
  await server.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error("SIGTERM received, closing server...");
  await server.close();
  await prisma.$disconnect();
  process.exit(0);
});
