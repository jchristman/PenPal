import { mergeTypeDefs } from "@graphql-tools/merge";

//import mutations from "./mutations.graphql";
import queries from "./queries.graphql";
//import typeDefs from "./schema.graphql";

const types = [queries];

export default mergeTypeDefs(types);
