import fs from 'fs';
import path from 'path';

export const UserUpdated = fs.readFileSync(
  path.join(__dirname, 'UserUpdated.gql'),
  'utf8',
);
