#!/bin/bash

# Directory to store the CSV logs
LOG_DIR="docker_stats_logs"
# Interval in seconds to capture stats
SLEEP_INTERVAL=10

# Create the log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# AWK script to parse the output from `docker stats`.
# It handles the multi-unit fields (like "MiB / GiB") and prints a clean, comma-separated line.
PARSER_AWK_SCRIPT='
{
    # This block runs for every line of input except the header (NR>1)
    if (NR > 1) {
        name = $2;
        cpu = $3;
        mem_usage = $4;
        mem_limit = $6; # Skip the "/" at $5
        mem_perc = $7;
        net_i = $8;
        net_o = $10; # Skip the "/" at $9
        block_i = $11;
        block_o = $13; # Skip the "/" at $12
        pids = $14;

        # Print the parsed data as a single, comma-separated string
        printf "%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n", name, cpu, mem_usage, mem_limit, mem_perc, net_i, net_o, block_i, block_o, pids;
    }
}
'

echo "Starting Docker stats monitoring. Press [CTRL+C] to stop."
echo "CSV files will be saved in the ./$LOG_DIR directory every $SLEEP_INTERVAL seconds."

# Main loop to periodically capture and log stats
while true; do
    # Get the current timestamp in ISO 8601 format (UTC)
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Execute docker stats, parse it with our AWK script, and process each line
    docker stats --no-stream | awk "$PARSER_AWK_SCRIPT" | while IFS=',' read -r name cpu_p mem_u mem_l mem_p net_i net_o blk_i blk_o pids; do

        # Sanitize the container name to create a valid filename
        FILENAME=$(echo "$name" | sed 's/[^a-zA-Z0-9._-]/_/g').csv
        FILE_PATH="$LOG_DIR/$FILENAME"

        # If the CSV file doesn't exist, create it and add the header row
        if [ ! -f "$FILE_PATH" ]; then
            echo "Timestamp,CPU_%,Mem_Usage,Mem_Limit,Mem_%,Net_Input,Net_Output,Block_Input,Block_Output,PIDs" > "$FILE_PATH"
        fi

        # Append the timestamp and the parsed stats as a new row to the appropriate CSV file
        echo "$TIMESTAMP,$cpu_p,$mem_u,$mem_l,$mem_p,$net_i,$net_o,$blk_i,$blk_o,$pids" >> "$FILE_PATH"
    done

    # Wait for the specified interval before the next capture
    sleep "$SLEEP_INTERVAL"
done
