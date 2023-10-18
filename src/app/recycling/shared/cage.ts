export interface Cage {
  createdDateTime: string | Date;
  lastModifiedDateTime: string | Date;
  id: string;
  statusId?: number;
  fields : {
    Branch: string;
    CageNumber: number;
    CageWeight: number;
    Depot: string;
    GrossWeight: number;
    NetWeight: string;
    Status: string | 'Available' | 'Allocated to customer' | 'Delivered to customer' | 'Collected from customer' | 'Delivered to Polymer' | 'Delivered to local processing' | 'Collected from local processing' | 'Collected from Polymer' | 'Complete';
    AssetType: 'Cage - Solid (2.5m³)' | 'Cage - Folding (2.5m³)' | 'Other';
    Date1: string | Date | null;
    Date2: string | Date | null;
    Date3: string | Date | null;
    Date4: string | Date | null;
    ToLocalProcessing: string | Date | null;
    FromLocalProcessing: string | Date | null;
    ToDepot: string | Date;
    CustomerNumber: string | null;
    Customer: string | null;
    Site: string | null;
    Material: number | null,
    Notes: string;
    id: string;
    Modified: string | Date;
    Created: string | Date;
    Edit: string;
    AssetTypeClean?: string;
  },
  material?: any;
  Date?: any;
  Cage?: boolean;
  Type?: string | null;
  location?: string | null;
  status?: string;
  logo?: string;
}