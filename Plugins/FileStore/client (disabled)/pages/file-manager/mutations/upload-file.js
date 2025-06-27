import { gql } from "@apollo/client";

const UPLOAD_FILE = gql`
  mutation UploadFile(
    $bucket: String!
    $fileName: String!
    $file: Upload!
    $metadata: JSON
  ) {
    uploadFile(
      bucket: $bucket
      fileName: $fileName
      file: $file
      metadata: $metadata
    ) {
      success
      fileId
      downloadUrl
      error
    }
  }
`;

export default UPLOAD_FILE;
