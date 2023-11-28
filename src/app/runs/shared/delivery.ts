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
  order: Observable<Order>;
  fields: {
    id: string;
    Run: string;
    Address: string;
    City: string;
    State: string;
    Postcode: string;
    Branch: string;
    CustomerName: string;
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
    Creator: string;
    Created: Date;
  }
}