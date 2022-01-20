import DataLoader from "dataloader";
import _ from "lodash";
import { Meteor } from "meteor/meteor";

const batchWebappUsers = async keys => {
  // Find all requested data. This will return an array that is <= the length
  // of "keys". Per dataloader rules, the data returned from this function needs
  // to be the same length and needs to be in the correct order. So map the keys
  // array to one of the elements found in data, if a match exists
  const users = await Meteor.users
    .find({
      _id: { $in: keys }
    })
    .fetch();
  return keys.map(key => _.find(users, { _id: key }));
};

export default () =>
  new DataLoader(keys => batchWebappUsers(keys), {
    cacheKeyFn: key => key.toString()
  });
