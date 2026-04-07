export enum PaymentMethod {
  CARD = 'CARD',
  PSE = 'PSE',
  NEQUI = 'NEQUI',
  DAVIPLATA = 'DAVIPLATA',
  CASH = 'CASH',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  VOIDED = 'VOIDED',
}

export enum PaymentProvider {
  WOMPI = 'WOMPI',
  EPAYCO = 'EPAYCO',
}
