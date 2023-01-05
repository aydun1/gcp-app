export interface Run {
  id: string;
  lastModifiedDateTime: string | Date;
  lastModifiedBy: {
    user: {
      displayName: string;
      email: string;
      id: string;
    }
  }
  fields: {
    Title: string;
    Branch: string;
  }
}