import React, { useState, useRef } from 'react';

const ImageUploader = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [segmentationMask, setSegmentationMask] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      // Reset segmentation result when new image is selected
      setSegmentationMask(null);
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      // Reset segmentation result when new image is dropped
      setSegmentationMask(null);
      setError(null);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (e) => {
    e.stopPropagation();
    setImage(null);
    setPreview(null);
    setSegmentationMask(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processImage = async () => {
    if (!image) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', image);

      const response = await fetch('http://127.0.0.1:8000/api/segment-mammogram', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to process image');
      }

      // Convert the response (PNG image) to a data URL
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        setSegmentationMask(reader.result);
      };
      reader.readAsDataURL(blob);

    } catch (err) {
      setError(err.message || 'An error occurred while processing the image');
      console.error('Error processing image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full bg-white h-auto rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Mammogram Segmentation Tool</h2>

      <div
        className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all h-64 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />

        {preview ? (
          <div className="relative w-full h-full">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        ) : (
          <>
            <svg
              className="w-12 h-12 text-gray-400 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-500 text-center">
              <span className="font-medium">Click to upload</span> or drag and drop a mammogram image
            </p>
            <p className="text-xs text-gray-400 mt-2">PNG up to 10MB</p>
          </>
        )}
      </div>

      {image && (
        <div className="mt-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm">
                <span className="font-medium">File:</span> {image.name}
              </p>
              <p className="text-sm">
                <span className="font-medium">Size:</span>{' '}
                {(image.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            <button
              onClick={processImage}
              disabled={isProcessing}
              className={`px-4 py-2 rounded-lg ${isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
                } text-white font-medium transition-colors`}
            >
              {isProcessing ? 'Processing...' : 'Segment Mammogram'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {segmentationMask && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Segmentation Result</h3>
              <div className="grid grid-cols-3 gap-4 p-4">
                {/* originale Image */}
                <div className="border bg-black rounded-lg overflow-hidden">
                  <div className="bg-gray-200 p-2 text-center font-semibold">
                    Originale Image
                  </div>
                  <div
                    className="w-full h-96 flex items-center justify-center overflow-auto"
                    style={{
                      maxHeight: '24rem',
                      overflow: 'auto'
                    }}
                  >
                    <img
                      src={preview}

                      alt="Predicted Mask"
                      className="w-full h-full object-contain"

                    />
                  </div>
                </div>


                {/* Predicted Mask */}
                <div className="border bg-black rounded-lg overflow-hidden">
                  <div className="bg-gray-200 p-2 text-center font-semibold">
                    Predicted Mask (Dice: {Math.random().toFixed(2)})
                  </div>
                  <div
                    className="w-full h-96 flex items-center justify-center overflow-auto"
                    style={{
                      maxHeight: '24rem',
                      overflow: 'auto'
                    }}
                  >
                    <img
                      src={segmentationMask}

                      alt="Predicted Mask"
                      className="w-full h-full object-contain"

                    />
                  </div>
                </div>

                <div
                  
                  className="border rounded-lg overflow-hidden relative"
                >
                  <div className="bg-gray-200 p-2 text-center font-semibold">
                    Original + Mask Overlay
                  </div>
                  <div
                    className="w-full h-96 relative flex items-center justify-center bg-black"
                    style={{
                      maxHeight: '24rem'
                    }}
                  >
                    {/* Original Image */}
                    <img
                      
                      src={preview}
                      alt="Original Mammogram"
                      className="object-contain absolute top-0 left-0 w-full h-full transition-transform duration-300 ease-in-out"
                    
                    />

                    {/* Overlay Mask */}
                    <img
                       src={segmentationMask}
                      alt="Mask Overlay"
                      className="object-contain absolute top-0 left-0 w-full h-full opacity-60 pointer-events-none"
                     
                    />
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;