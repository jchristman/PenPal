import React, { useState } from "react";
import _ from "lodash";

import { Components } from "meteor/penpal";
import { SetupProviders } from "stories/common.js";

export const Login = () => (
  <SetupProviders>
    <Components.Login />
  </SetupProviders>
);

export default {
  title: "Layout/Login"
};
