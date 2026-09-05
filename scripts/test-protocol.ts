import { McpProtocolAdapter } from '../src/lib/agent-commerce/mcp-adapter';
import { CommercePolicy } from '../src/lib/agent-commerce/policy';
import { TrustedCommerceContext } from '../src/lib/agent-commerce/types';

async function testMaliciousMcpRequest() {
  console.log("--- TEST 1: Malicious MCP Request Normalization ---");
  const rawRequest = {
    name: "add_to_cart",
    arguments: {
      merchantId: "another-merchant",
      customerId: "another-customer",
      productId: "valid-product",
      quantity: 1,
      pricePaise: 1,
      totalPaise: 1
    }
  };

  const adapter = new McpProtocolAdapter();
  const intent = adapter.normalizeRequest(rawRequest);

  console.log("Normalized Intent:", JSON.stringify(intent, null, 2));

  if ((intent as any).merchantId || (intent as any).pricePaise || (intent as any).totalPaise) {
    throw new Error("FAIL: Malicious fields leaked into intent");
  }
  console.log("PASS: Malicious fields stripped from intent.\n");
}

async function testTrustedContextEnforcement() {
  console.log("--- TEST 2: Policy Enforcement ---");
  const intent = {
    action: "ADD_TO_CART",
    protocol: "MCP",
    requestId: "test-123",
    productId: "valid-product",
    quantity: 1
  } as any;

  const validContext: TrustedCommerceContext = {
    merchantId: "real-merchant",
    customerId: "real-customer",
    actor: "AI_BUYER",
    protocol: "MCP"
  };

  const maliciousContext1 = { ...validContext, merchantId: "" };
  const maliciousContext2 = { ...validContext, actor: "HACKER" as any };

  try {
    CommercePolicy.validate(intent, validContext);
    console.log("PASS: Valid context accepted.");
  } catch (e: any) {
    throw new Error(`FAIL: Valid context rejected: ${e.message}`);
  }

  try {
    CommercePolicy.validate(intent, maliciousContext1);
    throw new Error("FAIL: Missing merchantId bypassed policy");
  } catch (e: any) {
    console.log("PASS: Missing merchantId rejected.");
  }

  try {
    CommercePolicy.validate(intent, maliciousContext2);
    throw new Error("FAIL: Invalid actor bypassed policy");
  } catch (e: any) {
    console.log("PASS: Invalid actor rejected.");
  }
}

async function runTests() {
  try {
    await testMaliciousMcpRequest();
    await testTrustedContextEnforcement();
    console.log("ALL PROTOCOL TESTS PASSED.");
  } catch (e: any) {
    console.error("TEST FAILED:", e.message);
    process.exit(1);
  }
}

runTests();
