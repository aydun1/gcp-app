export interface SuggestedItem {
  Bin: string;
  Category: string;
  Id: number;
  PreTransit: number;
  InTransit: number;
  ItemDesc: string;
  ItemNmbr: string;
  Location: string;
  Vendor: number;
  Max: number;
  Min: number;
  OrderPointQty: number;
  PackSize: number;
  PalletQty: number;
  PalletHeight: number;
  QtyAllocated: number;
  QtyAllocatedByDate: number;
  QtyAvailable: number;
  QtyBackordered: number;
  QtyOnHand: number;
  OnHandHEA: number;
  OnHandNSW: number;
  OnHandQLD: number;
  OnHandSA: number;
  OnHandVIC: number;
  OnHandWA: number;
  Notes: string;
  ToTransfer?: number;
};