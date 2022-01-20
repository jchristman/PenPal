import React from "react";
import { registerComponent, Components } from "meteor/penpal";
import _ from "lodash";

const _check = (os_name, query) => _.includes(os_name, query);

const AutoOSIcon = ({ os_name, width = 40, height = 40 }) => {
  const lower_os_name = os_name.toLowerCase().replace(" ", "");
  const check = (query) => _check(lower_os_name, query);

  switch (true) {
    case check("windows 10"):
      return <Components.Windows10Icon width={width} height={height} />;
    case check("windows"):
      return <Components.WindowsIcon width={width} height={height} />;
    case check("ubuntu"):
      return <Components.UbuntuIcon width={width} height={height} />;
    case check("debian"):
      return <Components.DebianIcon width={width} height={height} />;
    case check("centos"):
      return <Components.CentosIcon width={width} height={height} />;
    case check("fedora"):
      return <Components.FedoraIcon width={width} height={height} />;
    case check("redhat"):
      return <Components.RHELIcon width={width} height={height} />;
    case check("rhel"):
      return <Components.RHELIcon width={width} height={height} />;
    case check("linux"):
      return <Components.LinuxIcon width={width} height={height} />;
    case check("macos"):
      return <Components.AppleIcon width={width} height={height} />;
    default:
      return null;
  }
};

registerComponent("AutoOSIcon", AutoOSIcon);
