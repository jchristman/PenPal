import React, { useState } from "react";
import { Components, registerComponent } from "@penpal/core";
import { makeStyles } from "@mui/styles";
import Paper from "@mui/material/Paper";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useSnackbar } from "notistack";

import { useQuery } from "@apollo/client";
import getHostsInformation from "./queries/get-hosts-information.js";

import { TabPanel } from "./project-view-data-container.jsx";

const useStyles = makeStyles((theme) => ({
  container: {
    flexGrow: 1,
    display: "flex",
    height: "100%",
  },
  tabs: {
    borderRight: `1px solid ${theme.palette.divider}`,
  },
  tab_panel_container: {
    width: "100%",
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
}));

const ProjectViewHosts = ({ project, disable_polling }) => {
  const { enqueueSnackbar } = useSnackbar();
  const classes = useStyles();
  const [value, setValue] = useState(0);

  const { data, loading, error } = useQuery(getHostsInformation, {
    pollInterval: disable_polling ? 0 : 15000,
    variables: {
      id: project.id,
    },
  });

  if (loading) {
    return "Loading host information";
  }

  if (error) {
    enqueueSnackbar(error.message, { variant: "error" });
    return null;
  }

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const hosts = data?.getHostsByProjectID ?? [];

  const tabs = [
    {
      title: "List",
      content: Components.ProjectViewHostsList,
    },
    {
      title: "Services",
      content: () => "Services",
    },
    {
      title: "Graph",
      content: () => "Graph",
    },
  ];

  return (
    <Paper className={classes.container}>
      <Tabs
        orientation="vertical"
        variant="scrollable"
        value={value}
        onChange={handleChange}
        className={classes.tabs}
      >
        {tabs.map(({ title }, i) => (
          <Tab key={i} label={title} />
        ))}
      </Tabs>
      <div className={classes.tab_panel_container}>
        {tabs.map(({ content: Content }, i) => (
          <TabPanel value={value} index={i} key={i}>
            <Content project={project} hosts={hosts} />
          </TabPanel>
        ))}
      </div>
    </Paper>
  );
};

registerComponent("ProjectViewHosts", ProjectViewHosts);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewHosts;
