import React from "react";
import { Components, registerComponent } from "@penpal/core";
import _ from "lodash";
import moment from "moment";

interface DashboardTrendingStatisticProps {
  title: string;
  value: number;
  delta: number;
  since: string;
}

const DashboardTrendingStatistic: React.FC<DashboardTrendingStatisticProps> = ({ title, value, delta, since }) => (
  <div className="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-4">
    <Components.DashboardTrendingStatistic
      title={title}
      value={value}
      delta={delta}
      caption={`since ${moment(since).from(moment())}`}
    />
  </div>
);

interface DashboardComponentsProps {
  data: any;
}

const DashboardComponents: React.FC<DashboardComponentsProps> = ({ data }) => {
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
