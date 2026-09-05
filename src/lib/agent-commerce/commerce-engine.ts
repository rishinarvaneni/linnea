import { CommerceIntent, TrustedCommerceContext } from './types';
import { CommercePolicy } from './policy';
import * as customerTools from '@/lib/ai/customer-tools';
import { createOrderFromCart } from '@/lib/checkout/order';
import { createRazorpayPaymentLink } from '@/lib/razorpay/payment-links';
import { db as prisma } from '@/lib/db';

export class CommerceEngine {
  
  static async execute(intent: CommerceIntent, context: TrustedCommerceContext) {
    // 1. Enforce shared policies (trusted context, basic bounds)
    CommercePolicy.validate(intent, context);

    const { merchantId, customerId } = context;

    // Log the intent for audit/metrics
    console.log(`[CommerceEngine] Executing intent: ${intent.action}`, {
      protocol: context.protocol,
      actor: context.actor,
      requestId: intent.requestId,
      merchantId,
      customerId,
      // Only log safe, non-sensitive parameters
      productId: intent.productId,
      quantity: intent.quantity,
      orderId: intent.orderId
    });

    try {
      let result;

      // 2. Dispatch to existing authoritative services
      switch (intent.action) {
        case 'SEARCH_PRODUCT':
          result = await customerTools.searchProducts(merchantId, {
            query: intent.searchQuery,
            category: intent.searchCategory,
            minPricePaise: intent.minPricePaise,
            maxPricePaise: intent.maxPricePaise,
            inStockOnly: intent.inStockOnly
          });
          break;

        case 'GET_PRODUCT':
          result = await customerTools.getProduct(merchantId, intent.productId!);
          break;

        case 'CREATE_CART':
          result = await customerTools.clearCart(merchantId, customerId);
          break;

        case 'ADD_TO_CART':
          result = await customerTools.addToCart(merchantId, customerId, intent.productId!, intent.quantity!);
          break;

        case 'GET_CART':
          result = await customerTools.getCart(merchantId, customerId);
          break;

        case 'CREATE_ORDER':
          const orderData = await createOrderFromCart(customerId, merchantId, context.actor);
          result = {
            orderId: orderData.orderId,
            orderNumber: orderData.orderNumber,
            amountPaise: orderData.amountPaise,
            currency: orderData.currency,
            status: "PENDING",
            message: "Order created successfully. Please generate a checkout link to complete payment."
          };
          // Clear cart on successful order
          await customerTools.clearCart(merchantId, customerId);
          break;

        case 'GENERATE_CHECKOUT':
          const paymentUrl = await createRazorpayPaymentLink(merchantId, intent.orderId!);
          result = {
            paymentUrl,
            message: "Payment link generated successfully. Please present this link to the human user to complete the Razorpay Test Mode checkout."
          };
          break;

        case 'GET_PAYMENT_STATUS':
          result = await customerTools.getOrderStatus(customerId, intent.orderNumber!);
          break;

        default:
          throw new Error(`Unsupported Commerce Action: ${intent.action}`);
      }

      // Log success audit
      console.log(`[CommerceEngine] Intent SUCCESS: ${intent.action} (${intent.requestId})`);
      
      // 3. Return normalized result (for this phase, we just pass the result through as they are already safe)
      return result;

    } catch (error: any) {
      console.error(`[CommerceEngine] Intent FAILED: ${intent.action} (${intent.requestId})`, error);
      throw error;
    }
  }
}
