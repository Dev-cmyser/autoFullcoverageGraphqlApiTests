import { refreshProvider } from '../providers/refresh.provider';
import { gqls } from '../../../common/gql-generated';
import { graphqlRequest2 } from '../../../common/api/common';
import { consts } from '../../test-setup';

it.each(refreshProvider())(
  'should $description ',
  async ({ variables, expectError }) => {
    const res = await graphqlRequest2(gqls.refresh, variables, [
      { name: 'Authorization', value: 'Bearer ' + consts.accesToken },
      { name: 'branchuid', value: consts.branchUuid },
    ]);

    if (expectError) {
      expect(res.errors).toBeDefined();
    } else {
      expect(res.data).toBeDefined();
    }
  },
);
