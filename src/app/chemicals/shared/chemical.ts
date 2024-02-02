export interface Chemical {
  IssueDate: string;
  ItemNmbr: string;
  ItemDesc: string;
  CwNo: string;
  Dgc: string;
  Name: string;
  sdsExists: number;
  DocNo: string;
  hCodes: Array<string>;
  quantity: number;
  uofm: string;
  Bin?: string;
  QtyOnHand?: number;
  key: string;
}