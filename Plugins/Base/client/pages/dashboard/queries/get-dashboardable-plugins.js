import gql from 'graphql-tag';

export default gql`{
	getDashboardablePlugins {
    id
    name
    version
    settings {
      dashboard {
        schema_root
        getter
      }
    }
  }
}`;
