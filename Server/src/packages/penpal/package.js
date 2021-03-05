Package.describe({
  name: "penpal",
  version: "0.1.0"
});

Package.onUse(function (api) {
  api.use("ecmascript");

  api.mainModule("penpal-server.js", "server");
  api.mainModule("penpal-client.js", "client");
});

Npm.depends({
  "gql-query-builder": "3.5.0",
  "lodash": "4.17.15"
});
