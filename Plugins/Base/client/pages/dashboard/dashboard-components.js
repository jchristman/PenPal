import React from "react";
import { Components, registerComponent } from "meteor/penpal";
import _ from "lodash";
import Grid from "@material-ui/core/Grid";
import moment from "moment";

const DashboardTrendingStatistic = ({ title, value, delta, since }) => (
  <Grid item lg={4} sm={6} xl={4} xs={12}>
    <Components.DashboardTrendingStatistic
      title={title}
      value={value}
      delta={delta}
      caption={`since ${moment(since).from(moment())}`}
    />
  </Grid>
);

const DashboardComponents = ({ data }) => {
  return (
    <Grid container spacing={2}>
      {_.map(data, (field, key) =>
        field.__typename === "DashboardableStatisticsTrendingInt" ? (
          <DashboardTrendingStatistic key={key} {...field} />
        ) : null
      )}
    </Grid>
  );
};

registerComponent("DashboardComponents", DashboardComponents);
