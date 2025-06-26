import React, { useState, useEffect } from "react";
import { Components, registerComponent, Hooks } from "@penpal/core";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

import { useQuery } from "@apollo/client";
import GetCustomersQuery from "../customers/queries/get-customers.js";

const { Dialog, DialogContent, DialogHeader, DialogTitle, Button, Separator } =
  Components;

const NewProjectWorkflow = ({ open, handleClose: handleCloseProp }) => {
  // -------------------------------------------------------------
  const steps = [
    {
      name: "Customer",
      component: Components.NewProjectWorkflowSelectCustomer,
    },
    {
      name: "Project",
      component: Components.NewProjectWorkflowProjectDetails,
    },
    {
      name: "Review",
      component: Components.NewProjectWorkflowReview,
    },
  ];

  const [activeStep, setActiveStep] = useState(0);
  const [nextEnabled, setNextEnabled] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectIPs, setProjectIPs] = useState([]);
  const [projectNetworks, setProjectNetworks] = useState([]);
  const [projectStartDate, setProjectStartDate] = useState(null);
  const [projectEndDate, setProjectEndDate] = useState(null);

  const {
    loading: customersLoading,
    error: customersError,
    data: { getCustomers: currentCustomers } = {},
  } = useQuery(GetCustomersQuery, {
    pollInterval: 15000,
  });

  // -------------------------------------------------------------

  const enableNextStep = () => setNextEnabled(true);
  const disableNextStep = () => setNextEnabled(false);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    disableNextStep();
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    enableNextStep();
  };

  const handleClose = () => {
    // Reset to initial state
    setActiveStep(0);
    setNextEnabled(false);
    setSelectedCustomer("");
    setProjectName("");
    setProjectDescription("");
    setProjectIPs([]);
    setProjectNetworks([]);
    setProjectStartDate(null);
    setProjectEndDate(null);

    handleCloseProp();
  };

  // -------------------------------------------------------------

  const { component: StepComponent } = steps[activeStep];

  if (customersLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[80vh] max-h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Project</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.name}>
                <div className="flex items-center">
                  <div
                    className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                    ${
                      index <= activeStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground border-2 border-muted"
                    }
                  `}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      index <= activeStep
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && <Separator className="w-12" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-auto pb-8">
          <StepComponent
            enableNext={enableNextStep}
            disableNext={disableNextStep}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            customers={currentCustomers || []}
            projectName={projectName}
            setProjectName={setProjectName}
            projectDescription={projectDescription}
            setProjectDescription={setProjectDescription}
            projectStartDate={projectStartDate}
            setProjectStartDate={setProjectStartDate}
            projectEndDate={projectEndDate}
            setProjectEndDate={setProjectEndDate}
            projectIPs={projectIPs}
            setProjectIPs={setProjectIPs}
            projectNetworks={projectNetworks}
            setProjectNetworks={setProjectNetworks}
            handleClose={handleClose}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={activeStep === 0}
            className="flex items-center"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="text-sm text-muted-foreground">
            Step {activeStep + 1} of {steps.length}
          </div>

          <Button
            onClick={handleNext}
            disabled={!nextEnabled || activeStep >= steps.length - 1}
            className="flex items-center"
          >
            Next
            <ChevronRightIcon className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

registerComponent("NewProjectWorkflow", NewProjectWorkflow);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default NewProjectWorkflow;
