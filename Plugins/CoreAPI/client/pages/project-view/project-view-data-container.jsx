import React, { useState } from "react";
import { Components, registerComponent } from "@penpal/core";
import { makeStyles } from "@mui/styles";
import Paper from "@mui/material/Paper";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

const useStyles = makeStyles((theme) => ({
  root: {
    flex: 1,
    width: "100%",
    background: "transparent",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
  },
  tab_bar: {
    paddingLeft: 4,
    paddingRight: 4,
  },
  tab_panel: {
    marginTop: theme.spacing(2),
    flex: 1,
    overflowY: "auto",
  },
  tab_container: {
    flex: 1,
    display: "flex",
    overflowY: "auto",
  },
}));

export const TabPanel = (props) => {
  const classes = useStyles();
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
      className={classes.tab_panel}
    >
      {value === index ? children : null}
    </div>
  );
};

const ProjectViewDataContainer = ({ project }) => {
  const classes = useStyles();
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const tabs = [
    {
      title: "Dashboard",
      content: Components.ProjectViewDashboard,
    },
    {
      title: "Hosts",
      content: Components.ProjectViewHosts,
    },
    {
      title: "Networks",
      content: Components.ProjectViewNetworks,
    },
  ];

  return (
    <div className={classes.root}>
      <Paper className={classes.tab_bar}>
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map(({ title }, i) => (
            <Tab key={i} label={title} />
          ))}
        </Tabs>
      </Paper>
      <div className={classes.tab_container}>
        {tabs.map(({ content: Content }, i) => (
          <TabPanel value={value} index={i} key={i}>
            <Content project={project} />
          </TabPanel>
        ))}
      </div>
    </div>
  );
};

registerComponent("ProjectViewDataContainer", ProjectViewDataContainer);
