import { types, resolvers, loaders } from "./graphql/";
import _ from "lodash";
import PenPal from "meteor/penpal";

import { name as PLUGIN_NAME } from "./manifest.json";
import startN8nServer from "./n8n/n8n.js";
import WebhookManager from "./n8n/webhook.js";
import { WebhooksCollectionName } from "./constants.js";
import NodeBuilder from "./n8n/node-builder.js";
import check_n8n from "./n8n/check-n8n.js";

PenPal.N8n = { NodeBuilder };

const settings = {
  datastores: [
    {
      name: WebhooksCollectionName
    }
  ]
};

const loadN8n = async () => {
  // Load stored webhooks
  const stored_webhooks = PenPal.DataStore.fetch(
    PLUGIN_NAME,
    WebhooksCollectionName,
    {}
  );

  _.each(stored_webhooks, (webhook) =>
    WebhookManager.registerWebhook(webhook, true)
  );

  // And then start the N8n server
  startN8nServer();
};

const N8nPlugin = {
  loadPlugin() {
    return {
      graphql: {
        types,
        resolvers
      },
      settings,
      hooks: {
        settings: { n8n: check_n8n },
        startup: loadN8n
      }
    };
  }
};

export default N8nPlugin;
