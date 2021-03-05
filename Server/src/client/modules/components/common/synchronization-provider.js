import React, { createContext, useContext, useState } from "react";
import { Components, registerComponent, registerHook } from "meteor/penpal";
import useInterval from "@use-it/interval";

const SynchronizationContext = createContext({});

const SynchronizationProvider = ({ interval, children }) => {
  const [syncValue, setSyncValue] = useState({});
  useInterval(() => setSyncValue({}), interval);

  return (
    <SynchronizationContext.Provider value={syncValue}>
      {children}
    </SynchronizationContext.Provider>
  );
};

const useSyncronization = () => useContext(SynchronizationContext);

registerComponent("SynchronizationProvider", SynchronizationProvider);
registerHook("useSyncronization", useSyncronization);
