import { registerComponent } from "../../penpal/client";
import * as React from "react";
import { ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";

import { cn } from "./utils";
import { Button } from "./button";

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("caption-bottom text-sm", className)}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    isSortable?: boolean;
    sortDirection?: "asc" | "desc" | null;
    onSort?: () => void;
    align?: "left" | "center" | "right";
  }
>(
  (
    { className, children, isSortable, sortDirection, onSort, align, ...props },
    ref
  ) => {
    const icon =
      sortDirection === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : sortDirection === "desc" ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : isSortable ? (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      ) : null;

    const alignmentClass =
      align === "center"
        ? "justify-center"
        : align === "right"
        ? "justify-end"
        : "justify-start";

    return (
      <th
        ref={ref}
        className={cn(
          "h-12 px-4 align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
          align === "center"
            ? "text-center"
            : align === "right"
            ? "text-right"
            : "text-left",
          className
        )}
        {...props}
      >
        {isSortable ? (
          <div className={cn("flex w-full items-center", alignmentClass)}>
            <Button
              variant="ghost"
              onClick={onSort}
              className={cn("h-8 p-0 data-[state=open]:bg-accent")}
            >
              {children}
              {icon}
            </Button>
          </div>
        ) : (
          <div className={cn("flex items-center", alignmentClass)}>
            {children}
            {icon}
          </div>
        )}
      </th>
    );
  }
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

registerComponent("Table", Table);
registerComponent("TableHeader", TableHeader);
registerComponent("TableBody", TableBody);
registerComponent("TableFooter", TableFooter);
registerComponent("TableHead", TableHead);
registerComponent("TableRow", TableRow);
registerComponent("TableCell", TableCell);
registerComponent("TableCaption", TableCaption);

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default Table;
