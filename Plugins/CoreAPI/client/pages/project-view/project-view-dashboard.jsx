import React, { useState, useEffect } from "react";
import { Components, registerComponent } from "@penpal/core";
import { makeStyles } from "@mui/styles";
import Grid from "@mui/material/Grid";
import DesktopWindowsIcon from "@mui/icons-material/DesktopWindows";

const useStyles = makeStyles((theme) => ({}));

const ProjectViewDashboard = ({ project }) => {
  const classes = useStyles();

  return (
    <Grid container spacing={3}>
      <Grid item xl={4} lg={4} sm={6} xs={12}>
        <Components.DashboardTrendingStatistic
          title="Independent Hosts"
          value={project.scope.hostsConnection.totalCount}
          delta={0}
          icon={<DesktopWindowsIcon />}
          caption={``}
        />
      </Grid>
      <Grid item xl={4} lg={4} sm={6} xs={12}>
        <Components.DashboardTrendingStatistic
          title="Independent Host Services"
          value={project.scope.hostsConnection.servicesConnection.totalCount}
          delta={0}
          icon={<DesktopWindowsIcon />}
          caption={``}
        />
      </Grid>
      <Grid item xl={4} lg={4} sm={6} xs={12}>
        <Components.DashboardTrendingStatistic
          title="Networks"
          value={project.scope.networksConnection.totalCount}
          delta={0}
          icon={<DesktopWindowsIcon />}
          caption={``}
        />
      </Grid>
      <Grid item xl={4} lg={4} sm={6} xs={12}>
        <Components.DashboardTrendingStatistic
          title="Network Hosts"
          value={project.scope.networksConnection.hostsConnection.totalCount}
          delta={0}
          icon={<DesktopWindowsIcon />}
          caption={``}
        />
      </Grid>
      <Grid item xl={4} lg={4} sm={6} xs={12}>
        <Components.DashboardTrendingStatistic
          title="Network Host Services"
          value={
            project.scope.networksConnection.hostsConnection.servicesConnection
              .totalCount
          }
          delta={0}
          icon={<DesktopWindowsIcon />}
          caption={``}
        />
      </Grid>
    </Grid>
  );
};

registerComponent("ProjectViewDashboard", ProjectViewDashboard);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewDashboard;
