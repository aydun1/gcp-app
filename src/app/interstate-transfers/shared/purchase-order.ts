import { PurchaseOrderLine } from "./purchase-order-line";

export interface PurchaseOrder {
  PONumber: string;
  lines: Array<PurchaseOrderLine>;
}