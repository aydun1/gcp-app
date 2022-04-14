export interface PalletTotals {
  id: string,
  lastModifiedDateTime: string | Date,
  lastModifiedBy: {
    user: {
      displayName: string,
      email: string,
      id: string
    }
  }
  fields: {
    Branch: string,
    Title: string,
    Site?: string
    Pallet: string,
    Owing: number,
    Year?: number,
    Month?: number,
    DateInt?: number
  }
}