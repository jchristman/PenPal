import { mergeTypeDefs } from "@graphql-tools/merge";

import webapp_mutations from "./webapp.graphql";

const mutations: any[] = [webapp_mutations];

export default mergeTypeDefs(mutations);
