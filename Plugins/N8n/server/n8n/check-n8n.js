import PenPal from "meteor/penpal";
import { check, Match } from "meteor/check";

const check_n8n = (n8n) => {
  let n8n_accept = true;

  const try_check = (value, type, repr_value, repr_type) => {
    try {
      check(value, type);
    } catch (e) {
      console.error(
        `[!] settings.n8n.${repr_value} must be of type ${repr_type}`
      );
      n8n_accept = false;
    }
  };

  if (n8n.workflow_nodes !== undefined) {
    if (!Array.isArray(n8n.workflow_nodes)) {
      console.error(`settings.n8n.workflow_nodes must be of type Array`);
      n8n_accept = false;
    } else {
      for (let i = 0; i < n8n.workflow_nodes.length; i++) {
        const nodeBuilder = n8n.workflow_nodes[i];
        try_check(
          nodeBuilder,
          Match.Where(PenPal.Utils.isFunction),
          `workflow_nodes.${i}`,
          "Function"
        );
      }
    }
  }

  if (n8n.trigger_nodes !== undefined) {
    if (!Array.isArray(n8n.trigger_nodes)) {
      console.error(`settings.n8n.trigger_nodes must be of type Array`);
      n8n_accept = false;
    } else {
      for (let i = 0; i < n8n.trigger_nodes.length; i++) {
        const nodeBuilder = n8n.trigger_nodes[i];
        try_check(
          nodeBuilder,
          Match.Where(PenPal.Utils.isFunction),
          `trigger_nodes.${i}`,
          "Function"
        );
      }
    }
  }

  if (n8n.workflows !== undefined) {
    if (!Array.isArray(n8n.workflows)) {
      console.error(`settings.n8n.workflows must be of type Array`);
      n8n_accept = false;
    }
  }

  return n8n_accept;
};

export default check_n8n;
