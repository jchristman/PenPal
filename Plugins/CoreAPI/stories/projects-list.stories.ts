import React, { useState } from "react";

import { Components } from "@penpal/core";
import { SetupProviders } from "stories/common.ts";

export const TableView = () => (
  <SetupProviders>
    <Components.Projects />
  </SetupProviders>
);

export default {
  title: "PenPal/CoreAPI/Projects List",
};
