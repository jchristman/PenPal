# Nmap Plugin

This plugin integrates Nmap scans into PenPal and supports runtime configuration through the Base configuration UI.

## Features

- Fast and detailed scan profiles
- Dockerized execution and progress tracking
- Results parsed and upserted into Core API

## Configuration

The plugin exposes configuration to the Base UI using GraphQL and metadata. Navigate to `Configure → Nmap` to edit settings.

### Sections

- General
  - `STATUS_SLEEP` – polling interval for container progress in milliseconds.
- Fast Scan
  - `use_top_ports` – when true, use `top_ports` value; when false, use manual ports.
  - `top_ports` – number of top ports to scan.
  - `tcp_ports`, `udp_ports` – comma-separated lists (e.g., `1-65535`, `53,111,135`).
  - `fast_scan` – enable fast scan tuning flags.
- Detailed Scan
  - Same `use_top_ports` toggle and fields as Fast Scan (without `fast_scan`).

### UI Metadata

Server returns `_ui` metadata along with configuration so the Base UI renders sections and conditional fields generically:

```json
{
  "_ui": {
    "sections": [
      { "path": "ui", "label": "General" },
      { "path": "scan.fast", "label": "Fast Scan" },
      { "path": "scan.detailed", "label": "Detailed Scan" }
    ],
    "conditional": [
      {
        "path": "scan.fast",
        "controller": "use_top_ports",
        "showWhenTrue": ["top_ports"],
        "showWhenFalse": ["tcp_ports", "udp_ports"]
      },
      {
        "path": "scan.detailed",
        "controller": "use_top_ports",
        "showWhenTrue": ["top_ports"],
        "showWhenFalse": ["tcp_ports", "udp_ports"]
      }
    ]
  }
}
```

### Persistence & Runtime Behavior

- Configuration is stored via DataStore (`Plugins/Nmap/Configuration` collection).
- On startup, the plugin reads saved configuration and updates internal `settings`.
- On save, the resolver updates DataStore and also updates in-memory `settings` so future scans use the new values without restarting.
- Network-triggered fast scans fetch the latest saved settings immediately before launching, ensuring they reflect current values.

### Notes

- Avoid using `__ui` in GraphQL schema; GraphQL reserves names beginning with `__`. Use `_ui`.
- Input types accept comma-separated strings for `tcp_ports`/`udp_ports`; the server normalizes them.
