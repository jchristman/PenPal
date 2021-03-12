import React from "react";

import { Components } from "meteor/penpal";
import { SetupProviders } from "stories/common.js";

export const NewCustomerForm = () => (
  <SetupProviders>
    <div style={{ width: 600, height: 400, border: "1px solid black" }}>
      <Components.NewCustomerForm />
    </div>
  </SetupProviders>
);

export default {
  title: "PenPal/CoreAPI/Customers"
};
