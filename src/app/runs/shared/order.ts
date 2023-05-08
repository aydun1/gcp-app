import { Line } from "./line";

export interface Order {
  sopType: number;
  sopNumber: string;
  batchNumber: string;
  custName: string;
  custNumber: string;
  address1: string;
  address2: string;
  address3: string;
  city: string;
  postCode: string;
  state: string;
  lines: Array<Line>;
  reqShipDate: Date;
}