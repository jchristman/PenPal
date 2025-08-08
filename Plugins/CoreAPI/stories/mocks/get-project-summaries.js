import faker from "faker";
import _ from "lodash";
import GetProjectSummariesQuery from "../../client/pages/projects/queries/get-project-summaries.js";

const PROJECT_COUNT = 73;

const projects = _.range(PROJECT_COUNT).map((i) => ({
  id: `test-project-id-${i}`,
  name: `${faker.commerce.product()} Pentest`,
  description: "A pentest for the product",
  customer: {
    id: "test-customer-id",
    name: `${faker.company.companyName()}`,
  },
  dates: {
    created_at: faker.date.recent(),
    start: null,
    end: null,
  },
  scope: {
    hostsConnection: {
      servicesConnection: {
        totalCount: Math.ceil(Math.random() * 100),
      },
      totalCount: Math.ceil(Math.random() * 10),
    },
    networksConnection: {
      hostsConnection: {
        servicesConnection: {
          totalCount: Math.ceil(Math.random() * 300),
        },
        totalCount: Math.ceil(Math.random() * 30),
      },
      totalCount: Math.ceil(Math.random() * 10),
    },
  },
}));

const get_projects_generator = ({
  variables: { first, after, pageSize, pageNumber, searchTerm } = {},
}) => {
  let _projects = projects;

  // Apply search filter if searchTerm is provided
  if (searchTerm && searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase();
    _projects = projects.filter(
      (project) =>
        project.name.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower) ||
        project.customer.name.toLowerCase().includes(searchLower)
    );
  }

  // Apply pagination
  let finalProjects = [];
  if (first !== undefined) {
    if (after !== undefined) {
      const start = _.findIndex(_projects, (project) => project.id === after);
      if (start !== -1) {
        finalProjects = _projects.slice(start, start + first);
      }
    } else {
      finalProjects = _projects.slice(0, first === -1 ? undefined : first);
    }
  } else if (pageSize !== undefined && pageNumber !== undefined) {
    const startIndex = pageSize * pageNumber;
    finalProjects = _projects.slice(
      startIndex,
      startIndex + (pageSize === -1 ? _projects.length : pageSize)
    );
  } else {
    finalProjects = _projects;
  }

  return { projects: finalProjects, totalCount: _projects.length };
};

const pageSizes = [5, 10, 25];
const pageSize_combos = _.chain(pageSizes)
  .map((pageSize) =>
    _.range(0, Math.ceil(PROJECT_COUNT / pageSize)).map((pageNumber) => ({
      pageSize,
      pageNumber,
    }))
  )
  .flattenDeep()
  .concat({ pageSize: -1, pageNumber: 0 })
  .value();

const variable_combos = _.concat(pageSize_combos);

export default variable_combos.map((variables) => ({
  request: {
    query: GetProjectSummariesQuery,
    variables,
  },
  result: {
    data: {
      getProjects: get_projects_generator({ variables }),
    },
  },
}));
