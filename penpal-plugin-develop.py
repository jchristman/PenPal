#!/usr/bin/env python3

import argparse
import os
import shutil
import fileinput
import sys


def is_valid_plugin_name(name):
    return " " not in name


def create_new_plugin(plugin_name):
    # Step 1: Copy PluginTemplate to ./plugins/PLUGIN_NAME
    template_path = "./PluginTemplate"
    plugin_path = f"./plugins/{plugin_name}"

    shutil.copytree(template_path, plugin_path)

    # Step 2: Find and replace "REPLACE_ME" in all files
    for root, dirs, files in os.walk(plugin_path):
        for file_name in files:
            file_path = os.path.join(root, file_name)

            with fileinput.FileInput(file_path, inplace=True) as file:
                for line in file:
                    print(line.replace("REPLACE_ME", plugin_name), end='')


def main():
    parser = argparse.ArgumentParser(
        description="PenPal Plugin Developer Tool")

    # Create new plugin
    new_plugin_parser = parser.add_argument_group("Create new plugin")
    new_plugin_parser.add_argument(
        "--new-plugin", action="store_true", help="Create a new plugin")
    new_plugin_parser.add_argument(
        "--name", required="--new-plugin" in sys.argv, help="Name of the new plugin (no spaces)")

    args = parser.parse_args()

    if args.new_plugin:
        if not is_valid_plugin_name(args.name):
            print("Error: Plugin name cannot contain spaces.")
            sys.exit(1)

        create_new_plugin(args.name)
        print(f"New plugin '{args.name}' created successfully!")


if __name__ == "__main__":
    main()
