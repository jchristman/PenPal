import React from "react";
import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";

import { Components } from "meteor/penpal";
import { SetupProviders } from "stories/common.js";

const customers = storiesOf("PenPal/Customers", module);
customers.add("New Customer Form", () => (
  <SetupProviders>
    <div style={{ width: 600, height: 400, border: "1px solid black" }}>
      <Components.NewCustomerForm />
    </div>
  </SetupProviders>
));
