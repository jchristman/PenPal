import React, { useState, useMemo } from "react";
import { Components, registerComponent } from "@penpal/core";
import { ArrowUpDown } from "lucide-react";

const {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
} = Components;

const UIDirectiveTable = ({ value, config }) => {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const columns = useMemo(() => {
    if (config?.columns) {
      return config.columns;
    }
    if (value && value.length > 0) {
      return Object.keys(value[0]);
    }
    return [];
  }, [value, config]);

  const sortedData = useMemo(() => {
    let sortableItems = [...(value || [])];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [value, sortConfig]);

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border my-2">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((key) => (
              <TableHead key={key}>
                <Button variant="ghost" onClick={() => requestSort(key)}>
                  {key
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((colKey) => (
                <TableCell key={colKey}>{String(row[colKey])}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

registerComponent("UIDirectiveTable", UIDirectiveTable);

export default UIDirectiveTable;
