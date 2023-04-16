import React from "react";

import { Components } from "@penpal/core";
import { SetupProviders } from "stories/common.js";

import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import DesktopWindowsIcon from "@mui/icons-material/DesktopWindows";
import AccountTreeIcon from "@mui/icons-material/AccountTree";

export const TrendingStatistic = () => (
  <SetupProviders>
    <Container>
      <Grid container spacing={3}>
        <Grid item lg={4} sm={6} xl={4} xs={12}>
          <Components.DashboardTrendingStatistic
            title="Total Projects"
            value={9001}
            delta={36}
            icon={<AccountTreeIcon />}
            caption={`since 2 seconds ago`}
          />
        </Grid>
        <Grid item lg={4} sm={6} xl={4} xs={12}>
          <Components.DashboardTrendingStatistic
            title="Total Hosts"
            value={200}
            delta={-72}
            icon={<DesktopWindowsIcon />}
            caption={`since last year`}
          />
        </Grid>
      </Grid>
    </Container>
  </SetupProviders>
);

export default {
  title: "PenPal/Base/Dashboard",
};
