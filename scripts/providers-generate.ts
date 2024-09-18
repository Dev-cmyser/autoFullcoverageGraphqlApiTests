import fs from 'fs';
import {
  buildSchema,
  getNamedType,
  GraphQLSchema,
  isInputObjectType,
} from 'graphql';
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
// Вспомогательные функции для работы с типами
interface VariableValues {
  [key: string]: any; // Use 'any' or a more specific union type as needed
}

// Adjust getDefaultValue function
function getDefaultValue(type: any): any {
  type = getNamedType(type); // Ensures we're working with the base type
  if (isInputObjectType(type)) {
    const fields = type.getFields();
    const value: VariableValues = {}; // Use the interface with index signature
    for (const fieldName in fields) {
      value[fieldName] = getDefaultValue(fields[fieldName].type);
    }
    return value;
  } else {
    switch (type.name) {
      case 'String':
        return 'example';
      case 'Int':
        return 123;
      case 'Boolean':
        return false;
      default:
        return null;
    }
  }
}

// Function to retrieve a field by name from schema
function getQueryfield(queryName: string, schema: GraphQLSchema) {
  const queryType = schema.getQueryType();
  const mutationType = schema.getMutationType();

  const field =
    queryType?.getFields()[queryName] || mutationType?.getFields()[queryName];
  if (!field) {
    throw new Error(`Field '${queryName}' not found in schema`);
  }
  return field;
}

// Function to generate variables for a given query name
function generateVariablesForQuery(
  queryName: string,
  schema: GraphQLSchema,
): VariableValues {
  const field = getQueryfield(queryName, schema);

  const variables: VariableValues = {};

  field.args.forEach((arg) => {
    variables[arg.name] = getDefaultValue(arg.type);
  });

  return variables;
}
function generateTestCaseFromSchema(
  options: BuildOptions,
  request: string,
  variables: any,
): void {
  const fileContent = `
import { DataProviderArray } from '../../../common/interfaces/data-provider.interface';


export function ${request}Provider(): DataProviderArray {
  return [
    {
      description: 'should',
      variables: ${JSON.stringify(variables)},
      expectError: true
    }
  ];
}
`;

  const filePath = path.join(options.destDirPath, `${request}.provider.ts`);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, fileContent);
    console.warn(`Generated test file for ${request}`);
  } else {
    console.warn(`File for <--${request}--> already exists. No changes made.`);
  }
}

function main(options: BuildOptions): void {
  resolveDestDirPath(options.destDirPath);
  const sdlSchemaContent = fs.readFileSync(options.schemaFilePath, 'utf8');
  const schema = buildSchema(sdlSchemaContent);

  let gqlPath = options.destDirPath;
  const parts = gqlPath.split('/');
  parts.pop();
  parts.pop();
  parts.pop();
  gqlPath = parts.join('/');
  const requests = getRequests(gqlPath + '/common/gql-generated');
  for (const i of requests) {
    const variables = generateVariablesForQuery(i, schema);
    generateTestCaseFromSchema(options, i, variables);
  }
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
