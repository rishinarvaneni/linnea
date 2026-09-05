import { CommerceIntent, TrustedCommerceContext } from './types';

export class CommercePolicy {
  static validate(intent: CommerceIntent, context: TrustedCommerceContext) {
    if (!context.merchantId) {
      throw new Error('Policy Violation: Missing trusted merchant context');
    }
    
    if (!context.customerId) {
      throw new Error('Policy Violation: Missing trusted customer context');
    }

    if (!['MERCHANT', 'CUSTOMER', 'AI_BUYER'].includes(context.actor)) {
      throw new Error(`Policy Violation: Invalid actor role ${context.actor}`);
    }

    if (!intent.protocol) {
      throw new Error('Policy Violation: Request must specify protocol');
    }

    if (!intent.requestId) {
      throw new Error('Policy Violation: Request must specify a requestId');
    }

    // Specific action validations
    switch (intent.action) {
      case 'ADD_TO_CART':
        if (!intent.productId) throw new Error('Policy Violation: Missing productId for ADD_TO_CART');
        if (intent.quantity === undefined || intent.quantity < 1) {
          throw new Error('Policy Violation: Quantity must be at least 1');
        }
        if (intent.quantity > 100) {
          throw new Error('Policy Violation: Quantity exceeds maximum allowed bound (100)');
        }
        break;

      case 'GET_PRODUCT':
        if (!intent.productId) throw new Error('Policy Violation: Missing productId for GET_PRODUCT');
        break;

      case 'GENERATE_CHECKOUT':
        if (!intent.orderId) throw new Error('Policy Violation: Missing orderId for GENERATE_CHECKOUT');
        break;

      case 'GET_PAYMENT_STATUS':
        if (!intent.orderNumber) throw new Error('Policy Violation: Missing orderNumber for GET_PAYMENT_STATUS');
        break;
    }
  }
}
