import { Meteor } from "meteor/meteor";

export default {
  WebappUser: {
    id: async ({ id }, args, context) => id,
    emails: async ({ emails }, args, context) => {
      return emails.map(email => email.address);
    }
  },

  WebappAuthResult: {
    async user({ userId, ...rest }, args, context) {
      const user = Meteor.users.findOne({ _id: userId });
      return { id: user._id, ...user };
    }
  }
};
