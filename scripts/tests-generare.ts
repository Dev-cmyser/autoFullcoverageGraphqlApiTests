import fs from 'fs';

import path from 'path';

import { parse } from 'ts-command-line-args';

function resolveDestDirPath(destDirPath: string): void {
  path
    .resolve(destDirPath)
    .split(path.sep)
    .reduce((before, cur) => {
      const pathTmp = path.join(before, cur + path.sep);
      if (!fs.existsSync(pathTmp)) {
        fs.mkdirSync(pathTmp);
      }
      return path.join(before, cur + path.sep);
    }, '');
}
interface BuildOptions {
  schemaFilePath: string;
  destDirPath: string;
}
function generateFile(request: string): string {
  const fileContent = `
    import { ${request}Provider } from '../providers/${request}.provider';
    import { gqls } from '../../../common/gql-generated';
    import { graphqlRequest2 } from '../../../common/api/common';
    import { consts } from '../../test-setup';

    it.each(${request}Provider())(
      'should $description ',
      async ({ variables, expectError }) => {

        const res = await graphqlRequest2(gqls.${request}, variables, [
          { name: 'Authorization', value: "Bearer " + consts.accesToken },
          { name: 'branchuid', value: consts.branchUuid },
        ]);

        if (expectError) {
          expect(res.errors).toBeDefined();
        } else {
          expect(res.data).toBeDefined();
        }
      },
    );
`;

  const filePath = path.join(options.destDirPath, `${request}.e2e.ts`);
  const filePathDisable = path.join(
    options.destDirPath,
    `${request}.e2e-disable.ts`,
  );

  if (!fs.existsSync(filePath) && !fs.existsSync(filePathDisable)) {
    fs.writeFileSync(filePathDisable, fileContent);
    console.warn(`Generated test file for ${request}`);
  } else {
    console.warn(`File for <--${request}--> already exists. No changes made.`);
  }
  return filePath;
}

function getRequests(directory: string, filesList: string[] = []): string[] {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (file === 'index.ts') continue;

    if (stat.isDirectory()) {
      getRequests(filePath, filesList);
    } else if (path.extname(file) === '.gql') {
      const parts = filePath.split('/');
      const name = parts.pop();
      if (!name) {
        continue;
      }
      filesList.push(name.slice(0, -4));
    }
  }

  return filesList;
}

function checkCoverage(requests: string[]): void {
  const works = [];
  const disable = [];
  for (const i of requests) {
    const filePathWork = path.join(options.destDirPath, `${i}.e2e.ts`);
    const filePathDisable = path.join(
      options.destDirPath,
      `${i}.e2e-disable.ts`,
    );
    if (fs.existsSync(filePathWork)) {
      works.push(i);
    } else if (fs.existsSync(filePathDisable)) {
      disable.push(i);
    } else {
      console.warn(
        'НЕ НАЙДЕНО! (pattern for disable - gqlName.e2e-disable.ts) :',
        i,
      );
    }
  }

  console.warn(`  ВСЕГО (${requests.length}) `);
  console.warn(`РУЧКИ ПОКРЫТЫЕ ТЕСТАМИ (${works.length}) :`, works);
  console.warn(`РУЧКИ ОТКЛЮЧЕННЫЕ (${disable.length}) :`, disable);
  const total = requests.length;
  const coveragePercentage = total ? (works.length / total) * 100 : 0;

  console.warn(`Процент покрытия тестами: ${coveragePercentage.toFixed(2)}%`);
}

function main(options: BuildOptions): void {
  resolveDestDirPath(options.destDirPath);
  let gqlPath = options.destDirPath;
  const parts = gqlPath.split('/');
  parts.pop();
  parts.pop();
  parts.pop();
  gqlPath = parts.join('/');
  const requests = getRequests(gqlPath + '/common/gql-generated');

  const paths = [];

  for (const i of requests) {
    const filePath = generateFile(i);
    paths.push(filePath);
  }

  checkCoverage(requests);
}

const options = parse<BuildOptions>({
  schemaFilePath: {
    type: String,
    description: 'Path of your GraphQL schema file',
  },
  destDirPath: {
    type: String,
    description: 'Directory to store the generated queries',
  },
});

main(options);
