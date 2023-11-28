export interface BranchTotal {
  createdDateTime: string | Date;
  lastModifiedDateTime: string | Date;
  id: string;
  statusId?: number;
  fields : {
    Title: string;
    Material: number;
    Quantity: number;
  }
}