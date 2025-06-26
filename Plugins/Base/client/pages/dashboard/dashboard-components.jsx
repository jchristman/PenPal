import React from "react";
import { Components, registerComponent } from "@penpal/core";
import _ from "lodash";
import moment from "moment";

const DashboardTrendingStatistic = ({ title, value, delta, since }) => (
  <div className="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-4">
    <Components.DashboardTrendingStatistic
      title={title}
      value={value}
      delta={delta}
      caption={`since ${moment(since).from(moment())}`}
    />
  </div>
);

const DashboardComponents = ({ data }) => {
  return (
    <div className="grid grid-cols-12 gap-4">
      {_.map(data, (field, key) =>
        field.__typename === "DashboardableStatisticsTrendingInt" ? (
          <DashboardTrendingStatistic key={key} {...field} />
        ) : null
      )}
    </div>
  );
};

registerComponent("DashboardComponents", DashboardComponents);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default DashboardComponents;
