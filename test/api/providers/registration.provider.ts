
import { DataProviderArray } from '../../../common/interfaces/data-provider.interface';


export function registrationProvider(): DataProviderArray {
  return [
    {
      description: 'should',
      variables: {"dto":{"firstName":"example","lastName":"example","email":"example","phone":"example","password":"example","confirmPassword":"example"}},
      expectError: true
    }
  ];
}
