import { ApolloServer } from "apollo-server-express";
import { makeExecutableSchema } from "graphql-tools";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { applyMiddleware } from "graphql-middleware";
import { WebApp } from "meteor/webapp";
import PenPal from "meteor/penpal";
import _ from "lodash";

import { getUser } from "./get-meteor-user.js";
import { types, resolvers, buildLoaders } from "./graphql";

const startGraphQLServer = (
  plugins_types = {},
  plugins_resolvers = {},
  plugins_buildLoaders = () => null
) => {
  console.log("[.] Starting GraphQL Server");
  const _resolvers = _.merge(resolvers, plugins_resolvers);
  const _typeDefs = mergeTypeDefs([types, plugins_types]);

  const schema = applyMiddleware(
    makeExecutableSchema({
      typeDefs: _typeDefs,
      resolvers: _resolvers,
      inheritResolversFromInterfaces: true
    })
  );

  const server = new ApolloServer({
    schema,
    introspection: true,
    playground: true,
    formatError: (err) => {
      console.error(
        `${err.name} ::: ${
          err.message
        }\n${err.extensions?.exception?.stacktrace.join("\n")}`
      );
      return err;
    },
    context: async ({ req }) => {
      let loaders = {};

      loaders = _.extend(loaders, buildLoaders());
      loaders = _.extend(loaders, plugins_buildLoaders());

      const user = await getUser(req.headers.authorization_token);
      if (user !== undefined) {
        user.id = user._id;
        await loaders.webappUsersLoader.prime(user.id, user);
      }

      const PenPalCachingAPI = PenPal.API.CachingAPI();

      return {
        user: user,
        loaders,
        PenPalCachingAPI
      };
    }
  });

  server.applyMiddleware({
    app: WebApp.connectHandlers,
    path: "/graphql"
  });

  WebApp.connectHandlers.use("/graphql", (req, res) => {
    if (req.method === "GET") {
      res.end();
    }
  });

  console.log("[+] GraphQL Server is running!");
};

export default startGraphQLServer;
