import { CommerceProtocolAdapter } from './protocol-adapter';
import { CommerceIntent } from './types';
import crypto from 'crypto';

export class McpProtocolAdapter implements CommerceProtocolAdapter {
  
  normalizeRequest(rawRequest: any): CommerceIntent {
    const { name, arguments: args } = rawRequest;
    const requestId = `mcp-${crypto.randomUUID()}`;

    // Note: Intent payload intentionally drops price, total, and identity 
    // overrides. Only safe inputs are passed through to the orchestrator.

    switch (name) {
      case "search_products":
        return {
          action: "SEARCH_PRODUCT",
          protocol: "MCP",
          requestId,
          searchQuery: args?.query,
          searchCategory: args?.category,
          minPricePaise: args?.minPricePaise ? Number(args.minPricePaise) : undefined,
          maxPricePaise: args?.maxPricePaise ? Number(args.maxPricePaise) : undefined,
          inStockOnly: args?.inStockOnly ? Boolean(args.inStockOnly) : undefined,
        };
        
      case "get_product":
        return {
          action: "GET_PRODUCT",
          protocol: "MCP",
          requestId,
          productId: String(args?.productId)
        };
        
      case "get_cart":
        return {
          action: "GET_CART",
          protocol: "MCP",
          requestId,
        };
        
      case "create_cart":
        return {
          action: "CREATE_CART",
          protocol: "MCP",
          requestId,
        };
        
      case "add_to_cart":
        return {
          action: "ADD_TO_CART",
          protocol: "MCP",
          requestId,
          productId: String(args?.productId),
          quantity: Number(args?.quantity)
        };
        
      case "create_order":
        return {
          action: "CREATE_ORDER",
          protocol: "MCP",
          requestId,
        };

      case "generate_checkout_link":
        return {
          action: "GENERATE_CHECKOUT",
          protocol: "MCP",
          requestId,
          orderId: String(args?.orderId)
        };
        
      case "get_payment_status":
        return {
          action: "GET_PAYMENT_STATUS",
          protocol: "MCP",
          requestId,
          orderNumber: String(args?.orderNumber)
        };

      default:
        throw new Error(`MCP Adapter Error: Unknown tool action requested - ${name}`);
    }
  }
}
