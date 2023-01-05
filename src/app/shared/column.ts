export interface Column {
  name: string;
  displayName: string;
  choice?: {
    choices: Array<string>;
  }
}