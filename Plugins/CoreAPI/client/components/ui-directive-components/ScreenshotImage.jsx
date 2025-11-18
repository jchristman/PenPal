import React, { useState, useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import { registerComponent, Components } from "@penpal/core";
import gql from "graphql-tag";

const { Spinner } = Components;

// GraphQL query to download file as base64 data URL
const DOWNLOAD_FILE = gql`
  query DownloadFile($bucket: String!, $fileName: String!) {
    downloadFile(bucket: $bucket, fileName: $fileName)
  }
`;

/**
 * Component that handles screenshot images that need to be fetched from FileStore
 * This is used when screenshot_url isn't available but screenshot_bucket and screenshot_key are
 */
const ScreenshotImage = ({ bucket, fileKey, maxWidth = "400px", ...props }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [downloadFile, { data: queryData, loading: queryLoading, error: queryError }] = useLazyQuery(DOWNLOAD_FILE);

  // Handle query results
  useEffect(() => {
    if (queryData?.downloadFile) {
      setImageUrl(queryData.downloadFile);
      setLoading(false);
    } else if (queryError) {
      setError(queryError.message);
      setLoading(false);
    }
  }, [queryData, queryError]);

  // Trigger download when bucket/key are available
  useEffect(() => {
    if (bucket && fileKey && !imageUrl && !loading && !error && !queryLoading) {
      setLoading(true);
      downloadFile({
        variables: {
          bucket,
          fileName: fileKey,
        },
      });
    }
  }, [bucket, fileKey, imageUrl, loading, error, queryLoading, downloadFile]);

  if (error) {
    return (
      <div className="text-sm text-muted-foreground">
        Failed to load screenshot: {error}
      </div>
    );
  }

  if (loading || !imageUrl) {
    return <Spinner size="sm" />;
  }

  // Use the standard Image component once we have the URL
  const ImageComponent = Components.UIDirectiveImage;
  return <ImageComponent src={imageUrl} maxWidth={maxWidth} {...props} />;
};

registerComponent("ScreenshotImage", ScreenshotImage);

export default ScreenshotImage;

