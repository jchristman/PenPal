import React from "react";
import { Components, registerComponent } from "meteor/penpal";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  colors,
  makeStyles
} from "@material-ui/core";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import cx from "classnames";

const useStyles = makeStyles((theme) => ({
  root: {
    height: "100%"
  },
  avatar: {
    backgroundColor: "#A9A9A9",
    height: 56,
    width: 56
  },
  delta: {
    marginRight: theme.spacing(1)
  },
  positiveDelta: {
    color: colors.green[900]
  },
  negativeDelta: {
    color: colors.red[900]
  },
  negativeDeltaArrow: {
    transform: "rotate(-180deg)"
  },
  uppercase: {
    textTransform: "uppercase"
  },
  caption: {
    marginLeft: theme.spacing(2),
    fontSize: 15
  }
}));

const TrendingStatistic = ({
  title = "",
  value = 0,
  delta = 0,
  caption = ""
  //icon = <CheckBoxOutlineBlankIcon />
}) => {
  const classes = useStyles();
  const is_positive_delta = delta >= 0;
  return (
    <Card className={classes.root}>
      <CardContent>
        <Grid container justify="space-between" spacing={3}>
          <Grid item>
            <Typography
              color="textSecondary"
              gutterBottom
              variant="body2"
              className={cx(classes.uppercase)}
            >
              {title}
            </Typography>
            <Typography
              color="textPrimary"
              variant="h4"
              className={
                value >= 0 ? classes.positiveDelta : classes.negativeDelta
              }
            >
              {value}
            </Typography>
          </Grid>
          <Grid item>
            {/*<Avatar className={classes.avatar}>{icon}</Avatar>*/}
          </Grid>
        </Grid>
        <Box mt={2} display="flex" alignItems="center">
          <ArrowUpwardIcon
            className={cx(
              classes.delta,
              is_positive_delta ? classes.positiveDelta : classes.negativeDelta,
              !is_positive_delta && classes.negativeDeltaArrow
            )}
          />
          <Typography
            className={
              is_positive_delta ? classes.positiveDelta : classes.negativeDelta
            }
            variant="h6"
          >
            {delta}
          </Typography>
          <Typography
            color="textSecondary"
            variant="caption"
            className={classes.caption}
          >
            {caption}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

registerComponent("DashboardTrendingStatistic", TrendingStatistic);
