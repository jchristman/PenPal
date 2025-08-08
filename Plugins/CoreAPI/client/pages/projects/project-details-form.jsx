import React, { useState } from "react";
import { Components, registerComponent, Utils } from "@penpal/core";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

const { cn } = Utils;
const { Input, Label, Button, Popover, PopoverContent, PopoverTrigger } =
  Components;

const ProjectDetailsForm = ({
  projectName,
  setProjectName,
  projectDescription,
  setProjectDescription,
  projectStartDate,
  setProjectStartDate,
  projectEndDate,
  setProjectEndDate,
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const handleProjectNameChange = (event) => setProjectName(event.target.value);
  const handleProjectDescriptionChange = (event) =>
    setProjectDescription(event.target.value);

  const dateRange = {
    from: projectStartDate,
    to: projectEndDate,
  };

  const handleDateRangeSelect = (range) => {
    setProjectStartDate(range?.from);
    setProjectEndDate(range?.to);
  };

  return (
    <div className="flex flex-col justify-start items-start h-full w-full space-y-4">
      <div className="w-full">
        <Label htmlFor="project-name">Name *</Label>
        <Input
          id="project-name"
          required
          value={projectName}
          onChange={handleProjectNameChange}
          className="w-full"
        />
      </div>

      <div className="w-full">
        <Label htmlFor="project-description">Description *</Label>
        <Input
          id="project-description"
          required
          value={projectDescription}
          onChange={handleProjectDescriptionChange}
          className="w-full"
        />
      </div>

      <div className="w-full">
        <Label>Date Range</Label>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !projectStartDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {projectStartDate && projectEndDate ? (
                <>
                  {format(projectStartDate, "LLL dd, y")} -{" "}
                  {format(projectEndDate, "LLL dd, y")}
                </>
              ) : projectStartDate ? (
                format(projectStartDate, "LLL dd, y")
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 bg-white border"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Components.Calendar
              initialFocus
              mode="range"
              defaultMonth={projectStartDate}
              selected={dateRange}
              onSelect={handleDateRangeSelect}
              numberOfMonths={1}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

registerComponent("ProjectDetailsForm", ProjectDetailsForm);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectDetailsForm;
