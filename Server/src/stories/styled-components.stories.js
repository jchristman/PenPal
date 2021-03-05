import React, { useState } from "react";
import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";

import { Components } from "meteor/penpal";
import { SetupProviders } from "stories/common.js";

const projects = storiesOf("UI/Styled Components", module);

// ------------------------------------------------------

projects.add("Button", () => (
  <SetupProviders>
    <Components.StyledButton
      variant="contained"
      color="primary"
      onClick={() => null}
    >
      Test Button
    </Components.StyledButton>
  </SetupProviders>
));

// ------------------------------------------------------

projects.add("Text Field", () => (
  <SetupProviders>
    <Components.StyledTextField
      label={"Primary field"}
      placeholder={"Placeholder"}
      helperText={"Helper Text"}
      margin={"normal"}
    />
  </SetupProviders>
));

// ------------------------------------------------------

projects.add("Date Field", () => (
  <SetupProviders>
    <Components.StyledDateField label={"This is a date picker"} />
  </SetupProviders>
));

// ------------------------------------------------------

import MenuItem from "@material-ui/core/MenuItem";
const items = [
  { id: "test-1", value: "test 1" },
  { id: "test-2", value: "test 2" }
];

projects.add("Select", () => {
  const [selected, setSelected] = useState("");
  const handleChange = (event) => setSelected(event.target.value);

  return (
    <SetupProviders>
      <Components.StyledSelect
        label="Test label"
        placeholder="Test placeholder"
        value={selected}
        onChange={handleChange}
      >
        {items.map((item, index) => (
          <MenuItem key={item.id} value={index}>
            {item.value}
          </MenuItem>
        ))}
      </Components.StyledSelect>
    </SetupProviders>
  );
});
