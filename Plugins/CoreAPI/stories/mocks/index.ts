import get_customers_mocks from "./get-customers.ts";
import get_project_summaries_mocks from "./get-project-summaries.ts";
import get_project_details_mocks from "./get-project-details.ts";

export default [
  ...get_customers_mocks,
  ...get_project_summaries_mocks,
  ...get_project_details_mocks
];
