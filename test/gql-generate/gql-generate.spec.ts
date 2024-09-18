import { execSync } from 'child_process';

function normalizeString(str: string): string {
  return str
    .replace(/\s+/g, '')
    .replace(/{/g, '{')
    .replace(/}/g, '}')
    .replace(/\(/g, '(')
    .replace(/\)/g, ')')
    .replace(/:/g, ':')
    .replace(/,/g, ',')
    .replace(/;/g, ';')
    .trim();
}
const command =
  'ts-node config/scripts/development/gql-generate.ts --schemaFilePath ./libs/util/test/gql-generate/subgraph.graphql  --destDirPath ./libs/util/test/gql-generate/';

describe('cryptoUtil', () => {
  it('should validate Generated Queries', async () => {
    execSync(command + 'output');
    const queries = await import('./output');
    expect(queries.mutations.signin.indexOf('signin')).not.toEqual(-1);
  });

  it('should use limit Depth correctly', async () => {
    execSync(command + 'output2 --depthLimit 1');
    const queries = await import('./output2');
    expect(queries.mutations.signin.indexOf('createdAt')).toEqual(-1);
  });

  it('should excludes Deprecated Fields By Default correctly', async () => {
    execSync(command + 'output3 --depthLimit 1');
    const queries = await import('./output3');
    expect(typeof queries.queries.user).toEqual('string');
    expect('members' in queries.queries).toEqual(false);
    expect('sendMessage' in queries.mutations).toEqual(false);

    const expected = `query user($language: String, $id: Int!){
        user(id: $id){
            id
            username
            email
            createdAt
            details{
                __typename
                ... on Guest {
                    region(language: $language)
                }
                ... on Member {
                    address
                }
                ... on Premium {
                    location
                }
            }
        }
    }`;

    expect(normalizeString(queries.queries.user)).toEqual(
      normalizeString(expected),
    );
  });

  it('should includes Deprecated Fields With Flag correctly', async () => {
    execSync(command + 'output4 --depthLimit 1 --includeDeprecatedFields');
    const queries = await import('./output4');

    expect(typeof queries.queries.user).toEqual('string');
    expect(typeof queries.queries.members).toEqual('string');
    expect(typeof queries.mutations.sendMessage).toEqual('string');

    const expected = `query user($language: String, $id: Int!){
        user(id: $id){
            id
            username
            email
            createdAt
            details{
                __typename
                ... on Guest {
                    region(language: $language)
                }
                ... on Member {
                    address
                }
                ... on Premium {
                    location
                }
            }
            address
        }
    }`;
    expect(normalizeString(queries.queries.user)).toEqual(
      normalizeString(expected),
    );
  });

  it('should includes Nested In Union Types correctly', async () => {
    execSync(command + 'output5 --depthLimit 2');
    const queries = await import('./output5');

    expect(typeof queries.queries.user).toEqual('string');
    expect('members' in queries.queries).toEqual(false);
    expect('sendMessage' in queries.mutations).toEqual(false);
    const expected = `query user($language: String, $id: Int!){
        user(id: $id){
            id
            username
            email
            createdAt
            context{
                domain
            }
            details{
                __typename
                ... on Guest {
                    region(language: $language)
                }
                ... on Member {
                    address
                }
                ... on Premium {
                    location
                    card{
                        number
                    }
                }
            }
        }
    }`;
    expect(normalizeString(queries.queries.user)).toEqual(
      normalizeString(expected),
    );
  });

  it('should includes Cross Reference With Flag correctly', async () => {
    execSync(command + 'output6 --depthLimit 4 --includeCrossReferences');
    const queries = await import('./output6');

    expect(typeof queries.queries.user).toEqual('string');
    expect('members' in queries.queries).toEqual(false);
    expect('sendMessage' in queries.mutations).toEqual(false);

    const expected = `query user($language: String, $language1: String, $id: Int!){
      user(id: $id){
          id
          username
          email
          createdAt
          context{
              user{
                  id
                  username
                  email
                  createdAt
                  context{
                      domain
                  }
                  details{
                      __typename
                      ... on Guest {
                          region(language: $language)
                      }
                      ... on Member {
                          address
                      }
                      ... on Premium {
                          location
                          card{
                              number
                          }
                      }
                  }
              }
              domain
          }
          details{
              __typename
              ... on Guest {
                  region(language: $language1)
              }
              ... on Member {
                  address
              }
              ... on Premium {
                  location
                  card{
                      number
                      type{
                          key
                      }
                  }
              }
          }
      }
  }`;
    expect(normalizeString(queries.queries.user)).toEqual(
      normalizeString(expected),
    );
  });
});
