import fs from 'fs';
import path from 'path';

export const signup = fs.readFileSync(
  path.join(__dirname, 'signup.gql'),
  'utf8',
);
export const signin = fs.readFileSync(
  path.join(__dirname, 'signin.gql'),
  'utf8',
);
export const setConfig = fs.readFileSync(
  path.join(__dirname, 'setConfig.gql'),
  'utf8',
);
