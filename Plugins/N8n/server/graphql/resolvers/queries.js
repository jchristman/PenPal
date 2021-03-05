import WebhookManager from "../../n8n/webhook.js";

export default {
  async checkN8nWebhook(root, { id }, context) {
    console.log(`[.] Checking for n8n webhook ${id}`);
    const webhook = WebhookManager.getWebhook(id);

    if (webhook === null) {
      console.log(`[!] Webhook ${id} did not exist. Returning null to n8n`);
      return null;
    }

    return { id: webhook._id, ...webhook };
  }
};
