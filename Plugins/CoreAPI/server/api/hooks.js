import { Meteor } from "meteor/meteor";
import _ from "lodash";

// Hooks for getting IDs

const implemented_hooks = ["host", "network"];
const non_implemented_hooks = ["project", "service"];
const hooks = {};
_.each(implemented_hooks, (hook) => {
  hooks[hook] = { new: [], delete: [], update: [] };
});
_.each(non_implemented_hooks, (hook) => {
  hooks[hook] = { new: [], delete: [], update: [] };
});

// Register a hook
// target = 'project' | 'host' | 'network' | 'service'
// trigger = 'new' | 'update' | 'delete'
// name = 'unique hook name'
// func = a function to call that takes a single argument that is an array of type IDs
export function registerHook(target, trigger, id, func) {
  const hook = { id, hook: func };
  let hook_location = null;

  if (_.includes(non_implemented_hooks, target)) {
    console.log(`${target} hooks not yet implemented`);
  } else if (_.includes(implemented_hooks, target)) {
    hook_location = hooks[target]?.[trigger];
  }

  if (hook_location === null) {
    throw new Meteor.Error(
      404,
      `${target}.${trigger} trigger not yet implemented`
    );
  }

  hook_location.push(hook);
}

export function deleteHook(id) {
  _.each(hooks, (hook_type, key1) => {
    _.each(hook_type, (hook_array, key2) => {
      hooks[key1][key2] = hook_array.filter((hook) => hook.id !== id);
    });
  });
}

export function newHostHooks(project_id, host_ids) {
  for (let { hook } of hooks.host.new) {
    hook({ projectID: project_id, hostIDs: host_ids });
  }
}

export function updatedHostHooks(host_ids) {
  for (let { hook } of hooks.host.update) {
    hook(host_ids);
  }
}

export function deletedHostHooks(hosts) {
  for (let { hook } of hooks.host.delete) {
    hook(hosts);
  }
}

export function newNetworkHooks(project_id, network_ids) {
  for (let { hook } of hooks.network.new) {
    hook({ projectID: project_id, networkIDs: network_ids });
  }
}

export function updatedNetworkHooks(network_ids) {
  for (let { hook } of hooks.network.update) {
    hook(network_ids);
  }
}

export function deletedNetworkHooks(networks) {
  for (let { hook } of hooks.network.delete) {
    hook(networks);
  }
}
