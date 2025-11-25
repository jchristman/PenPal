import { gql } from "@apollo/client";

export const UpdateProjectProfile = gql`
  mutation UpdateProjectProfile($id: ID!, $profile: ID) {
    updateProject(project: { id: $id, profile: $profile }) {
      id
      name
      profile
      dates {
        created_at
      }
    }
  }
`;

export const UpdateProject = gql`
  mutation UpdateProject($project: UpdateProjectInput!) {
    updateProject(project: $project) {
      id
      name
      description
      profile
      dates {
        created_at
        start
        end
      }
    }
  }
`;
