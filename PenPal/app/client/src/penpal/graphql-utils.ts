import {
  query as queryBuilder,
  mutation as mutationBuilder,
} from "gql-query-builder";
import gql from "graphql-tag";

interface GraphQLTypeNode {
  kind: string;
  name?: string;
  ofType?: GraphQLTypeNode;
  fields?: GraphQLField[];
}

interface GraphQLField {
  name: string;
  type: GraphQLTypeNode;
  args?: GraphQLArg[];
}

interface GraphQLArg {
  name: string;
  type: GraphQLTypeNode;
}

interface QueryConfig {
  operation?: string;
  fields?: any[];
}

interface SchemaMap {
  [key: string]: GraphQLTypeNode;
}

interface MutationMap {
  [key: string]: {
    args: GraphQLArg[];
    type: GraphQLTypeNode;
  };
}

// ----------------------------------------------------------------------------

export const process_schema = (
  types: SchemaMap,
  schema_root: GraphQLTypeNode | undefined,
  depth: number = 0
): any => {
  let query: any = {};

  query.fields = [];
  // Guard: if schema_root is missing or has no fields (e.g., SCALAR types), return empty fields
  if (!schema_root || !Array.isArray(schema_root.fields)) {
    return depth === 0 ? query : query.fields;
  }

  for (let field of schema_root.fields) {
    if (field.type.kind === "SCALAR" || field.type.ofType?.kind === "SCALAR") {
      query.fields.push(field.name);
    } else {
      if (field.type.kind === "LIST" && field.type.ofType?.name) {
        const _query = process_schema(
          types,
          types[field.type.ofType.name],
          depth + 1
        );
        query.fields.push({ [field.name]: _query });
      } else if (field.type.kind === "NON_NULL" && field.type.ofType?.name) {
        const _query = process_schema(
          types,
          types[field.type.ofType.name],
          depth + 1
        );
        query.fields.push({ [field.name]: _query });
      } else if (field.type.name) {
        const _query = process_schema(types, types[field.type.name], depth + 1);
        query.fields.push({ [field.name]: _query });
      }
    }
  }

  return depth === 0 ? query : query.fields;
};

export const generateQueryFromSchema = (
  types: SchemaMap | false,
  schema_root: string | false,
  query_name: string | false
): any => {
  if (types === false || schema_root === false || query_name === false) {
    return gql`
      {
        nop
      }
    `;
  }

  const query_config = process_schema(types, types[schema_root]);
  query_config.operation = query_name;
  const { query } = queryBuilder(query_config);
  return gql`
    ${query}
  `;
};

export const generateQueryFromSchemas = (
  types: SchemaMap | false,
  schemas: { schema_root: string; query_name: string }[] = []
): any => {
  if (types === false || schemas.length === 0) {
    return gql`
      {
        nop
      }
    `;
  }

  const queries = schemas.map(({ schema_root, query_name }) => {
    const query_config = process_schema(types, types[schema_root]);
    query_config.operation = query_name;
    const { query } = queryBuilder(query_config);
    try {
      const match = query.match(/query\s+{\s+(.*)\s+}/);
      const inner_query = match ? match[1] : "";
      return inner_query;
    } catch (e) {
      console.error("GenerateQueryFromSchemas Error:", e);
      return "";
    }
  });

  return gql`{
    ${queries.join("\n")}
  }`;
};

// Helper: unwrap nested type to base named type
const unwrapTypeName = (
  typeNode: GraphQLTypeNode | undefined
): string | undefined => {
  if (!typeNode) return undefined;
  if (typeNode.kind === "NON_NULL" || typeNode.kind === "LIST") {
    return unwrapTypeName(typeNode.ofType);
  }
  return typeNode.name;
};

// Helper: unwrap kind (for root return kinds when name points to object)
const unwrapKind = (
  typeNode: GraphQLTypeNode | undefined
): string | undefined => {
  if (!typeNode) return undefined;
  if (typeNode.kind === "NON_NULL" || typeNode.kind === "LIST") {
    return unwrapKind(typeNode.ofType);
  }
  return typeNode.kind;
};

// Helper: build GraphQL type string from type node (handles NON_NULL/LIST nesting)
const buildTypeString = (typeNode: GraphQLTypeNode | undefined): string => {
  if (!typeNode) return "String"; // fallback
  if (typeNode.kind === "NON_NULL") {
    return `${buildTypeString(typeNode.ofType)}!`;
  }
  if (typeNode.kind === "LIST") {
    return `[${buildTypeString(typeNode.ofType)}]`;
  }
  // If name missing at this level, try ofType (some servers omit at top-level)
  return typeNode.name || buildTypeString(typeNode.ofType) || "String";
};

export const generateMutationFromSchema = (
  types: SchemaMap | false,
  mutations: MutationMap | false,
  mutation_name: string | false
): any => {
  if (types === false || mutations === false || mutation_name === false) {
    return gql`
      mutation {
        nop
      }
    `;
  }

  const mutation_schema = mutations[mutation_name as string];
  const variables = (mutation_schema?.args || []).reduce((acc, variable) => {
    acc[variable.name] = {
      value: null,
      type: buildTypeString(variable?.type),
    };
    return acc;
  }, {} as Record<string, { value: null; type: string }>);

  // Determine fields for return type. If scalar, request no fields
  const returnTypeName = unwrapTypeName(mutation_schema.type);
  const returnKind = unwrapKind(mutation_schema.type);
  const selection =
    returnKind === "SCALAR"
      ? { fields: [] }
      : returnTypeName
      ? process_schema(types, types[returnTypeName])
      : { fields: [] };

  const mutation_config = {
    operation: mutation_name,
    variables,
    fields: selection.fields,
  };

  const { query: mutation } = mutationBuilder(mutation_config);

  return gql`
    ${mutation}
  `;
};
