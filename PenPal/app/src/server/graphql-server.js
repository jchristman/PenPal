import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { makeExecutableSchema } from "@graphql-tools/schema";

import PenPal from "#penpal/core";
import _ from "lodash";

import { loadGraphQLFiles, resolvers, buildLoaders } from "./graphql/index.js";

const startGraphQLServer = async (
  plugins_types = {},
  plugins_resolvers = {},
  plugins_buildLoaders = () => null
) => {
  console.log("[.] Loading GraphQL Files...");
  const types = await loadGraphQLFiles();
  const _resolvers = _.merge(resolvers, plugins_resolvers);
  const _typeDefs = mergeTypeDefs([types, plugins_types]);

  const schema = makeExecutableSchema({
    typeDefs: _typeDefs,
    resolvers: _resolvers,
    inheritResolversFromInterfaces: true,
  });

  const server = new ApolloServer({
    schema,
    allowBatchedHttpRequests: true,
    introspection: true,
    playground: true,
    formatError: (err) => {
      console.error(
        `${err.extensions?.code ?? "Unknown Error"} ::: ${
          err.message
        }\n${err.extensions?.exception?.stacktrace.join("\n")}`
      );
      return err;
    },
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 3001 },
    context: async ({ req }) => {
      let loaders = {};

      loaders = _.extend(loaders, buildLoaders());
      loaders = _.extend(loaders, plugins_buildLoaders());

      //const user = await getUser(req.headers.authorization_token);
      //if (user !== undefined) {
      //  user.id = user._id;
      //  await loaders.webappUsersLoader.prime(user.id, user);
      //}

      // FIXME
      const PenPalCachingAPI = PenPal.API.CachingAPI();

      return {
        //user: user,
        loaders,
        PenPalCachingAPI,
      };
    },
  });

  console.log(`[+] GraphQL Server is running at ${url}`);
};

export default startGraphQLServer;
