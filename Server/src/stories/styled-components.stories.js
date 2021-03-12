import React, { useState } from "react";

import { Components } from "meteor/penpal";
import { SetupProviders } from "stories/common.js";

// ------------------------------------------------------

export const Button = () => (
  <SetupProviders>
    <Components.StyledButton
      variant="contained"
      color="primary"
      onClick={() => null}
    >
      Test Button
    </Components.StyledButton>
  </SetupProviders>
);

// ------------------------------------------------------

export const TextField = () => (
  <SetupProviders>
    <Components.StyledTextField
      label={"Primary field"}
      placeholder={"Placeholder"}
      helperText={"Helper Text"}
      margin={"normal"}
    />
  </SetupProviders>
);

// ------------------------------------------------------

export const DateField = () => (
  <SetupProviders>
    <Components.StyledDateField label={"This is a date picker"} />
  </SetupProviders>
);

// ------------------------------------------------------

import MenuItem from "@material-ui/core/MenuItem";
const items = [
  { id: "test-1", value: "test 1" },
  { id: "test-2", value: "test 2" }
];

export const Select = () => {
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
};

export default {
  title: "UI/Styled Components"
};
