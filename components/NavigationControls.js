import React from 'react';

export default function NavigationControls() {
  return (
    <div className="flex justify-between mt-8">
      <div className="flex items-center space-x-4">
        <button className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        
        <button className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        
        <button className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        
        <div className="px-4 py-2 bg-white border border-gray-300 rounded-md">
          100%
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="px-6 py-2 bg-gray-100 text-gray-800 rounded-md">
          Previous
        </button>
        
        <button className="px-6 py-2 bg-blue-500 text-white rounded-md">
          Next Image
        </button>
        
        <button className="px-6 py-2 bg-green-500 text-white rounded-md">
          Complete
        </button>
      </div>
    </div>
  );
}
