import { getDirectives } from "@graphql-tools/utils";
import PenPal from "#penpal/core";
import { CoreAPILogger } from "../plugin.ts";

const DIRECTIVE_NAMES = {
  UI_COMPONENT: "uiComponent",
  UI_GROUP: "uiGroup",
  ENRICHMENT_DISPLAY: "enrichmentDisplay",
};

// Cache to store parsed directive information
const directiveCache = new Map();

/**
 * Parses the directives for a given GraphQL field or type.
 * @param {object} node - The GraphQL field or type node.
 * @param {object} schema - The executable GraphQL schema.
 * @returns {object} - An object containing the parsed directives.
 */
function getParsedDirectives(node, schema) {
  const allDirectives = getDirectives(schema, node);
  const uiDirectives = {};

  for (const directive of allDirectives) {
    if (Object.values(DIRECTIVE_NAMES).includes(directive.name)) {
      uiDirectives[directive.name] = directive.args;
    }
  }

  return uiDirectives;
}

/**
 * Introspects the entire schema to build a map of UI directives.
 * @param {object} schema - The executable GraphQL schema.
 */
export function parseIntrospection(schema) {
  if (directiveCache.size > 0) {
    // Already parsed
    return;
  }

  const typeMap = schema.getTypeMap();

  for (const typeName in typeMap) {
    const type = typeMap[typeName];

    // Skip internal types
    if (typeName.startsWith("__")) {
      continue;
    }

    const typeDirectives = getParsedDirectives(type, schema);
    if (Object.keys(typeDirectives).length > 0) {
      if (!directiveCache.has(typeName)) {
        directiveCache.set(typeName, { fields: {} });
      }
      directiveCache.get(typeName).typeDirectives = typeDirectives;
    }

    if (typeof type.getFields === "function") {
      const fields = type.getFields();
      for (const fieldName in fields) {
        const field = fields[fieldName];
        const fieldDirectives = getParsedDirectives(field, schema);

        if (Object.keys(fieldDirectives).length > 0) {
          if (!directiveCache.has(typeName)) {
            directiveCache.set(typeName, { fields: {} });
          }
          directiveCache.get(typeName).fields[fieldName] = fieldDirectives;
        }
      }
    }
  }
}

/**
 * Retrieves the UI directive configuration for a specific type.
 * @param {string} typeName - The name of the GraphQL type.
 * @returns {object|undefined} - The UI configuration for the type.
 */
export function getUIDirectivesForType(typeName) {
  // Defensive: If cache is empty, try to parse the schema now
  if (directiveCache.size === 0 && PenPal?.GraphQL?.schema) {
    CoreAPILogger.info("Parsing schema for UI directives");
    parseIntrospection(PenPal.GraphQL.schema);
    CoreAPILogger.info(
      `Schema parsed for UI directives. ${directiveCache.size} types found.`
    );
  }
  return directiveCache.get(typeName);
}
