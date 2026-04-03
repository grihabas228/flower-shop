/**
 * ЮKassa Payment Client — Placeholder
 *
 * Will be fully implemented in Phase 4.
 * API docs: https://yookassa.ru/developers
 *
 * Environment variables required:
 * - YOOKASSA_SHOP_ID — Shop ID from ЮKassa dashboard
 * - YOOKASSA_SECRET_KEY — Secret key from ЮKassa dashboard
 */

export interface YooKassaConfig {
  shopId: string
  secretKey: string
}

export interface CreatePaymentParams {
  amount: {
    value: string
    currency: string
  }
  confirmation: {
    type: 'redirect'
    return_url: string
  }
  capture: boolean
  description: string
  metadata?: Record<string, string>
}

export interface YooKassaPayment {
  id: string
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled'
  amount: {
    value: string
    currency: string
  }
  confirmation?: {
    type: string
    confirmation_url: string
  }
  created_at: string
  description: string
  metadata?: Record<string, string>
}

class YooKassaClient {
  private shopId: string
  private secretKey: string
  private baseUrl = 'https://api.yookassa.ru/v3'

  constructor(config: YooKassaConfig) {
    this.shopId = config.shopId
    this.secretKey = config.secretKey
  }

  /**
   * Create a payment.
   * https://yookassa.ru/developers/api#create_payment
   */
  async createPayment(_params: CreatePaymentParams): Promise<YooKassaPayment> {
    // TODO: Implement in Phase 4
    throw new Error('ЮKassa payment integration not yet implemented')
  }

  /**
   * Get payment status by ID.
   * https://yookassa.ru/developers/api#get_payment
   */
  async getPayment(_paymentId: string): Promise<YooKassaPayment> {
    // TODO: Implement in Phase 4
    throw new Error('ЮKassa payment integration not yet implemented')
  }

  /**
   * Capture a payment (for two-stage payments).
   * https://yookassa.ru/developers/api#capture_payment
   */
  async capturePayment(_paymentId: string): Promise<YooKassaPayment> {
    // TODO: Implement in Phase 4
    throw new Error('ЮKassa payment integration not yet implemented')
  }

  /**
   * Cancel a payment.
   * https://yookassa.ru/developers/api#cancel_payment
   */
  async cancelPayment(_paymentId: string): Promise<YooKassaPayment> {
    // TODO: Implement in Phase 4
    throw new Error('ЮKassa payment integration not yet implemented')
  }
}

/**
 * Create a YooKassa client instance.
 * Usage: const yookassa = createYooKassaClient()
 */
export function createYooKassaClient(): YooKassaClient {
  const shopId = process.env.YOOKASSA_SHOP_ID
  const secretKey = process.env.YOOKASSA_SECRET_KEY

  if (!shopId || !secretKey) {
    throw new Error(
      'Missing ЮKassa credentials. Set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY environment variables.',
    )
  }

  return new YooKassaClient({ shopId, secretKey })
}
