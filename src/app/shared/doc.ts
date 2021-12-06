export interface Doc {
  createdBy: {
    user: {
      displayName: string,
      email: string
    }
  },
  createdDateTime: string,
  file: {
    mimeType: string,
  },
  name: string,
  size: number,
  webUrl: string
}