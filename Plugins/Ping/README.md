# Ping Plugin

## Purpose

The Ping plugin performs fast ICMP ping sweeps for host discovery in networks using fping in a Docker container. It subscribes to new network events, queues scans, and upserts discovered hosts to CoreAPI.

## Dependencies

- CoreAPI@0.1.0
- Docker@0.1.0
- JobsTracker@0.1.0
- MQTT@0.1.0
- ScanQueue@0.1.0

## Usage

This plugin automatically triggers on new networks added to projects.
