export interface PurchaseOrderLine {
  Id: string;
  PONumber: string,
  LineNumber: number,
  Date: string;
  ExtdCost: number;
  CancelledQty: number;
  ExtendedCost: number;
  ItemDesc: string;
  ItemNumber: string;
  OrderQty: number;
  QtyOnHand: number;
  QtyAvailable: number;
};