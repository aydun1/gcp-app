export interface Chemical {
  IssueDate: string;
  ItemNmbr: string;
  ItemDesc: string;
  CwNo: string;
  Name: string;
  sdsExists: number;
  docNo: string;
  hCodes: Array<string>;
}