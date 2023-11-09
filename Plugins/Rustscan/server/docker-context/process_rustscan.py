#!/usr/bin/env python
# tags = ["json"]
# call_format = "python3 {{script}} {{ip}} {{port}}"

import sys
import os
import json
import ipaddress

ip, ports = sys.argv[1:3]
network_address = ipaddress.ip_network(
    f"{ip}/24", strict=False).network_address

outfile = f"rustscan_results_{network_address}.json"
print(f"Outfile {outfile}")

all_data = {}
if os.path.exists(outfile):
    with open(outfile, "r") as f:
        all_data = json.load(f)

all_data[ip] = ports.split(',')

with open(outfile, "w") as f:
    json.dump(all_data, f, indent=4)
    print(f"Result {network_address}:\n", json.dumps(all_data, indent=4))
