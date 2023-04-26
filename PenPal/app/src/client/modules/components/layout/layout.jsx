import React, { useState, useEffect } from "react";
import {
  Components,
  registerComponent,
  Hooks,
  Routes as _Routes,
} from "@penpal/core";
import { makeStyles, useTheme } from "@mui/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Drawer from "@mui/material/Drawer";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

import useMediaQuery from "@mui/material/useMediaQuery";
import { Link } from "react-router-dom";
import cx from "classnames";

import { matchPath } from "react-router";
import { Routes, Route, useLocation } from "react-router-dom";
const { useAccount } = Hooks;

const drawerWidth = 240;
const closedDrawerWidth = 57;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    width: "100%",
    height: "100%",
    position: "fixed",
    top: 0,
    left: 0,
  },
  toolbar: {
    paddingRight: 24, // keep right padding when drawer closed
  },
  toolbarIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "0 8px",
    ...theme.mixins.toolbar,
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  userContainer: {
    display: "flex",
    alignItems: "center",
  },
  logoutButton: {
    color: theme.palette.getContrastText("#3f51b5"),
    marginLeft: 15,
  },
  menuButton: {
    marginRight: 36,
  },
  menuButtonHidden: {
    display: "none",
  },
  title: {
    flexGrow: 1,
  },
  drawerPaper: {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerPaperClose: {
    overflowX: "hidden",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: closedDrawerWidth,
    [theme.breakpoints.up("sm")]: {
      width: closedDrawerWidth,
    },
  },
  smDrawerPaperClose: {
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: "hidden",
    width: 0,
  },
  appBarSpacer: theme.mixins.toolbar,
  main: {
    display: "flex",
    flexDirection: "column",
    overflow: "scroll",
    maxHeight: "100%",
    transform: "translateZ(0px)",
    position: "relative",
  },
  content: {
    backgroundColor: "#EEE",
    flexGrow: 1,
  },
  smContent: {
    backgroundColor: "#EEE",
    position: "fixed",
    left: closedDrawerWidth,
    right: 0,
    top: 0,
    bottom: 0,
    overflowX: "hidden",
    padding: 0,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "black",
    opacity: 0.3,
    zIndex: 1,
  },
  container: {
    flex: 1,
    padding: theme.spacing(2),
    overflow: "hidden",
    overflowY: "auto",
    marginLeft: drawerWidth,
  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
  },
  fixedHeight: {
    height: 240,
  },
  admin: {
    position: "fixed",
    top: 0,
    zIndex: 1,
    pointerEvents: "none",
  },
  adminPanel: {
    position: "relative",
    height: "100vh",
    width: "100vw",
  },
  speedDial: {
    position: "absolute",
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
  admin_action_tooltip: {
    width: "max-content",
  },
  nav_drawer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  clock_container: {
    textAlign: "center",
    fontSize: 15,
  },
}));

const Layout = () => {
  const location = useLocation();
  const classes = useStyles();
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.up("sm"));
  const isMd = useMediaQuery(theme.breakpoints.up("md"));
  const [open, setOpen] = useState(true);
  const toggleDrawerOpen = () => setOpen((prev) => !prev);
  const { user, logout } = useAccount();

  useEffect(() => setOpen(isMd), [isMd]);

  let activeRoutePrettyName = "";
  const routes = _Routes.map((_route) => {
    const route = _route.name === "" ? null : _route;
    if (!!matchPath(location.pathname, route?.path)) {
      activeRoutePrettyName = route.prettyName;
    }
    return route;
  });

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
              color="warning"
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
          ),
        }}
        open={open}
      >
        <div className={classes.toolbarIcon}>
          <IconButton onClick={toggleDrawerOpen}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <Divider />
        <List className={classes.nav_drawer}>
          {routes.map((route, index) => {
            if (route === null) return <Divider key={index} />;
            if (route.prettyName === undefined) return null;
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
          <div className={classes.clock_container}>Clock Unavailable</div>
        </List>
      </Drawer>
      <main
        className={cx(classes.main, isSm ? classes.content : classes.smContent)}
        onClick={() => !isSm && open && toggleDrawerOpen()}
      >
        <div className={classes.appBarSpacer} />
        {isSm || !open ? null : <div className={classes.overlay} />}
        <div className={classes.container}>
          <Routes>
            {routes.map((route) => {
              if (route === null) return null;
              const Component = Components[route.componentName];
              return (
                <Route
                  key={route.componentName}
                  path={route.path}
                  element={<Component />}
                />
              );
            })}
          </Routes>
        </div>
      </main>
    </div>
  );
};

registerComponent("Layout", Layout);
