import React, { useState, useEffect } from "react";
import { Components, registerComponent } from "meteor/penpal";

import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Backdrop from "@material-ui/core/Backdrop";
import Container from "@material-ui/core/Container";
import SpeedDial from "@material-ui/lab/SpeedDial";
import SpeedDialIcon from "@material-ui/lab/SpeedDialIcon";
import SpeedDialAction from "@material-ui/lab/SpeedDialAction";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import Divider from "@material-ui/core/Divider";
import Paper from "@material-ui/core/Paper";
import EditIcon from "@material-ui/icons/Edit";
import CloseIcon from "@material-ui/icons/Close";
import AddIcon from "@material-ui/icons/Add";
import BuildIcon from "@material-ui/icons/Build";
import ClearIcon from "@material-ui/icons/Clear";

import {
  Icon as CardViewIcon,
  Name as CardViewName
} from "./views-card-view.js";
import {
  Icon as TableViewIcon,
  Name as TableViewName
} from "./views-table-view.js";
import {
  Icon as TimelineViewIcon,
  Name as TimelineViewName
} from "./views-timeline-view.js";

const useStyles = makeStyles((theme) => ({
  root: {
    height: "100%",
    width: "100%",
    flexGrow: 1,
    zIndex: 1
  },
  speedDial: {
    position: "absolute",
    bottom: theme.spacing(2),
    right: theme.spacing(2),
    zIndex: 2
  },
  action_tooltip: {
    width: "max-content"
  },
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column"
  },
  toolbar: {
    flexShrink: 0,
    width: "100%",
    marginBottom: theme.spacing(2)
  },
  paper: {
    width: "auto",
    float: "right",
    display: "flex",
    border: `1px solid ${theme.palette.divider}`,
    flexWrap: "wrap",
    padding: theme.spacing(0.5)
  },
  projects_container: {
    flex: 1,
    width: "100%"
  },
  divider: {
    margin: theme.spacing(1)
  },
  grouped: {
    margin: theme.spacing(0.5),
    border: "none",
    "&:not(:first-child)": {
      borderRadius: theme.shape.borderRadius
    },
    "&:first-child": {
      borderRadius: theme.shape.borderRadius
    }
  }
}));

const _actions = [
  { icon: TableViewIcon, name: TableViewName },
  { icon: TimelineViewIcon, name: TimelineViewName },
  { icon: CardViewIcon, name: CardViewName }
];

const Projects = () => {
  const classes = useStyles();
  const [fabVisible, setFabVisible] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState(_actions[0].name);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleNewProjectOpen = () => setNewProjectOpen(true);
  const handleNewProjectClose = () => setNewProjectOpen(false);

  const actions = fabVisible
    ? [
        {
          icon: <BuildIcon />,
          name: "Show Toolbar",
          onClick: () => {
            handleClose();
            setFabVisible(false);
          }
        },
        ..._actions.map((action) => ({
          ...action,
          onClick: () => setView(action.name)
        })),
        {
          icon: <AddIcon />,
          name: "New Project",
          onClick: () => {
            handleClose();
            setTimeout(handleNewProjectOpen, 200);
          }
        }
      ]
    : [
        {
          group: [
            {
              icon: <AddIcon />,
              onClick: (event) => {
                event.preventDefault();
                handleNewProjectOpen();
              }
            }
          ],
          exclusive: false
        },
        {
          group: _actions,
          exclusive: true
        },
        {
          group: [
            {
              name: view, // A hack to make this always a "depressed" value
              icon: <BuildIcon />,
              onClick: (event) => {
                event.preventDefault();
                setFabVisible(true);
              }
            }
          ],
          exclusive: false
        }
      ];

  return (
    <div className={classes.root}>
      <Container maxWidth="lg" className={classes.container} disableGutters>
        {!fabVisible && (
          <div className={classes.toolbar}>
            <Paper className={classes.paper}>
              {actions.map(({ group, exclusive }, index) => (
                <React.Fragment key={index}>
                  <ToggleButtonGroup
                    classes={{ grouped: classes.grouped }}
                    size="small"
                    value={view}
                    exclusive={exclusive}
                    onChange={(event, newView) =>
                      newView !== null && setView(newView)
                    }
                  >
                    {group.map((item, index) => (
                      <ToggleButton
                        key={index}
                        value={item.name ?? ""}
                        onClick={item.onClick}
                      >
                        {item.icon}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                  {index !== actions.length - 1 && (
                    <Divider
                      flexItem
                      orientation="vertical"
                      className={classes.divider}
                    />
                  )}
                </React.Fragment>
              ))}
            </Paper>
          </div>
        )}
        <div className={classes.projects_container}>
          <Components.ProjectsView view={view} />
        </div>
        <Components.NewProjectWorkflow
          open={newProjectOpen}
          handleClose={handleNewProjectClose}
        />
      </Container>
      {fabVisible && (
        <>
          <Backdrop open={open} />
          <SpeedDial
            ariaLabel=""
            hidden={!fabVisible}
            className={classes.speedDial}
            icon={
              <SpeedDialIcon icon={<EditIcon />} openIcon={<CloseIcon />} />
            }
            onClose={handleClose}
            onOpen={(event, reason) => {
              if (reason === "focus") return;
              handleOpen();
            }}
            open={open}
          >
            {actions.reverse().map((action) => (
              <SpeedDialAction
                key={action.name}
                FabProps={{ disabled: action.name === view }}
                icon={action.icon}
                classes={{ staticTooltipLabel: classes.action_tooltip }}
                tooltipTitle={action.name}
                tooltipOpen
                onClick={action.onClick}
              />
            ))}
          </SpeedDial>
        </>
      )}
    </div>
  );
};

registerComponent("Projects", Projects);
