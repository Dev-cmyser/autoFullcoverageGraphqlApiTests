import fs from 'fs';
import path from 'path';
import {
  Source,
  buildSchema,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNamedType,
} from 'graphql';
import { rimrafSync } from 'rimraf';
import { parse } from 'ts-command-line-args';

interface BuildOptions {
  schemaFilePath: string;
  destDirPath: string;
  depthLimit?: number;
  assumeValid?: string;
  ext: string;
  includeDeprecatedFields?: boolean;
  includeCrossReferences?: boolean;
}

function isGraphQLObjectType(
  type: GraphQLNamedType,
): type is GraphQLObjectType {
  return type instanceof GraphQLObjectType;
}

function isGraphQLUnionType(type: GraphQLNamedType): type is GraphQLUnionType {
  return type instanceof GraphQLUnionType;
}

function resolveDestDirPath(destDirPath: string): void {
  rimrafSync(destDirPath);
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

function getFieldArgsDict(
  field: any,
  duplicateArgCounts: Record<string, number>,
  allArgsDict: Record<string, any> = {},
): Record<string, any> {
  return field.args.reduce((piece: Record<string, any>, arg: any) => {
    if (arg.name in duplicateArgCounts) {
      const index = duplicateArgCounts[arg.name] + 1;
      duplicateArgCounts[arg.name] = index;
      piece[`${arg.name}${index}`] = arg;
    } else if (allArgsDict[arg.name]) {
      duplicateArgCounts[arg.name] = 1;
      piece[`${arg.name}1`] = arg;
    } else {
      piece[arg.name] = arg;
    }
    return piece;
  }, {});
}

function getArgsToVarsStr(dict: Record<string, any>): string {
  return Object.entries(dict)
    .map(([varName, arg]) => `${arg.name}: $${varName}`)
    .join(', ');
}

function getVarsToTypesStr(dict: Record<string, any>): string {
  return Object.entries(dict)
    .map(([varName, arg]) => `$${varName}: ${arg.type}`)
    .join(', ');
}

function main(options: BuildOptions): void {
  const {
    schemaFilePath,
    destDirPath,
    depthLimit = 100,
    includeDeprecatedFields = false,
    assumeValid,
    includeCrossReferences = false,
    ext: fileExtension,
  } = options;

  const assume = assumeValid === 'true';

  const typeDef = fs.readFileSync(schemaFilePath, 'utf-8');
  const source = new Source(typeDef);
  const gqlSchema = buildSchema(source, { assumeValidSDL: assume });

  resolveDestDirPath(destDirPath);

  let indexJsExportAll = '';

  const generateQuery = (
    curName: string,
    curParentType: string,
    curParentName: string,
    argumentsDict: Record<string, any> = {},
    duplicateArgCounts: Record<string, number> = {},
    crossReferenceKeyList: string[] = [],
    curDepth: number = 1,
    fromUnion: boolean = false,
  ): { queryStr: string; argumentsDict: Record<string, any> } => {
    const parentType = gqlSchema.getType(curParentType);
    if (!parentType || !isGraphQLObjectType(parentType)) {
      return { queryStr: '', argumentsDict };
    }

    const field = parentType.getFields()[curName];
    const curTypeName = field.type.toString().replace(/[[\]!]/g, '');
    const curType = gqlSchema.getType(curTypeName);

    let queryStr = '';
    let childQuery = '';

    if (curType && isGraphQLObjectType(curType)) {
      const crossReferenceKey = `${curParentName}To${curName}Key`;
      if (
        (!includeCrossReferences &&
          crossReferenceKeyList.includes(crossReferenceKey)) ||
        (fromUnion ? curDepth - 2 : curDepth) > depthLimit
      ) {
        return { queryStr: '', argumentsDict };
      }

      crossReferenceKeyList.push(crossReferenceKey);
      const childKeys = Object.keys(curType.getFields());
      childQuery = childKeys
        .filter((fieldName) => {
          const fieldSchema = curType.getFields()[fieldName];
          return includeDeprecatedFields || !fieldSchema.deprecationReason;
        })
        .map(
          (cur) =>
            generateQuery(
              cur,
              curTypeName,
              curName,
              argumentsDict,
              duplicateArgCounts,
              crossReferenceKeyList,
              curDepth + 1,
              fromUnion,
            ).queryStr,
        )
        .filter((cur) => Boolean(cur))
        .join('\n');
    }

    queryStr = `${'    '.repeat(curDepth)}${field.name}`;

    if (field.args.length > 0) {
      const dict = getFieldArgsDict(field, duplicateArgCounts, argumentsDict);
      Object.assign(argumentsDict, dict);
      queryStr += `(${getArgsToVarsStr(dict)})`;
    }

    if (childQuery) {
      queryStr += ` {\n${childQuery}\n${'    '.repeat(curDepth)}}`;
    }

    if (curType && isGraphQLUnionType(curType)) {
      const types = curType.getTypes();
      if (!types.length) {
        return { queryStr, argumentsDict };
      }
      const indent = `${'    '.repeat(curDepth)}`;
      const fragIndent = `${'    '.repeat(curDepth + 1)}`;
      queryStr += '{\n';
      queryStr += `${fragIndent}__typename\n`;

      types.forEach((valueTypeName) => {
        const valueType = gqlSchema.getType(valueTypeName.name);
        if (!valueType || !isGraphQLObjectType(valueType)) return;

        const unionChildQuery = Object.keys(valueType.getFields())
          .map(
            (cur) =>
              generateQuery(
                cur,
                valueTypeName.name,
                curName,
                argumentsDict,
                duplicateArgCounts,
                crossReferenceKeyList,
                curDepth + 2,
                true,
              ).queryStr,
          )
          .filter((cur) => Boolean(cur))
          .join('\n');

        if (unionChildQuery) {
          queryStr += `${fragIndent}... on ${valueTypeName.name} {\n${unionChildQuery}\n${fragIndent}}\n`;
        }
      });
      queryStr += `${indent}}`;
    }

    return { queryStr, argumentsDict };
  };

  const generateFile = (
    obj: Record<string, any>,
    description: string,
  ): void => {
    let indexJs = "import fs from 'fs';\nimport path from 'path';\n\n";
    let outputFolderName: string | undefined;
    switch (true) {
      case /Mutation.*$/.test(description):
      case /mutation.*$/.test(description):
        outputFolderName = 'mutations';
        break;
      case /Query.*$/.test(description):
      case /query.*$/.test(description):
        outputFolderName = 'queries';
        break;
      case /Subscription.*$/.test(description):
      case /subscription.*$/.test(description):
        outputFolderName = 'subscriptions';
        break;
      default:
        console.warn('[gqlg warning]:', 'description is required');
    }
    const writeFolder = path.join(destDirPath, `./${outputFolderName}`);
    try {
      fs.mkdirSync(writeFolder);
    } catch (err: any) {
      if (err.code !== 'EEXIST') throw err;
    }
    Object.keys(obj).forEach((type) => {
      const gqlType = gqlSchema.getType(description);
      if (!gqlType || !isGraphQLObjectType(gqlType)) return;

      const field = gqlType.getFields()[type];
      if (!field) return;

      if (includeDeprecatedFields || !field.deprecationReason) {
        const queryResult = generateQuery(type, description, description);
        const varsToTypesStr = getVarsToTypesStr(queryResult.argumentsDict);
        let query = queryResult.queryStr;
        let queryName: string | undefined;
        switch (true) {
          case /Mutation/.test(description):
          case /mutation/.test(description):
            queryName = 'mutation';
            break;
          case /Query/.test(description):
          case /query/.test(description):
            queryName = 'query';
            break;
          case /Subscription/.test(description):
          case /subscription/.test(description):
            queryName = 'subscription';
            break;
          default:
            break;
        }
        query = `${queryName ?? description.toLowerCase()} ${type}${
          varsToTypesStr ? `(${varsToTypesStr})` : ''
        }{\n${query}\n}`;
        fs.writeFileSync(
          path.join(writeFolder, `./${type}.${fileExtension}`),
          query,
        );
        indexJs += `export const ${type} = fs.readFileSync(path.join(__dirname, '${type}.${fileExtension}'), 'utf8');\n`;
      }
    });
    fs.writeFileSync(path.join(writeFolder, 'index.ts'), indexJs);
    indexJsExportAll += `import * as ${outputFolderName} from './${outputFolderName}';\n`;
  };

  const mutationType = gqlSchema.getMutationType();
  if (mutationType && isGraphQLObjectType(mutationType)) {
    generateFile(mutationType.getFields(), mutationType.name);
  } else {
    console.warn('[gqlg warning]:', 'No mutation type found in your schema');
  }

  const queryType = gqlSchema.getQueryType();
  if (queryType && isGraphQLObjectType(queryType)) {
    generateFile(queryType.getFields(), queryType.name);
  } else {
    console.warn('[gqlg warning]:', 'No query type found in your schema');
  }

  const subscriptionType = gqlSchema.getSubscriptionType();
  if (subscriptionType && isGraphQLObjectType(subscriptionType)) {
    generateFile(subscriptionType.getFields(), subscriptionType.name);
  } else {
    console.warn(
      '[gqlg warning]:',
      'No subscription type found in your schema',
    );
  }

  fs.writeFileSync(
    path.join(destDirPath, 'index.ts'),
    indexJsExportAll + 'export const gqls = { ...mutations, ...queries}',
  );
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
  depthLimit: {
    type: Number,
    optional: true,
    defaultValue: 100,
    description: 'Query depth limit (default is 100)',
  },
  assumeValid: {
    type: String,
    optional: true,
    description: 'Assume the SDL is valid',
  },
  ext: {
    type: String,
    defaultValue: 'gql',
    description: 'File extension to use',
  },
  includeDeprecatedFields: {
    type: Boolean,
    optional: true,
    defaultValue: false,
    description: 'Include deprecated fields',
  },
  includeCrossReferences: {
    type: Boolean,
    optional: true,
    defaultValue: false,
    description: 'Include cross references',
  },
});

main(options);
