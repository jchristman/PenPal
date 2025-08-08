import { mergeTypeDefs } from "@graphql-tools/merge";

import webapp_queries from "./webapp.graphql";

const queries = [webapp_queries];

export default mergeTypeDefs(queries);
