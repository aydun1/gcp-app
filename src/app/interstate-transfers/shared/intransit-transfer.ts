import { IntransitTransferLine } from './intransit-transfer-line';

export interface InTransitTransfer {
  docId: string;
  orderDate: string;
  fromSite: string;
  toSite: string;
  lines: Array<IntransitTransferLine>;
}