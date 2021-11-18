export interface InterstatePalletTransfer {
  id: string,
  fields: {
    Reference: string,
    Pallet: string,
    From: string,
    To: string,
    Quantity: string
  }
}