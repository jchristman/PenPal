import React from "react";
import { registerComponent } from "@penpal/core";

interface ListProps {
  items: any[];
  maxItems?: number;
  expandable?: boolean;
  format?: string;
}

const List: React.FC<ListProps> = ({
  items,
  maxItems = 5,
  expandable = false,
  format = "list",
}) => {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  if (format === "comma-separated") {
    const text = items.join(", ");
    return <p className="text-sm text-muted-foreground">{text}</p>;
  }

  const displayedItems =
    expandable && items.length > maxItems ? items.slice(0, maxItems) : items;
  const remainingCount = items.length - displayedItems.length;

  return (
    <div>
      {displayedItems.map((item, index) => (
        <p key={index} className="text-sm text-muted-foreground">
          - {String(item)}
        </p>
      ))}
      {expandable && remainingCount > 0 && (
        <p className="text-xs text-muted-foreground">
          ...+{remainingCount} more
        </p>
      )}
    </div>
  );
};

registerComponent("UIDirectiveList", List);

export default List;
