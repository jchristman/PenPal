import { restrictToRole } from "./common";
import type { IResolvers } from '@graphql-tools/utils';

// ----------------------------------------------------------
// Mutation resolvers

interface User {
  [key: string]: any;
}

interface GraphQLContext {
  user?: User;
  [key: string]: any;
}

interface UpdateUserInput {
  roles?: string[];
  enabled?: boolean;
}

export default {
  async signup(root: any, { email, password }: { email: string; password: string }, { user }: GraphQLContext) {
    return null;
  },

  async authenticateWithPassword(root: any, { email, password }: { email: string; password: string }, { user }: GraphQLContext) {
    return null;
  },

  async logout(root: any, { token }: { token: string }, { user }: GraphQLContext) {
    return null;
  },

  async sendVerificationEmail(root: any, { email }: { email: string }, { user }: GraphQLContext) {
    return null;
  },

  async verifyEmail(root: any, { token }: { token: string }, { user }: GraphQLContext) {
    return null;
  },

  async updateUser(
    root: any,
    { user_id, update: { roles, enabled } = {} }: {
      user_id: string;
      update?: UpdateUserInput
    },
    { user }: GraphQLContext
  ) {
    return null;
  },

  async nop(): Promise<boolean> {
    return false;
  }
} as IResolvers;
