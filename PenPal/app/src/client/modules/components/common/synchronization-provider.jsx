import React, { createContext, useContext, useState } from "react";
import { Components, registerComponent, registerHook } from "@penpal/core";
import useInterval from "./use-interval.js";

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
