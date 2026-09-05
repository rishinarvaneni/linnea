export type CommerceAction = 
  | "SEARCH_PRODUCT"
  | "GET_PRODUCT"
  | "CREATE_CART"
  | "ADD_TO_CART"
  | "GET_CART"
  | "CREATE_ORDER"
  | "GENERATE_CHECKOUT"
  | "GET_PAYMENT_STATUS";

export type ActorRole = "MERCHANT" | "CUSTOMER" | "AI_BUYER";

export interface TrustedCommerceContext {
  merchantId: string;
  customerId: string; // Most MCP actions require customerId for AI Buyer
  actor: ActorRole;
  protocol: string;
}

export interface CommerceIntent {
  action: CommerceAction;
  requestId: string;
  protocol: string;
  
  // Payload fields
  productId?: string;
  quantity?: number;
  
  // Search parameters
  searchQuery?: string;
  searchCategory?: string;
  minPricePaise?: number;
  maxPricePaise?: number;
  inStockOnly?: boolean;

  // Order/Payment tracking parameters
  orderId?: string;
  orderNumber?: string;
}

export interface PaymentAuthorization {
  amountPaise: number;
  currency: string;
  requestId: string;
  methodReference?: string;
  authorizationReference?: string;
  protocol?: string;
}
