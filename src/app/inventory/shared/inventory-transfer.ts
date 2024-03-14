import { InventoryTransferLine } from './inventory-transfer-line';

export interface InTransitTransfer {
  docId: string;
  orderDate: string;
  fromSite: string;
  toSite: string;
  lines: Array<InventoryTransferLine>;
}