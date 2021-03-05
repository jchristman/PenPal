import gql from 'graphql-tag';

export default gql`{
	getConfigurablePlugins {
    id
    name
    version
    settings {
      configuration {
        schema_root
        getter
        setter
      }
    }
  }
}`;
