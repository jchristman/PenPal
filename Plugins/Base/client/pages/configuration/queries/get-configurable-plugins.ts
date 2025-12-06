import { gql } from '@apollo/client';

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
