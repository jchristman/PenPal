import WebhookManager from "../../n8n/webhook.js";

export default {
  async createN8nWebhook(root, { name, url, type, trigger }, context) {
    console.log("[.] Creating webhook", name, url, trigger, type);
    const id = WebhookManager.registerWebhook({ type, trigger, name, url });

    return {
      id,
      url,
      name,
      type,
      trigger
    };
  },

  async deleteN8nWebhook(root, { id }, context) {
    console.log("[.] Deleting webhook", id);
    return WebhookManager.deleteWebhook(id);
  }
};
