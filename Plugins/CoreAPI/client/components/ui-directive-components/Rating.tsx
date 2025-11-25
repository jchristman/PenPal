import React from "react";
import { Components, registerComponent } from "@penpal/core";
import { StarIcon } from "@heroicons/react/24/solid";

const clamp = (val: any, min: any, max: any) =>
  Math.max(min, Math.min(max, val));

interface RatingProps {
  value?: number;
  max?: number;
  style?: string;
  className?: string;
  [key: string]: any;
}

const Rating: React.FC<RatingProps> = ({
  value = 0,
  max = 5,
  style = "stars",
  className = "",
  ...props
}) => {
  if (value == null) return null;
  const safeMax = max > 0 ? max : 5;
  const safeValue = clamp(Number(value), 0, safeMax);

  if (style === "stars") {
    const stars = [];
    for (let i = 1; i <= safeMax; i++) {
      stars.push(
        <StarIcon
          key={i}
          className={`h-5 w-5 ${
            i <= safeValue ? "text-yellow-400" : "text-gray-300"
          }`}
          aria-hidden="true"
        />
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-0.5 ${className}`}
        {...props}
      >
        {stars}
        <span className="ml-1 text-xs text-muted-foreground">
          {safeValue}/{safeMax}
        </span>
      </span>
    );
  }

  // Numeric style fallback
  return (
    <span className={`inline-flex items-center ${className}`} {...props}>
      <span className="font-semibold text-sm">{safeValue}</span>
      <span className="ml-1 text-xs text-muted-foreground">/ {safeMax}</span>
    </span>
  );
};

registerComponent("UIDirectiveRating", Rating);

export default Rating;
