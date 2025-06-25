import { registerComponent } from "../../penpal/client";
import React, { useState, useRef, type ChangeEvent } from "react";
import { cn } from "./utils";
import { Button } from "./button";
import {
  UploadIcon,
  FileIcon,
  XIcon,
  CheckIcon,
  AlertCircleIcon,
} from "lucide-react";
import Spinner from "./spinner";

interface FileUploadProps {
  onFileSelect?: (file: File) => void;
  onUpload?: (fileData: string, file: File) => Promise<void>;
  _onSuccess?: (documentId: string, objectName: string) => void;
  onError?: (error: unknown) => void;
  className?: string;
  maxSizeMB?: number;
  acceptedFileTypes?: string;
  _allowedTypes?: string[];
  _uploadPath?: string;
  _buttonText?: string;
  _clientId?: string;
  _documentType?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onUpload,
  _onSuccess,
  onError,
  className,
  maxSizeMB = 50,
  acceptedFileTypes = "*",
  _allowedTypes,
  _uploadPath,
  _buttonText,
  _clientId,
  _documentType,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setError(null);
    setSuccess(false);
    setUploadProgress(0);

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds maximum allowed (${maxSizeMB}MB)`);
      return;
    }

    setSelectedFile(file);

    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !onUpload) return;

    setUploading(true);
    setUploadProgress(10);
    setError(null);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        setUploadProgress(30);

        try {
          await onUpload(base64Data, selectedFile);

          setSuccess(true);
          setUploading(false);
          setUploadProgress(100);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Unknown error occurred"
          );
          setUploading(false);

          if (onError) {
            onError(err);
          }
        }
      };

      reader.onerror = () => {
        setError("Error reading file");
        setUploading(false);

        if (onError) {
          onError(new Error("Failed to read file"));
        }
      };

      reader.readAsDataURL(selectedFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setUploading(false);

      if (onError) {
        onError(err);
      }
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 hover:bg-gray-100">
        <div className="flex flex-col items-center justify-center pb-6 pt-5">
          {!selectedFile ? (
            <>
              <UploadIcon className="mb-3 h-10 w-10 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-xs text-gray-500">
                {acceptedFileTypes !== "*"
                  ? `${acceptedFileTypes
                      .split(",")
                      .join(", ")} (Max: ${maxSizeMB}MB)`
                  : `All file types accepted (Max: ${maxSizeMB}MB)`}
              </p>
            </>
          ) : (
            <div className="flex w-full flex-col items-center">
              <FileIcon className="mb-2 h-8 w-8 text-blue-500" />
              <p className="mb-1 truncate text-sm font-medium text-gray-800">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>

              {error && (
                <div className="mt-2 flex items-center text-red-500">
                  <AlertCircleIcon className="mr-1 h-4 w-4" />
                  <span className="text-xs">{error}</span>
                </div>
              )}

              {success && (
                <div className="mt-2 flex items-center text-green-500">
                  <CheckIcon className="mr-1 h-4 w-4" />
                  <span className="text-xs">Upload successful</span>
                </div>
              )}

              {uploading && (
                <div className="mt-2 w-full max-w-xs">
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept={acceptedFileTypes}
          disabled={uploading}
        />
      </div>

      <div className="flex space-x-2">
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          variant="outline"
          className="flex-1"
        >
          {selectedFile ? "Change file" : "Select file"}
        </Button>

        {selectedFile && !success && onUpload && (
          <Button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !!error}
            className="flex-1"
          >
            {uploading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        )}

        {selectedFile && (
          <Button
            type="button"
            onClick={resetUpload}
            disabled={uploading}
            variant="destructive"
            size="icon"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

registerComponent("FileUpload", FileUpload);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default FileUpload;
