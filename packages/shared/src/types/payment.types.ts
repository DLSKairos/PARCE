export interface WompiTransactionResponse {
  data: {
    id: string
    status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'PENDING'
    reference: string
    amount_in_cents: number
    payment_method_type: string
  }
}

export interface WompiWebhookPayload {
  event: string
  data: {
    transaction: WompiTransactionResponse['data']
  }
  environment: string
  signature: {
    properties: string[]
    checksum: string
  }
  timestamp: number
}
