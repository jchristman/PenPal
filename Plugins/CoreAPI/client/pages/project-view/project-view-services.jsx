import React, { useState } from "react";
import { Components, registerComponent } from "@penpal/core";
import { makeStyles } from "@mui/styles";
import Paper from "@mui/material/Paper";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useSnackbar } from "notistack";

import { useQuery } from "@apollo/client";
import getServicesInformation from "./queries/get-services-information.js";

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

const ProjectViewServices = ({ project, disable_polling }) => {
  const { enqueueSnackbar } = useSnackbar();
  const classes = useStyles();
  const [value, setValue] = useState(0);

  const { data, loading, error } = useQuery(getServicesInformation, {
    pollInterval: disable_polling ? 0 : 15000,
    variables: {
      id: project.id,
    },
  });

  if (loading) {
    return "Loading services information";
  }

  if (error) {
    enqueueSnackbar(error.message, { variant: "error" });
    return null;
  }

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const services = data?.getServices ?? [];

  const tabs = [
    {
      title: "List",
      content: Components.ProjectViewServicesList,
    },
    {
      title: "Enrichments",
      content: Components.ProjectViewServicesEnrichments,
    },
    {
      title: "Graph",
      content: () => "Graph View Coming Soon",
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
            <Content project={project} services={services} />
          </TabPanel>
        ))}
      </div>
    </Paper>
  );
};

registerComponent("ProjectViewServices", ProjectViewServices);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewServices;
