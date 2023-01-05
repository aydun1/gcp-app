export interface PurchaseOrderLine {
  Id: string;
  PONumber: string;
  LineNumber: number;
  Date: string;
  ToSite: string;
  ExtdCost: number;
  CancelledQty: number;
  ExtendedCost: number;
  ItemDesc: string;
  ItemNmbr: string;
  OrderQty: number;
  QtyOnHand: number;
  QtyAvailable: number;
}