import { mergeTypeDefs } from "@graphql-tools/merge";

import queries from "./queries.graphql";
import typeDefs from "./schema.graphql";

const types = [queries, typeDefs];

export default mergeTypeDefs(types);
