import { mergeTypeDefs } from "@graphql-tools/merge";

import mutations from "./mutations.graphql";
import queries from "./queries.graphql";
import scalars from "./scalars.graphql";
import typeDefs from "./schema.graphql";

const types = [mutations, queries, typeDefs, scalars];

export default mergeTypeDefs(types);
