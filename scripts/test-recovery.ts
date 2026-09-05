import { db as prisma } from '../src/lib/db';
import { startRecovery } from '../src/lib/recovery/workflow';
import { getRecoverableOpportunities } from '../src/lib/recovery/opportunities';

async function testRecovery() {
  console.log("Starting Recovery Integration Test...");
  const merchant = await prisma.merchant.findFirst();
  if (!merchant) throw new Error("No merchant found");

  let customer = await prisma.merchantCustomer.findFirst({
    where: { merchantId: merchant.id, email: { not: '' } }
  });
  
  if (!customer) throw new Error("No customer found");

  if (process.env.TEST_EMAIL_ADDRESS) {
    customer = await prisma.merchantCustomer.update({
      where: { id: customer.id },
      data: { email: process.env.TEST_EMAIL_ADDRESS }
    });
    console.log(`Updated customer email to test address: ${process.env.TEST_EMAIL_ADDRESS}`);
  }

  // Create an abandoned cart
  const product = await prisma.product.findFirst({ where: { merchantId: merchant.id } });
  if (!product) throw new Error("No product found");

  console.log("Creating abandoned cart...");
  const cart = await prisma.cart.create({
    data: {
      merchantId: merchant.id,
      merchantCustomerId: customer.id,
      status: 'ABANDONED',
      items: {
        create: [
          { productId: product.id, quantity: 1 }
        ]
      }
    }
  });

  console.log("Cart created. Finding opportunities...");
  const opportunities = await getRecoverableOpportunities(merchant.id);
  const opp = opportunities.find(o => o.cartId === cart.id);

  if (!opp) {
    throw new Error("Opportunity not generated for the abandoned cart.");
  }
  
  console.log("Found Opportunity:", opp.id);

  // First run: Happy Path (Expected to fail due to no config)
  console.log("\n--- Triggering Recovery (No Config) ---");
  const result1 = await startRecovery(merchant.id, opp.id);
  console.log("Recovery Result:", result1);

  // Let's force an active attempt to test duplicate protection
  console.log("\n--- Forcing an Active Attempt for Duplicate Test ---");
  await prisma.recoveryAttempt.create({
    data: {
      merchantId: merchant.id,
      merchantCustomerId: customer.id,
      cartId: cart.id,
      reason: opp.type,
      strategy: 'STANDARD_RECOVERY',
      status: 'MESSAGE_SENT',
      amountPaise: opp.amountPaise
    }
  });

  // Second run: Duplicate Test
  console.log("\n--- Triggering Duplicate Recovery ---");
  try {
    await startRecovery(merchant.id, opp.id);
    console.log("ERROR: Duplicate was allowed!");
  } catch (e: any) {
    console.log("SUCCESS: Duplicate rejected. Error:", e.message);
  }

  // Provider Failure Test
  console.log("\n--- Triggering Provider Failure Test ---");
  // We can simulate provider failure by calling with FORCE_FAILURE
  try {
    await startRecovery(merchant.id, opp.id, 'FORCE_FAILURE');
    console.log("ERROR: Forced failure succeeded?");
  } catch(e: any) {
    console.log("SUCCESS: Forced failure caught as expected:", e.message);
  }

  console.log("Integration Test Complete.");
}

testRecovery().catch(console.error).finally(() => process.exit(0));
