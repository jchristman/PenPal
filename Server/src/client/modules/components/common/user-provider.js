import React, { createContext, useContext, useState, useEffect } from "react";
import { Components, registerComponent, registerHook } from "meteor/penpal";
import { Accounts } from "meteor/accounts-base";
import { useMutation, useQuery, useApolloClient } from "@apollo/client";
import { useSnackbar } from "notistack";

import { storeLoginToken, getLoginToken, resetStore } from "./store.js";

import {
  AUTHENTICATE_WITH_PASSWORD,
  SIGNUP,
  CURRENT_USER,
  LOGOUT
} from "./user-provider-gql.js";

const AccountContext = createContext({});

const AccountProvider = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar();
  const apollo_client = useApolloClient();
  const [authTokenLoaded, setAuthTokenLoaded] = useState(
    Accounts._storedLoginToken() !== null
  ); // Needed to avoid a race condition on cache writing

  const {
    loading: user_loading,
    error: user_error,
    data: { currentUser } = {}
  } = useQuery(CURRENT_USER, {
    skip: !authTokenLoaded,
    pollInterval: authTokenLoaded ? 15000 : 0
  });

  const [authenticateWithPassword] = useMutation(AUTHENTICATE_WITH_PASSWORD, {
    update(
      cache,
      {
        data: {
          authenticateWithPassword: { user }
        }
      }
    ) {
      const data = { currentUser: user };
      cache.writeQuery({
        query: CURRENT_USER,
        data
      });
    }
  });
  const login_func = async (email, password) => {
    try {
      const {
        data: {
          authenticateWithPassword: { userId, token, tokenExpires }
        }
      } = await authenticateWithPassword({
        variables: { email, password }
      });

      await storeLoginToken(userId, token, new Date(tokenExpires));
      setAuthTokenLoaded(true);
    } catch (e) {
      console.error(e);
      enqueueSnackbar(e.message, {
        variant: "error",
        autoHideDuration: 5000
      });
    }
  };

  const clearTokensAndState = async () => {
    await resetStore();
    setAuthTokenLoaded(false);
    apollo_client.cache.reset();
  };

  const [logout] = useMutation(LOGOUT, {
    update(cache, { data: { logout } }) {
      const data = cache.readQuery({ query: CURRENT_USER });
      if (logout) {
        cache.writeQuery({ query: CURRENT_USER, data: { currentUser: null } });
      }
    }
  });
  const logout_func = async () => {
    const token = await getLoginToken();
    try {
      await logout({
        variables: { token },
        optimisticResponse: {
          __typename: "Mutation",
          logout: true
        }
      });

      // While logging in, we manipulate our stored auth tokens after successful login.
      // For logout, we optimistically log ourselves out and go to the login screen, but
      // we only delete our stored tokens after the server return
      await clearTokensAndState();
    } catch (e) {
      console.error(e);
      enqueueSnackbar(e.message, {
        variant: "error",
        autoHideDuration: 10000
      });
    }
  };

  const [signup] = useMutation(SIGNUP, {
    update(
      cache,
      {
        data: {
          signup: { user }
        }
      }
    ) {
      const data = { currentUser: user };
      cache.writeQuery({
        query: CURRENT_USER,
        data
      });
    }
  });
  const signup_func = async (email, password) => {
    try {
      const {
        data: {
          signup: { userId, token, tokenExpires }
        }
      } = await signup({
        variables: { email, password }
      });

      await storeLoginToken(userId, token, new Date(tokenExpires));
      setAuthTokenLoaded(true);
    } catch (e) {
      // If it's an "admin must approve your account" message
      if (/admin.*approve/i.test(e.message)) {
        enqueueSnackbar(
          "An admin must approve your account prior to logging in.",
          { variant: "info", autoHideDuration: 5000 }
        );
        return true;
      }

      enqueueSnackbar(e.message, {
        variant: "error",
        autoHideDuration: 5000
      });
      return false;
    }

    return true;
  };

  // On pretty much any error with the currentUser query, we are just going to bail on our
  // logged in session to get rid of any weird cache issues
  useEffect(() => {
    if (user_error !== undefined) {
      console.error(user_error);
      console.log("Clearing tokens and state");
      (async () => clearTokensAndState())();
    }
  }, [user_error]);

  const data = {
    user: currentUser,
    loggedIn:
      currentUser !== undefined && currentUser !== null && authTokenLoaded,
    loading: user_loading,
    login: login_func,
    logout: logout_func,
    signup: signup_func
  };

  //console.log(data, authTokenLoaded);

  return (
    <AccountContext.Provider value={data}>{children}</AccountContext.Provider>
  );
};

const useAccount = () => useContext(AccountContext);

registerComponent("AccountProvider", AccountProvider);
registerHook("useAccount", useAccount);
