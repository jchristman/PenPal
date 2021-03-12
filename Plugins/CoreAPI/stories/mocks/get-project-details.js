import faker from "faker";
import _ from "lodash";
import GetProjectDetailsQuery from "../../client/pages/project-view/queries/get-project-details.js";

const hosts = [
  {
    id: "test-host-1",
    ip_address: "192.168.1.1",
    mac_address: "00:11:22:33:44:55"
  }
];

const network_1_hosts = [
  {
    id: "test-host-2",
    ip_address: "192.168.2.1",
    mac_address: "11:22:33:44:55:66"
  },
  {
    id: "test-host-3",
    ip_address: "192.168.2.2",
    mac_address: "22:33:44:55:66:77"
  }
];

const networks = [
  {
    id: "test-network-1",
    subnet: "192.168.2.0/24",
    hostsConnection: {
      hosts: network_1_hosts,
      servicesConnection: {
        totalCount: 0
      },
      totalCount: network_1_hosts.length
    }
  }
];

export const project = {
  id: "1234",
  name: `${faker.commerce.product()} Pentest`,
  customer: {
    id: "test-customer-id",
    name: `${faker.company.companyName()}`
  },
  description: "A pentest for the product",
  dates: {
    created_at: faker.date.recent(),
    start: null,
    end: null
  },
  scope: {
    hostsConnection: {
      hosts: hosts,
      servicesConnection: {
        totalCount: 0
      },
      totalCount: hosts.length
    },
    networksConnection: {
      networks: networks,
      hostsConnection: {
        servicesConnection: {
          totalCount: 0
        },
        totalCount: network_1_hosts.length
      },
      totalCount: networks.length
    }
  }
};

export default [
  {
    request: {
      query: GetProjectDetailsQuery,
      variables: {
        id: "1234"
      }
    },
    result: {
      data: {
        getProject: project
      }
    }
  }
];
