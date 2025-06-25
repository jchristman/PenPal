export default {
  WebappUser: {
    id: async ({ id }, args, context) => id,
    emails: async ({ emails }, args, context) => {
      return emails.map(email => email.address);
    }
  },

  WebappAuthResult: {
    async user({ userId, ...rest }, args, context) {
      return null;
    }
  }
};
