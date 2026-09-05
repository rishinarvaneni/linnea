import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function runTest() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", "scripts/mcp-server.ts"],
    env: process.env as Record<string, string>
  });

  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} }
  );

  console.log("Connecting to MCP Server...");
  await client.connect(transport);

  console.log("Listing tools...");
  const tools = await client.listTools();
  console.log("Available tools:", tools.tools.map((t: any) => t.name));

  console.log("\nSearching products...");
  const searchResult = await client.callTool({
    name: "search_products",
    arguments: { query: "" }
  });
  const products = JSON.parse((searchResult.content as any)[0].text as string);
  console.log("Found products:", products.length);

  if (products.length === 0) {
    throw new Error("No products found to test with");
  }
  const product = products[0];

  console.log(`\nCreating cart and adding ${product.name}...`);
  await client.callTool({ name: "create_cart", arguments: {} });
  
  const cartResult = await client.callTool({
    name: "add_to_cart",
    arguments: { productId: product.id, quantity: 1 }
  });
  console.log("Cart after add:", JSON.parse((cartResult.content as any)[0].text as string));

  console.log("\nCreating order...");
  const orderResult = await client.callTool({ name: "create_order", arguments: {} });
  if (orderResult.isError) {
    throw new Error(`Order creation failed: ${(orderResult.content as any)[0].text}`);
  }
  const orderData = JSON.parse((orderResult.content as any)[0].text as string);
  console.log("Order created:", orderData);

  console.log("\nGenerating checkout link...");
  const linkResult = await client.callTool({
    name: "generate_checkout_link",
    arguments: { orderId: orderData.orderId }
  });
  console.log("Checkout Link Generated:", JSON.parse((linkResult.content as any)[0].text as string));

  console.log("\nGetting payment status...");
  const statusResult = await client.callTool({
    name: "get_payment_status",
    arguments: { orderNumber: orderData.orderNumber }
  });
  console.log("Payment Status:", JSON.parse((statusResult.content as any)[0].text as string));

  console.log("\nAll MCP tests passed!");
  process.exit(0);
}

runTest().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
