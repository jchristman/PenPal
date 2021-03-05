import React, { useState, useEffect } from "react";
import {
  Components,
  registerComponent,
  Hooks,
  Routes,
  getRoute,
  Constants,
  hasRole
} from "meteor/penpal";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import Drawer from "@material-ui/core/Drawer";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";
import Badge from "@material-ui/core/Badge";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import MenuIcon from "@material-ui/icons/Menu";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import NotificationsIcon from "@material-ui/icons/Notifications";
import Backdrop from "@material-ui/core/Backdrop";
import SpeedDial from "@material-ui/lab/SpeedDial";
import SpeedDialIcon from "@material-ui/lab/SpeedDialIcon";
import SpeedDialAction from "@material-ui/lab/SpeedDialAction";
import SettingsIcon from "@material-ui/icons/Settings";
import CloseIcon from "@material-ui/icons/Close";
import SupervisorAccountIcon from "@material-ui/icons/SupervisorAccount";
import AssignmentIcon from "@material-ui/icons/Assignment";

import Clock from "react-live-clock";

import useMediaQuery from "@material-ui/core/useMediaQuery";
import { Link } from "react-router-dom";
import cx from "classnames";

import { matchPath } from "react-router";
import { Switch, Route, useLocation } from "react-router-dom";
const { useAccount } = Hooks;

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    width: "100%",
    height: "100%",
    position: "fixed",
    top: 0,
    left: 0
  },
  toolbar: {
    paddingRight: 24 // keep right padding when drawer closed
  },
  toolbarIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "0 8px",
    ...theme.mixins.toolbar
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    })
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  userContainer: {
    display: "flex",
    alignItems: "center"
  },
  logoutButton: {
    color: theme.palette.getContrastText("#3f51b5"),
    marginLeft: 15
  },
  menuButton: {
    marginRight: 36
  },
  menuButtonHidden: {
    display: "none"
  },
  title: {
    flexGrow: 1
  },
  drawerPaper: {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  drawerPaperClose: {
    overflowX: "hidden",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    width: 57,
    [theme.breakpoints.up("sm")]: {
      width: 57
    }
  },
  smDrawerPaperClose: {
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    overflowX: "hidden",
    width: 0
  },
  appBarSpacer: theme.mixins.toolbar,
  main: {
    display: "flex",
    flexDirection: "column",
    overflow: "scroll",
    maxHeight: "100%",
    transform: "translateZ(0px)",
    position: "relative"
  },
  content: {
    backgroundColor: "#EEE",
    flexGrow: 1
  },
  smContent: {
    backgroundColor: "#EEE",
    position: "fixed",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflowX: "hidden",
    padding: 0,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    })
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "black",
    opacity: 0.3,
    zIndex: 1
  },
  container: {
    flex: 1,
    padding: theme.spacing(4)
  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column"
  },
  fixedHeight: {
    height: 240
  },
  admin: {
    position: "fixed",
    top: 0,
    zIndex: 1,
    pointerEvents: "none"
  },
  adminPanel: {
    position: "relative",
    height: "100vh",
    width: "100vw"
  },
  speedDial: {
    position: "absolute",
    bottom: theme.spacing(2),
    right: theme.spacing(2)
  },
  admin_action_tooltip: {
    width: "max-content"
  },
  nav_drawer: {
    flex: 1,
    display: "flex",
    flexDirection: "column"
  },
  clock_container: {
    textAlign: "center",
    fontSize: 15
  }
}));

