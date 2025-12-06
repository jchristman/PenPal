import DataLoader from "dataloader";
import _ from "lodash";

interface User {
  _id: string;
  [key: string]: any;
}

const batchWebappUsers = async (keys: readonly string[]): Promise<(User | undefined)[]> => {
  // Find all requested data. This will return an array that is <= the length
  // of "keys". Per dataloader rules, the data returned from this function needs
  // to be the same length and needs to be in the correct order. So map the keys
  // array to one of the elements found in data, if a match exists
  //const users = await Meteor.users
  //  .find({
  //    _id: { $in: keys },
  //  })
  //  .fetch();
  // TODO: fix auth
  const users: User[] = [];
  return keys.map((key: string) => _.find(users, { _id: key }));
};

export default (): DataLoader<string, User | undefined> =>
  new DataLoader((keys: readonly string[]) => batchWebappUsers(keys), {
    cacheKeyFn: (key: string) => key.toString(),
  });
