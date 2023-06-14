import { Line } from "./line";

export interface Order {
  sopType: number;
  sopNumber: string;
  batchNumber: string;
  custName: string;
  custNumber: string;
  cntPrsn: string;
  address1: string;
  address2: string;
  address3: string;
  city: string;
  postCode: string;
  phoneNumber1: string;
  phoneNumber2: string;
  state: string;
  lines: Array<Line>;
  reqShipDate: Date;
  palletSpaces: number;
  orderWeight: number;
}