import React, { useState } from "react";
import { Components, registerComponent } from "@penpal/core";
import { makeStyles } from "@mui/styles";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";

const useStyles = makeStyles((theme) => ({
  card: {
    minWidth: `calc(50% - ${theme.spacing(2)})`,
    border: `1px solid ${theme.palette.divider}`,
  },
}));

const ProjectViewHostsList = ({ hosts }) => {
  const classes = useStyles();
  console.log(hosts);
  return (
    <Stack spacing={2} direction="row" useFlexGap flexWrap="wrap">
      {hosts.map((host) => (
        <Card key={host.id} className={classes.card}>
          <CardHeader title={host.ip_address} />
          <CardContent>
            <div>
              Hostnames:{" "}
              {host.hostnames?.join(", ") ?? "No hostnames available"}
            </div>
            <div>Services Count: {host.servicesConnection.totalCount}</div>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

registerComponent("ProjectViewHostsList", ProjectViewHostsList);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewHostsList;
