export interface Chemical {
  ItemNmbr: string;
  ItemDesc: string;
  CwNo: string;
  Name: string;
  sdsExists: number;
  docNo: string;
  hCodes: Array<string>;
}