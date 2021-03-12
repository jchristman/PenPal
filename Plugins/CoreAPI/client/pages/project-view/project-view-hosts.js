import React, { useState } from "react";
import { Components, registerComponent } from "meteor/penpal";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";

import { TabPanel } from "./project-view-data-container.js";

const useStyles = makeStyles((theme) => ({
  container: {
    flexGrow: 1,
    display: "flex",
    height: "100%"
  },
  tabs: {
    borderRight: `1px solid ${theme.palette.divider}`
  },
  tab_panel_container: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2)
  }
}));

const ProjectViewHosts = ({ project }) => {
  const classes = useStyles();
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const tabs = [
    {
      title: "List",
      content: () => "List"
    },
    {
      title: "Services",
      content: () => "Services"
    },
    {
      title: "Graph",
      content: () => "Graph"
    }
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

registerComponent("ProjectViewHosts", ProjectViewHosts);
