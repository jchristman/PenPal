// Straight copy/paste from https://github.com/orionsoft/meteor-apollo-accounts/blob/master/client/src/store.js

interface TokenData {
  userId: string;
  token: string;
  tokenExpires: string;
}

interface TokenStore {
  set: (data: { userId: string; token: string; tokenExpires: Date }) => Promise<void>;
  get: () => Promise<TokenData>;
}

const onChangeCallbacks: ((data: TokenData) => void)[] = [];

let tokenStore: TokenStore = {
  set: async function({ userId, token, tokenExpires }) {
    global.localStorage["Meteor.userId"] = userId;
    global.localStorage["Meteor.loginToken"] = token;
    global.localStorage["Meteor.loginTokenExpires"] = tokenExpires.toString();
  },
  get: async function() {
    return {
      userId: global.localStorage["Meteor.userId"],
      token: global.localStorage["Meteor.loginToken"],
      tokenExpires: global.localStorage["Meteor.loginTokenExpires"]
    };
  }
};

export const setTokenStore = function(newStore: TokenStore): void {
  tokenStore = newStore;
};

export const storeLoginToken = async function(userId: string, token: string, tokenExpires: Date): Promise<void> {
  await tokenStore.set({ userId, token, tokenExpires });
  await tokenDidChange();
};

export const getLoginToken = async function(): Promise<string> {
  const { token } = await tokenStore.get();
  return token;
};

export const getUserId = async function(): Promise<string> {
  const { userId } = await tokenStore.get();
  return userId;
};

const tokenDidChange = async function(): Promise<void> {
  const newData = await tokenStore.get();
  for (const callback of onChangeCallbacks) {
    callback(newData);
  }
};

export const onTokenChange = function(callback: (data: TokenData) => void): void {
  onChangeCallbacks.push(callback);
};

export const resetStore = async function(): Promise<void> {
  await storeLoginToken("", "", new Date());
};
