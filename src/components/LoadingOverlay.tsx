import type React from "react";

const LoadingOverlay: React.FC = () => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 pointer-events-auto">
    <div
      className="h-12 w-12 rounded-full animate-spin"
      style={{
        border: "4px solid rgba(255,255,255,0.2)",
        borderTopColor: "var(--espn-red, #cc0000)",
      }}
    />
  </div>
);

export default LoadingOverlay;
