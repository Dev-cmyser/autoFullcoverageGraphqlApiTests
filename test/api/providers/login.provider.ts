import { DataProviderArray } from 'test/interfaces/data-provider.interface';

export function loginProvider(): DataProviderArray {
  return [
    {
      description: 'should',
      variables: { dto: { credentials: 'example', password: 'example' } },
      expectError: true,
    },
  ];
}
