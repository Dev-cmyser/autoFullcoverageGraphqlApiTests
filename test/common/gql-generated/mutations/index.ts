import fs from 'fs';
import path from 'path';

export const login = fs.readFileSync(path.join(__dirname, 'login.gql'), 'utf8');
export const registration = fs.readFileSync(path.join(__dirname, 'registration.gql'), 'utf8');
export const refresh = fs.readFileSync(path.join(__dirname, 'refresh.gql'), 'utf8');
