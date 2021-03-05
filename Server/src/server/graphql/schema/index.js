import { mergeTypeDefs } from "@graphql-tools/merge";

import mutations from "./mutations";
import queries from "./queries";
import webapp_typeDefs from "./webapp.graphql";
import typeDefs from "./schema.graphql";

const types = [mutations, queries, typeDefs, webapp_typeDefs];

export default mergeTypeDefs(types);