const Layout = ({ children }) => {
  const location = useLocation();
  let activeRoutePrettyName = "";
  const routes = Routes.map((_route) => {
    const route = _route.name === "" ? null : _route;
    if (!!matchPath(location.pathname, route?.path)) {
      activeRoutePrettyName = route.prettyName;
    }
    return route;
  });

  const classes = useStyles();
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.up("sm"));
  const isMd = useMediaQuery(theme.breakpoints.up("md"));
  const [open, setOpen] = useState(true);
  const { user, logout } = useAccount();
  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);
  const toggleDrawerOpen = () => setOpen(!open);

  useEffect(() => setOpen(isMd), [isMd]);

  const fixedHeightPaper = cx(classes.paper, classes.fixedHeight);

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar
        position="absolute"
        className={cx(classes.appBar, open && isSm && classes.appBarShift)}
      >
        <Toolbar className={classes.toolbar}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawerOpen}
            className={cx(
              classes.menuButton,
              open && isSm && classes.menuButtonHidden
            )}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            className={classes.title}
          >
            {activeRoutePrettyName}
          </Typography>
          <div className={classes.userContainer}>
            {`Hi, ${user?.emails[0]}`}
            <Button
              className={classes.logoutButton}
              color="default"
              onClick={logout}
            >
              Logout
            </Button>
          </div>
        </Toolbar>
      </AppBar>
      <Drawer
        variant={isMd ? "permanent" : "persistent"}
        classes={{
          paper: cx(
            classes.drawerPaper,
            !open &&
              (isMd ? classes.drawerPaperClose : classes.smDrawerPaperClose)
          )
        }}
        open={open}
      >
        <div className={classes.toolbarIcon}>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <Divider />
        <List className={classes.nav_drawer}>
          {routes.map((route, index) => {
            if (route === null) return <Divider key={index} />;
            const { icon: Icon } = route;
            return (
              <ListItem
                button
                component={Link}
                to={route.path}
                key={route.name}
              >
                <ListItemIcon>
                  <Icon />
                </ListItemIcon>
                <ListItemText primary={route.prettyName} />
              </ListItem>
            );
          })}
          <div style={{ flex: 1 }} />
          <div className={classes.clock_container}>
            <Clock
              timezone="Etc/UTC"
              format={!open ? "HH:mm" : "HH:mm:ssZ"}
              ticking={!open}
            />
          </div>
        </List>
      </Drawer>
      <main
        className={cx(classes.main, isSm ? classes.content : classes.smContent)}
        onClick={() => !isSm && open && toggleDrawerOpen()}
      >
        <div className={classes.appBarSpacer} />
        {isSm || !open ? null : <div className={classes.overlay} />}
        <div className={classes.container}>
          <Switch>
            {routes.map((route) => {
              if (route === null) return null;
              const Component = Components[route.componentName];
              return (
                <Route key={route.componentName} exact path={route.path}>
                  <Component />
                </Route>
              );
            })}
          </Switch>
        </div>
      </main>
      {/*hasRole(user, CONSTANTS.ROLE.ADMIN) ? <AdminPanel /> : null*/}
    </div>
  );
};

const admin_panel_actions = [
  {
    icon: <SupervisorAccountIcon />,
    name: "Account Management",
    modal: () => Components.AdminAccountManagement // This needs to be a function because the components aren't all initialized yet
  },
  {
    icon: <AssignmentIcon />,
    name: "Automated Task Management",
    modal: () => Components.AdminAutomatedTaskManagement
  }
];

const AdminPanel = ({ visible = false }) => {
  const classes = useStyles();
  const [adminPanelOpen, setAdminPanelOpen] = useState(visible);
  const [actionIndexOpen, setActionIndexOpen] = useState(-1);

  const handleAdminPanelOpen = () => setAdminPanelOpen(true);
  const handleAdminPanelClose = () => setAdminPanelOpen(false);

  const handle_modal_close = () => {
    setActionIndexOpen(-1);
    setTimeout(() => handleAdminPanelClose(), 50);
  };
  const handle_modal_open = (action_index) => {
    setActionIndexOpen(action_index);
    handleAdminPanelClose();
  };

  return (
    <div className={cx(classes.admin)}>
      <div className={classes.adminPanel}>
        <Backdrop open={adminPanelOpen} />
        <SpeedDial
          ariaLabel="Admin Panel"
          className={classes.speedDial}
          icon={
            <SpeedDialIcon icon={<SettingsIcon />} openIcon={<CloseIcon />} />
          }
          onClose={handleAdminPanelClose}
          onOpen={handleAdminPanelOpen}
          open={adminPanelOpen}
        >
          {admin_panel_actions.map((action, index) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              classes={{ staticTooltipLabel: classes.admin_action_tooltip }}
              tooltipOpen
              onClick={() => handle_modal_open(index)}
            />
          ))}
        </SpeedDial>
        {admin_panel_actions.map((action, index) => {
          const ModalComponent = action.modal();
          return (
            <ModalComponent
              key={index}
              open={actionIndexOpen === index}
              handleClose={handle_modal_close}
            />
          );
        })}
      </div>
    </div>
  );
};

registerComponent("AdminPanel", AdminPanel);
registerComponent("Layout", Layout);
