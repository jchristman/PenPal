import React, { useState } from "react";
import { Components, registerComponent } from "@penpal/core";
import { makeStyles } from "@mui/styles";
import Paper from "@mui/material/Paper";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

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
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
}));

const ProjectViewNetworks = ({ project }) => {
  const classes = useStyles();
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const tabs = [
    {
      title: "List",
      content: () => "List",
    },
    {
      title: "Hosts",
      content: () => "Hosts",
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
            <Content project={project} />
          </TabPanel>
        ))}
      </div>
    </Paper>
  );
};

registerComponent("ProjectViewNetworks", ProjectViewNetworks);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewNetworks;
