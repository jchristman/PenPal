import { mergeTypeDefs } from "@graphql-tools/merge";

import mutations from "./mutations.graphql";
import typeDefs from "./schema.graphql";

const types = [mutations, typeDefs];

export default mergeTypeDefs(types);
