import React, { useState, useEffect } from "react";
import { Components, registerComponent } from "meteor/penpal";
import _ from "lodash";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import { indigo } from "@material-ui/core/colors";
import Select from "@material-ui/core/Select";
import Divider from "@material-ui/core/Divider";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import cx from "classnames";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center"
  },
  pane: {
    height: `calc(100% - ${theme.spacing(4)}px)`,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    margin: theme.spacing(2)
  },
  pane_title: {
    color: "#555",
    fontSize: 17,
    textTransform: "uppercase",
    width: "100%",
    textAlign: "center",
    marginBottom: theme.spacing(1)
  },
  pane_rest: {
    flex: 1,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start"
  },
  divider: {}
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
  setProjectNetworks
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
