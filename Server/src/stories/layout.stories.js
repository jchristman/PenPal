import React from "react";
import { storiesOf } from "@storybook/react";

import { Components } from "meteor/penpal";
import { SetupProviders } from "stories/common.js";

// Layout
/* --------------------------------------------- */
const layout = storiesOf("PenPal/Layout", module);
layout.add("Default", () => (
  <SetupProviders>
    <Components.Layout>
      No subpages will render in the storybook
    </Components.Layout>
  </SetupProviders>
));
