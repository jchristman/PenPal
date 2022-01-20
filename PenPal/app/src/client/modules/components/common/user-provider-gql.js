import gql from "graphql-tag";

export const CURRENT_USER = gql`
  query currentUserQuery {
    currentUser {
      id
      emails
      createdAt
      profile {
        display_name
      }
      settings {
        roles
      }
    }
  }
`;

export const AUTHENTICATE_WITH_PASSWORD = gql`
  mutation authenticateWithPasswordMutation(
    $email: String!
    $password: String!
  ) {
    authenticateWithPassword(email: $email, password: $password) {
      token
      userId
      tokenExpires
      user {
        id
        emails
        createdAt
        profile {
          display_name
        }
        settings {
          roles
        }
      }
    }
  }
`;

export const SIGNUP = gql`
  mutation signupMutation($email: String!, $password: String!) {
    signup(email: $email, password: $password) {
      token
      userId
      tokenExpires
      user {
        id
        emails
        createdAt
        profile {
          display_name
        }
        settings {
          roles
        }
      }
    }
  }
`;

export const LOGOUT = gql`
  mutation logoutMutation($token: String!) {
    logout(token: $token)
  }
`;
