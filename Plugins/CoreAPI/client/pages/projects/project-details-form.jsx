import React, { useState } from "react";
import { Components, registerComponent } from "@penpal/core";
import { makeStyles, useTheme } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    height: "100%",
    width: "100%",
  },
  form_field: {
    width: 300,
    marginBottom: theme.spacing(2),
  },
  submit_container: {
    marginTop: theme.spacing(4),
  },
  submit: {
    width: 300,
  },
}));

const ProjectDetailsForm = ({
  projectName,
  setProjectName,
  projectDescription,
  setProjectDescription,
  projectStartDate,
  setProjectStartDate,
  projectEndDate,
  setProjectEndDate,
}) => {
  // ----------------------------------------------------

  const classes = useStyles();

  // ----------------------------------------------------

  const handleProjectNameChange = (event) => setProjectName(event.target.value);
  const handleProjectDescriptionChange = (event) =>
    setProjectDescription(event.target.value);

  return (
    <div className={classes.root}>
      <Components.StyledTextField
        required
        label="Name"
        value={projectName}
        onChange={handleProjectNameChange}
        className={classes.form_field}
      />
      <Components.StyledTextField
        required
        value={projectDescription}
        onChange={handleProjectDescriptionChange}
        label="Description"
        className={classes.form_field}
      />
      <Components.StyledDateField
        value={projectStartDate}
        onChange={setProjectStartDate}
        label="Start Date"
        className={classes.form_field}
      />
      <Components.StyledDateField
        disabled={projectStartDate === null}
        shouldDisableDate={(date) => date.isBefore(projectStartDate, "day")}
        value={projectEndDate}
        onChange={setProjectEndDate}
        label="End Date"
        className={classes.form_field}
      />
    </div>
  );
};

registerComponent("ProjectDetailsForm", ProjectDetailsForm);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectDetailsForm;
