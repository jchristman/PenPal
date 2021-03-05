import PenPal from "meteor/penpal";
import _ from "lodash";

import { required_field } from "./common.js";

// -----------------------------------------------------------

export const getProject = async project_id => {
  return await PenPal.DataStore.fetchOne("CoreAPI", "Projects", {
    id: project_id
  });
};

export const getProjects = async (project_ids = [], options) => {
  return await PenPal.DataStore.fetch(
    "CoreAPI",
    "Projects",
    project_ids.length === 0 ? {} : { id: { $in: project_ids } },
    options
  );
};

export const getProjectsPaginationInfo = async (project_ids = [], options) => {
  return await PenPal.DataStore.getPaginationInfo(
    "CoreAPI",
    "Projects",
    project_ids.length === 0 ? {} : { id: { $in: project_ids } },
    options
  );
};

// -----------------------------------------------------------

const default_project = {
  dates: {},
  scope: { hosts: [], networks: [] }
};

export const insertProject = async project => {
  return await insertProjects([project]);
};

export const insertProjects = async projects => {
  const rejected = [];
  const _accepted = [];
  const accepted = [];

  for (let project of projects) {
    try {
      required_field(project, "customer", "insertion");
      required_field(project, "name", "insertion");

      let customer = await PenPal.DataStore.fetchOne("CoreAPI", "Customers", {
        id: project.customer
      });

      if (customer?.id === undefined) {
        throw new Meteor.Error(404, `Customer ${project.customer} not found`);
      }

      const _project = _.merge(default_project, project);
      _project.dates.created_at = new Date();

      _accepted.push(_project);
    } catch (e) {
      rejected.push({ project, error: e });
    }
  }

  if (_accepted.length > 0) {
    let result = await PenPal.DataStore.insertMany(
      "CoreAPI",
      "Projects",
      _accepted
    );

    accepted.push(...result);
  }

  if (accepted.length > 0) {
    // TODO: maybe make this a call to the customer API to update the customer instead of doing the raw database queries here?
    // Add the id to the customer
    let customer = await PenPal.DataStore.fetchOne("CoreAPI", "Customers", {
      id: accepted[0].customer
    });

    customer.projects.push(...accepted.map(p => p.id));

    await PenPal.DataStore.update(
      "CoreAPI",
      "Customers",
      { id: customer.id },
      { $set: { projects: customer.projects } }
    );
  }

  return { accepted, rejected };
};

// -----------------------------------------------------------

export const updateProject = async project => {
  return await updateProjects([project]);
};

export const updateProjects = async projects => {
  const rejected = [];
  const _accepted = [];
  const accepted = [];

  for (let project of projects) {
    try {
      required_field(project, "id", "update");
      _accepted.push(project);
    } catch (e) {
      rejected.push({ project, error: e });
    }
  }

  if (_accepted.length > 0) {
    let matched_projects = await PenPal.DataStore.fetch("CoreAPI", "Projects", {
      id: {
        $in: _accepted.map(project => project.id)
      }
    });

    if (matched_projects.length !== _accepted.length) {
      // Find the unknown IDs
    }

    for (let { id, ...project } of _accepted) {
      let res = await PenPal.DataStore.update(
        "CoreAPI",
        "Projects",
        { id },
        { $set: project }
      );

      if (res > 0) accepted.push({ id, ...project });
    }
  }

  return { accepted, rejected };
};

// -----------------------------------------------------------

export const upsertProjects = async projects => {
  let to_update = [];
  let to_insert = [];

  for (let project of projects) {
    if (project.id !== undefined) {
      to_update.push(project);
    } else {
      to_insert.push(project);
    }
  }

  const inserted = await insertProjects(to_insert);
  const updated = await updateProjects(to_update);

  return { inserted, updated };
};

// -----------------------------------------------------------

export const removeProject = async project_id => {
  return await removeProjects([project_id]);
};

export const removeProjects = async project_ids => {
  let res = await PenPal.DataStore.delete("CoreAPI", "Projects", {
    id: { $in: project_ids }
  });

  if (res > 0) {
    return true;
  }

  return false;
};
