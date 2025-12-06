import type { IResolvers } from '@graphql-tools/utils';

interface WebappUser {
  id: string;
  emails?: Array<{ address: string }>;
}

interface WebappAuthResult {
  userId?: string;
}

interface GraphQLContext {
  [key: string]: any;
}

export default {
  WebappUser: {
    id: async ({ id }: WebappUser, args: any, context: GraphQLContext): Promise<string> => id,
    emails: async ({ emails }: WebappUser, args: any, context: GraphQLContext): Promise<string[]> => {
      return emails?.map((email: { address: string }) => email.address) ?? [];
    }
  },

  WebappAuthResult: {
    async user({ userId, ...rest }: WebappAuthResult, args: any, context: GraphQLContext) {
      return null;
    }
  }
} as IResolvers;
