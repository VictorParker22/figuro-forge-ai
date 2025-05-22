
import React from "react";

interface ErrorViewProps {
  errorMessage: string | null;
  displayModelUrl: string | null;
}

const ErrorView = ({ errorMessage, displayModelUrl }: ErrorViewProps) => {
  return (
    <div className="w-full h-full p-4 flex items-center justify-center text-center">
      <div className="text-red-400">
        <p>{errorMessage}</p>
        {displayModelUrl && (
          <p className="text-sm text-green-400 mt-2">
            A model URL was received. Try downloading it using the button below.
          </p>
        )}
        {!displayModelUrl && (
          <p className="text-sm text-white/50 mt-2">Try converting the image again or upload your own GLB file</p>
        )}
      </div>
    </div>
  );
};

export default ErrorView;
