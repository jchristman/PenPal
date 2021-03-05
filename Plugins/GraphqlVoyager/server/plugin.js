import { express as voyagerMiddleware } from "graphql-voyager/middleware";
import { WebApp } from "meteor/webapp";

const startGraphQLVoyager = async () => {
  console.log("[.] Starting GraphQL Voyager");
  WebApp.connectHandlers.use(
    "/voyager",
    voyagerMiddleware({ endpointUrl: "/graphql" })
  );
};

const GraphqlVoyagerPlugin = {
  loadPlugin() {
    return {
      hooks: {
        startup: startGraphQLVoyager
      }
    };
  }
};

export default GraphqlVoyagerPlugin;
