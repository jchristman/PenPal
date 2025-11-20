import { registerComponent } from "../../penpal/client.ts";
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "./utils";
import dayPickerClassNames from "react-day-picker/style.module.css";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        ...dayPickerClassNames,
        ...classNames,
      }}
      components={{}}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

registerComponent("Calendar", Calendar);

export { Calendar };

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default Calendar;
