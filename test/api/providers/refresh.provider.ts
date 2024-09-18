
import { DataProviderArray } from '../../../common/interfaces/data-provider.interface';


export function refreshProvider(): DataProviderArray {
  return [
    {
      description: 'should',
      variables: {"refreshToken":"example"},
      expectError: true
    }
  ];
}
