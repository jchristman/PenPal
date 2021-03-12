import React, { useState } from "react";

import { Components } from "meteor/penpal";
import { SetupProviders } from "stories/common.js";

export const TableView = () => (
  <SetupProviders>
    <Components.Projects />
  </SetupProviders>
);

export default {
  title: "PenPal/CoreAPI/Projects List"
};
