import get_customers_mocks from "./get-customers.js";
import get_project_summaries_mocks from "./get-project-summaries.js";
import get_project_details_mocks from "./get-project-details.js";

export default [
  ...get_customers_mocks,
  ...get_project_summaries_mocks,
  ...get_project_details_mocks
];
