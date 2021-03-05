/* eslint-disable no-var, prefer-arrow-callback */
var packages = ["ecmascript", "isobuild:compiler-plugin@1.0.0"];

Package.describe({
  name: "penpal:graphql",
  version: "0.1.0",
  summary: "Compiler plugin that supports GraphQL files in Meteor",
  git: "https://github.com/swydo/meteor-graphql",
  documentation: "README.md"
});

Package.registerBuildPlugin({
  name: "compile-graphql",
  use: ["ecmascript"],
  sources: ["compiler.js", "plugin.js"],
  npmDependencies: {
    graphql: "15.3.0",
    "graphql-tag": "2.11.0"
  }
});

Package.onUse(function use(api) {
  api.versionsFrom("1.3.2.4");

  api.use(packages, ["server", "client"]);
});

Package.onTest(function test(api) {
  api.use(packages, ["server", "client"]);
  api.use("penpal:graphql");

  api.use(["meteortesting:mocha"]);

  api.mainModule("specs/server.spec.js", "server");
  api.mainModule("specs/client.spec.js", "client");
});
