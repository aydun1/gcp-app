export interface InventoryTransferLine {
  Id: string;
  DocId: string;
  LineNumber: number;
  OrderDate: string;
  EtaDate: string;
  ExtdCost: number;
  CancelledQty: number;
  ExtendedCost: number;
  ItemDesc: string;
  ItemNmbr: string;
  TransferQty: number;
  QtyFulfilled: number;
  QtyShipped: number;
  QtyRemaining: number;
  QtyOnHand: number;
  QtyAvailable: number;
  Bin: string;
  FromSite: string;
  ToSite: string;
  UOFM: string;
}