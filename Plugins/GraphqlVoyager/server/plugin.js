import { express as voyagerMiddleware } from "graphql-voyager/middleware";

const startGraphQLVoyager = async () => {
  console.log("[.] Starting GraphQL Voyager");
  // TODO: use something different than webapp since meteor is gone
  //WebApp.connectHandlers.use(
  //  "/voyager",
  //  voyagerMiddleware({ endpointUrl: "/graphql" })
  //);
};

const GraphqlVoyagerPlugin = {
  loadPlugin() {
    return {
      hooks: {
        startup: startGraphQLVoyager,
      },
    };
  },
};

export default GraphqlVoyagerPlugin;
