import React from "react";

import { Components } from "meteor/penpal";
import { SetupProviders } from "stories/common.js";

export const Layout = () => (
  <SetupProviders>
    <Components.Layout>
      No subpages will render in the storybook
    </Components.Layout>
  </SetupProviders>
);

export default {
  title: "Layout"
};
