import { Kind, GraphQLError, GraphQLScalarType } from "graphql";

const parseMilliseconds = value => {
  let parsedValue = parseInt(value, 10);
  if (parsedValue < 0) {
    throw new TypeError(
      `Milliseconds value ${parsedValue} must be greater than 0`
    );
  }
  return parsedValue;
};

export const GraphQLMilliseconds = new GraphQLScalarType({
  name: "Milliseconds",

  description:
    "A convenience alias for integers to be explicit for someone using a field expecting milliseconds",

  serialize: parseMilliseconds,
  parseValue: parseMilliseconds,
  parseLiteral: ast => {
    if (ast.kind !== Kind.INT) {
      throw new GraphQLError(
        `Can only validate integers as milliseconds but go a: ${ast.kind}`
      );
    }

    return parseMilliseconds(ast.value);
  }
});

export default [{ Milliseconds: GraphQLMilliseconds }];
