import React from 'react';

export default function LoadingSpinner({ size = 'medium', message = 'Loading...' }) {
  const sizeClasses = {
    small: 'w-6 h-6 border-2',
    medium: 'w-8 h-8 border-4',
    large: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`spinner-border animate-spin inline-block ${sizeClasses[size]} rounded-full border-t-transparent border-blue-500 mb-2`}></div>
      {message && <p className="text-gray-600 text-sm">{message}</p>}
    </div>
  );
}