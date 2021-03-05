import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";

const setAppSettings = () => {
  Accounts.config({
    sendVerificationEmail: false,
    forbidClientAccountCreation: false
  });
};

export default setAppSettings;
