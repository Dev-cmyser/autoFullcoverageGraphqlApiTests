import fs from 'fs';
import path from 'path';

export const user = fs.readFileSync(path.join(__dirname, 'user.gql'), 'utf8');
