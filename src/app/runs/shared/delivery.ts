import { Observable } from "rxjs";
import { Order } from "./order";

export interface Delivery {
  id: string;
  lastModifiedDateTime: string | Date;
  lastModifiedBy?: {
    user: {
      displayName: string;
      email: string;
      id: string;
    }
  }
  createdDateTime: string | Date;
  createdBy?: {
    user: {
      displayName: string;
      email: string;
      id: string;
    }
  }
  order: Observable<Order>;
  fields: {
    id: string;
    Title: string;
    Address: string;
    City: string;
    State: string;
    PostCode: string;
    Branch: string;
    Customer: string;
    CustomerNumber: string;
    DeliveryDate: Date;
    RequestedDate: Date;
    OrderNumber: string;
    Notes: string;
    Site: string;
    Sequence: number;
    Spaces: number;
    Weight: number;
    Status: string;
  }
}