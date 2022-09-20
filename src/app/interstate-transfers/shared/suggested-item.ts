export interface SuggestedItem {
  Bin: string;
  Category: string;
  Id: number;
  InTransit: number;
  ItemDesc: string;
  ItemNumber: string;
  Location: string;
  Max: number;
  Min: number;
  PackSize: number;
  PalletQty: number;
  QtyAllocated: number;
  QtyAllocatedByDate: number;
  QtyBackordered: number;
  QtyOnHand: number;
  QtyRequired: number;
  VicOnHand: number;
};