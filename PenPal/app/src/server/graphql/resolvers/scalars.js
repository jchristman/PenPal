import { GraphQLDate, LongResolver, JSONResolver } from "graphql-scalars";

export default [
  { Date: GraphQLDate },
  { Long: LongResolver },
  { JSON: JSONResolver },
];
