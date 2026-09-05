import { CommerceIntent } from './types';

export interface CommerceProtocolAdapter {
  normalizeRequest(rawRequest: any): CommerceIntent;
}
