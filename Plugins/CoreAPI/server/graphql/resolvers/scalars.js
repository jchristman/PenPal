import { Kind, GraphQLError, GraphQLScalarType } from "graphql";

const REGEX = {};
REGEX.ip_address = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
REGEX.subnet = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:3[0-2]|[12][0-9]|[0-9])$/;

const parseIPAddress = value => {
  if (!REGEX.ip_address.test(value)) {
    throw new TypeError(`${value} is not a properly formed IP Address`);
  }
  return value;
};

const GraphQLIPAddress = new GraphQLScalarType({
  name: "IPAddress",

  description:
    "Requires that the string passed that is parsed match an IP Address regex",

  serialize: parseIPAddress,
  parseValue: parseIPAddress,
  parseLiteral: ast => {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        `Can only validate strings as an IP Address but got a: ${ast.kind}`
      );
    }

    return parseIPAddress(ast.value);
  }
});

// ---------------------------------------------------------------------------------

const parseIPSubnet = value => {
  if (!REGEX.subnet.test(value)) {
    throw new TypeError(
      `${value} is not a properly formed IP Address subnet (e.g. 192.168.0.0/24)`
    );
  }

  const [network_address, subnet_mask] = value.split("/");
  return { network_address, subnet_mask };
};

const serializeIPSubnet = ({ network_address, subnet_mask }) => {
  return `${network_address}/${subnet_mask}`;
};

const GraphQLIPSubnet = new GraphQLScalarType({
  name: "IPSubnet",

  description: `Requires that the string passed that is parsed match an IP Subnet regex (e.g. 192.168.0.0/24). When successfully parsed, an object is returned with a structure of { network_address: "192.168.0.0", subnet_mask: 24 }`,

  serialize: serializeIPSubnet,
  parseValue: parseIPSubnet,
  parseLiteral: ast => {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        `Can only validate strings as an IP Subnet but got a: ${ast.kind}`
      );
    }

    return parseIPSubnet(ast.value);
  }
});

export default [{ IPAddress: GraphQLIPAddress, IPSubnet: GraphQLIPSubnet }];
