export interface Chemical {
  IssueDate: string;
  ItemNmbr: string;
  ItemDesc: string;
  CwNo: string;
  Name: string;
  sdsExists: number;
  DocNo: string;
  hCodes: Array<string>;
  Quantity: number;
}