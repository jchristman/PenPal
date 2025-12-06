import React, { useState } from "react";
import { registerComponent, Components } from "@penpal/core";

interface ImageProps {
  src: string;
  maxWidth?: string;
  thumbnail?: boolean;
}

const Image: React.FC<ImageProps> = ({
  src,
  maxWidth = "400px",
  thumbnail = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!src) {
    return null;
  }

  const { Dialog, DialogContent, DialogHeader, DialogTitle } = Components;

  return (
    <div>
      {/* Clickable thumbnail image */}
      <img
        src={src}
        onClick={() => setIsOpen(true)}
        style={{
          width: "100%",
          height: "auto",
          borderRadius: "4px",
          maxWidth: maxWidth,
          margin: "8px 0",
          cursor: "pointer",
          transition: "opacity 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "0.9";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
        alt="Enrichment Image - Click to enlarge"
        title="Click to view full size"
      />

      {/* Modal for full-size image */}
      {Dialog && DialogContent && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
            {DialogHeader && (
              <DialogHeader className="p-4 pb-2">
                <DialogTitle>Image Preview</DialogTitle>
              </DialogHeader>
            )}
            <div className="p-4 pt-2 overflow-auto max-h-[85vh] flex items-center justify-center">
              <img
                src={src}
                style={{
                  maxWidth: "100%",
                  maxHeight: "85vh",
                  height: "auto",
                  borderRadius: "4px",
                }}
                alt="Full size enrichment image"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

registerComponent("UIDirectiveImage", Image);

export default Image;
