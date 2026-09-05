import { db as prisma } from '@/lib/db'

export async function executeAutonomousPurchase(
  merchantId: string,
  customerId: string,
  productId: string,
  quantity: number
) {
  // 1. Resolve product, price, inventory safely from backend
  const product = await prisma.product.findFirst({
    where: { id: productId, merchantId }
  })

  if (!product) {
    return {
      success: false,
      error: "Product not found or unavailable."
    }
  }

  if (!product.active) {
    return {
      success: false,
      error: "Purchase blocked because the product is inactive."
    }
  }

  if (quantity > product.inventory) {
    return {
      success: false,
      error: `Purchase stopped because only ${product.inventory} item(s) remain.`
    }
  }

  // 2. Resolve Customer Profile and Autonomy Setting
  const customer = await prisma.merchantCustomer.findUnique({
    where: { id: customerId },
    include: { savedPaymentMethods: true }
  })

  if (!customer) {
    return {
      success: false,
      error: "Customer authorization failed."
    }
  }

  if (!customer.aiPurchaseEnabled) {
    return {
      success: false,
      error: "Autonomous purchasing is disabled in your settings."
    }
  }

  // 3. Resolve Saved Payment Method
  const activeMethods = customer.savedPaymentMethods.filter(m => m.status === 'ACTIVE')
  
  if (activeMethods.length === 0) {
    return {
      success: false,
      error: "Autonomous purchasing is unavailable until a supported saved payment method is configured."
    }
  }

  // Find default method, fallback to first active if none marked default
  const savedPaymentMethod = activeMethods.find(m => m.isDefault) || activeMethods[0]

  if (savedPaymentMethod.provider === "DEMO") {
    return {
      success: false,
      error: "I can't complete an autonomous purchase with this test payment method. A provider-backed saved payment authorization is required."
    }
  }

  // 4. Calculate total & Check Spending Limit
  const totalPaise = product.pricePaise * quantity
  const SPENDING_LIMIT_PAISE = 1000000 // ₹10,000

  if (totalPaise > SPENDING_LIMIT_PAISE) {
    return {
      success: false,
      error: "Purchase blocked because it exceeds your AI purchase limit (₹10,000)."
    }
  }

  // The purchase is blocked because we only have DEMO methods supported right now,
  // but if we had a real provider, we would continue here.
  return {
    success: false,
    error: "Provider integration not ready for autonomous checkout."
  }
}
