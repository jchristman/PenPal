import { mergeTypeDefs } from "@graphql-tools/merge";
const { loadFiles } = require("@graphql-tools/load-files");
const { join } = require("path");

const subdir_graphql_files = join(__dirname, "./**/*.graphql");
const graphql_files = join(__dirname, "./*.graphql");

const loadGraphQLFiles = async () => {
  const typeDefs = [
    ...(await loadFiles(subdir_graphql_files)),
    ...(await loadFiles(graphql_files)),
  ];

  return mergeTypeDefs(typeDefs);
};

export default loadGraphQLFiles;
