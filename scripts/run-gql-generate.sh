#!/bin/sh

#gql
ts-node  scripts/gql-generate.ts --schemaFilePath dist/subgraph.graphql   --destDirPath ./test/common/gql-generated

#providers
ts-node  scripts/providers-generate.ts --schemaFilePath dist/subgraph.graphql   --destDirPath ./test/api/providers

#tests
ts-node  scripts//tests-generare.ts --schemaFilePath dist/subgraph.graphql   --destDirPath ./test/api/requests
