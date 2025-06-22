import React, { useState, useEffect } from "react";
import { Components, registerComponent } from "@penpal/core";
import _ from "lodash";
import { makeStyles, useTheme } from "@mui/styles";
import { indigo } from "@mui/material/colors";
import Select from "@mui/material/Select";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import cx from "classnames";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  pane: {
    height: `calc(100% - ${theme.spacing(4)}px)`,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    margin: theme.spacing(2),
  },
  pane_title: {
    color: "#555",
    fontSize: 17,
    textTransform: "uppercase",
    width: "100%",
    textAlign: "center",
    marginBottom: theme.spacing(1),
  },
  pane_rest: {
    flex: 1,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  divider: {},
}));

const ProjectDetails = ({
  enableNext = () => null,
  disableNext = () => null,
  projectName,
  setProjectName,
  projectDescription,
  setProjectDescription,
  projectStartDate,
  setProjectStartDate,
  projectEndDate,
  setProjectEndDate,
  projectIPs,
  setProjectIPs,
  projectNetworks,
  setProjectNetworks,
}) => {
  // ----------------------------------------------------

  const classes = useStyles();

  useEffect(() => {
    if (projectName.length !== 0 && projectDescription.length !== 0) {
      enableNext();
    } else {
      disableNext();
    }
  }, [projectName, projectDescription]);

  // ----------------------------------------------------

  return (
    <div className={classes.root}>
      <div className={classes.pane}>
        <div className={classes.pane_title}>Details</div>
        <div className={classes.pane_rest}>
          <Components.ProjectDetailsForm
            projectName={projectName}
            setProjectName={setProjectName}
            projectDescription={projectDescription}
            setProjectDescription={setProjectDescription}
            projectStartDate={projectStartDate}
            setProjectStartDate={setProjectStartDate}
            projectEndDate={projectEndDate}
            setProjectEndDate={setProjectEndDate}
          />
        </div>
      </div>
      <Divider flexItem orientation="vertical" className={classes.divider} />
      <div className={classes.pane}>
        <div className={classes.pane_title}>Scope</div>
        <div className={classes.pane_rest}>
          <Components.ProjectScopeForm
            projectIPs={projectIPs}
            setProjectIPs={setProjectIPs}
            projectNetworks={projectNetworks}
            setProjectNetworks={setProjectNetworks}
          />
        </div>
      </div>
    </div>
  );
};

registerComponent("NewProjectWorkflowProjectDetails", ProjectDetails);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectDetails;
