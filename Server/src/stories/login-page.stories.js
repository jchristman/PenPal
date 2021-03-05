import React, { useState } from "react";
import _ from "lodash";
import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";

import { Components } from "meteor/penpal";
import { SetupProviders } from "stories/common.js";

const explore = storiesOf("PenPal/Login", module);

explore.add("Login", () => {
  return (
    <SetupProviders>
      <Components.Login />
    </SetupProviders>
  );
});
