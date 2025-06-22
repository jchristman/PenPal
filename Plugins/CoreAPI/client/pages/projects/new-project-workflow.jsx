import React, { useState, useEffect } from "react";
import { Components, registerComponent } from "@penpal/core";
import { makeStyles, useTheme } from "@mui/styles";
import MobileStepper from "@mui/material/MobileStepper";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";

import { useQuery } from "@apollo/client";
import GetCustomersQuery from "../customers/queries/get-customers.js";

const useStyles = makeStyles({
  dialog: {
    height: "100%",
  },
  dialog_paper: {
    height: "70%",
    maxHeight: 600,
  },
  stepper: {
    backgroundColor: "transparent",
    flexGrow: 1,
  },
});

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
      name: "Collaborators",
      component: ({ enableNext }) => {
        useEffect(() => enableNext(), []);
        return "Coming soon!";
      },
    },
    {
      name: "Review",
      component: Components.NewProjectWorkflowReview,
    },
  ];

  const classes = useStyles();
  const theme = useTheme();
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
    handleCloseProp();

    setTimeout(() => {
      setActiveStep(0);
      setNextEnabled(false);
      setSelectedCustomer("");
      setProjectName("");
      setProjectDescription("");
      setProjectIPs([]);
      setProjectNetworks([]);
      setProjectStartDate(null);
      setProjectEndDate(null);
    }, 50);
  };

  // -------------------------------------------------------------

  const loading = customersLoading;
  const ActiveStep = steps[activeStep].component;

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      open={open}
      onClose={handleClose}
      className={classes.dialog}
      classes={{ paper: classes.dialog_paper }}
    >
      <DialogTitle>{steps[activeStep].name}</DialogTitle>
      <Divider />
      <DialogContent>
        {loading ? (
          "Loading details..."
        ) : (
          <ActiveStep
            enableNext={enableNextStep}
            disableNext={disableNextStep}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            customers={currentCustomers}
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
        )}
      </DialogContent>
      <Divider />
      <DialogActions>
        <MobileStepper
          variant="dots"
          steps={steps.length}
          position="static"
          activeStep={activeStep}
          className={classes.stepper}
          nextButton={
            <Button
              size="small"
              onClick={handleNext}
              disabled={activeStep === steps.length - 1 || !nextEnabled}
            >
              Next
              {theme.direction === "rtl" ? (
                <KeyboardArrowLeft />
              ) : (
                <KeyboardArrowRight />
              )}
            </Button>
          }
          backButton={
            <Button
              size="small"
              onClick={handleBack}
              disabled={activeStep === 0}
            >
              {theme.direction === "rtl" ? (
                <KeyboardArrowRight />
              ) : (
                <KeyboardArrowLeft />
              )}
              Back
            </Button>
          }
        />
      </DialogActions>
    </Dialog>
  );
};

registerComponent("NewProjectWorkflow", NewProjectWorkflow);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default NewProjectWorkflow;
