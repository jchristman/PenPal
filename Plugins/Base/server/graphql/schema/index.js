import { mergeTypeDefs } from "@graphql-tools/merge";

import mutations from "./mutations.graphql";
import queries from "./queries.graphql";
import schema from "./schema.graphql";
import dashboardable from "./dashboardable.graphql";

const types = [mutations, queries, schema, dashboardable];

export default mergeTypeDefs(types);
