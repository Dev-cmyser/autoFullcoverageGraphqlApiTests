export interface DataProvider {
  description: string;
  variables?: any;
  expectError?: boolean;
}

export type DataProviderArray = Array<DataProvider>;
