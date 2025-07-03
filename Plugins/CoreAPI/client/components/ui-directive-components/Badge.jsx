import React from "react";
import { Components, registerComponent } from "@penpal/core";

const { Badge: Component } = Components;

const Badge = ({
  label,
  color = "default",
  size = "small",
  variant = "filled",
  icon,
  items,
  maxItems = 5,
  expandable = false,
}) => {
  if (Array.isArray(items)) {
    const displayedItems = expandable ? items.slice(0, maxItems) : items;
    const remainingCount = items.length - displayedItems.length;

    return (
      <>
        {displayedItems.map((item, index) => (
          <Component
            key={index}
            label={item}
            color={color}
            size={size}
            variant={variant}
            icon={icon}
          />
        ))}
        {expandable && remainingCount > 0 && (
          <Component
            label={`+${remainingCount} more`}
            size={size}
            variant="outlined"
          />
        )}
      </>
    );
  }

  return (
    <Component
      label={label}
      color={color}
      size={size}
      variant={variant}
      icon={icon}
    />
  );
};

registerComponent("UIDirectiveBadge", Badge);

export default Badge;
