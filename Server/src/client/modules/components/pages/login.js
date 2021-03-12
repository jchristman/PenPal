import React, { useState } from "react";
import { Components, registerComponent, Hooks } from "meteor/penpal";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Link from "@material-ui/core/Link";
import Paper from "@material-ui/core/Paper";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";

import ReactCardFlip from "react-card-flip";

const { useAccount } = Hooks;

// https://www.pexels.com/photo/modern-computer-in-data-center-4597280/
// free to use without attribution
const BACKGROUND_IMAGE = "/images/landing-page-background.jpg";

const Copyright = () => {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {"Copyright © "}
      <Link
        color="inherit"
        href="https://plex-llc.com/capabilities/government-solutions/plexworx/"
      >
        PLEXWorx
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  image: {
    backgroundImage: `url(${BACKGROUND_IMAGE})`,
    backgroundRepeat: "no-repeat",
    backgroundColor: "transparent",
    backgroundSize: "cover",
    backgroundPosition: "center",

    "&> p": {
      position: "relative",
      zIndex: -1
    }
  },
  paper: {
    margin: theme.spacing(8, 4),
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main
  },
  form: {
    width: "60%",
    marginTop: theme.spacing(1)
  },
  submit: {
    margin: theme.spacing(3, 0, 2)
  },
  valign: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%"
  }
}));

const SignupForm = ({ showLoginForm }) => {
  const { signup } = useAccount();
  const classes = useStyles();
  const [signingUp, setSigningUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const signup_disabled =
    signingUp ||
    password2 !== password ||
    email.length === 0 ||
    password.length === 0;

  const handle_email_change = (event) => setEmail(event.target.value);
  const handle_password_change = (event) => setPassword(event.target.value);
  const handle_password2_change = (event) => setPassword2(event.target.value);
  const handle_signup_click = async () => {
    setSigningUp(true);
    const success = await signup(email, password);
    setSigningUp(false);

    if (success) {
      setEmail("");
      setPassword("");
      setPassword2("");
      showLoginForm({ preventDefault: () => {} });
    }
  };

  return (
    <div className={classes.valign}>
      <div className={classes.paper}>
        <Avatar className={classes.avatar}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign up
        </Typography>
        <form className={classes.form} noValidate>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="signup_email"
            label="Email Address"
            name="signup_email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={handle_email_change}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="signup_password"
            label="Password"
            type="password"
            id="signup_password"
            autoComplete=""
            value={password}
            onChange={handle_password_change}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="signup_password2"
            label="Confirm Password"
            type="password"
            id="signup_password2"
            autoComplete=""
            value={password2}
            onChange={handle_password2_change}
          />
          <Button
            disabled={signup_disabled}
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
            onClick={handle_signup_click}
          >
            Sign Up
          </Button>
          <Grid container>
            <Grid item xs></Grid>
            <Grid item>
              <Link href="" variant="body2" onClick={showLoginForm}>
                {"Already have an account? Login"}
              </Link>
            </Grid>
          </Grid>
          <Box mt={5}>
            <Copyright />
          </Box>
        </form>
      </div>
    </div>
  );
};

const LoginForm = ({ showSignupForm }) => {
  const { login } = useAccount();
  const classes = useStyles();
  const [loggingIn, setLoggingIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login_disabled =
    loggingIn || email.length === 0 || password.length === 0;

  const handle_email_change = (event) => setEmail(event.target.value);
  const handle_password_change = (event) => setPassword(event.target.value);
  const handle_login_click = async () => {
    setLoggingIn(true);
    await login(email, password);
    setLoggingIn(false);
  };

  return (
    <div className={classes.valign}>
      <div className={classes.paper}>
        <Avatar className={classes.avatar}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <form className={classes.form} noValidate>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={handle_email_change}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={handle_password_change}
          />
          <Button
            disabled={login_disabled}
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
            onClick={handle_login_click}
          >
            Sign In
          </Button>
          <Grid container>
            <Grid item xs></Grid>
            <Grid item>
              <Link href="" variant="body2" onClick={showSignupForm}>
                {"Don't have an account? Sign Up"}
              </Link>
            </Grid>
          </Grid>
          <Box mt={5}>
            <Copyright />
          </Box>
        </form>
      </div>
    </div>
  );
};

const FLIP_SPEED = 0.75;
const Login = () => {
  const classes = useStyles();
  const [showSignupPage, setShowSignupPage] = useState(false);

  const _showSignupPage = (event) => {
    event.preventDefault();
    setShowSignupPage(true);
  };
  const _showLoginPage = (event) => {
    event.preventDefault();
    setShowSignupPage(false);
  };

  return (
    <Grid container component="main" className={classes.root}>
      <CssBaseline />
      <Grid item xs={false} md={5} className={classes.image}>
        <p>Login page photo here</p>
      </Grid>
      <Grid item xs={12} md={7} component={Paper} elevation={6} square>
        <ReactCardFlip
          containerStyle={{ width: "100%", height: "100%" }}
          isFlipped={!showSignupPage}
          className={classes.flipper}
          flipSpeedBackToFront={FLIP_SPEED}
          flipSpeedFrontToBack={FLIP_SPEED}
        >
          <SignupForm showLoginForm={_showLoginPage} />
          <LoginForm showSignupForm={_showSignupPage} />
        </ReactCardFlip>
      </Grid>
    </Grid>
  );
};
const ForceLogin = ({ children }) => {
  const { loggedIn, loading } = useAccount();
  if (loading) return null;
  return <>{loggedIn ? children : <Login />}</>;
};

registerComponent("Login", Login);
registerComponent("ForceLogin", ForceLogin);
