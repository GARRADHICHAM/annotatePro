import React, { useState } from 'react';
import useImages from '../hooks/useImages';
import LoadingSpinner from './LoadingSpinner';
import ImageWithLoading from './ImageWithLoading';

export default function ImageViewer({ caseId, patientAge, date }) {
    const {
        images,
        currentImage,
        currentImageIndex,
        pagination,
        loading,
        error,
        goToNextImage,
        goToPreviousImage
    } = useImages();

    const [zoomLevel, setZoomLevel] = useState(100);

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 10, 200));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 10, 50));
    };

    const handleReset = () => {
        setZoomLevel(100);
    };

    // Calculate the current overall image number and total
    const currentImageNumber = pagination.skip + currentImageIndex + 1;
    const totalImages = pagination.total;

    // Progress percentage for the progress bar
    const progressPercentage = (currentImageNumber / totalImages) * 100;

    if (loading && images.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg flex items-center justify-center h-96">
                <LoadingSpinner size="large" message="Loading mammography images..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white p-6 rounded-lg">
                <div className="text-red-500 p-4 bg-red-100 rounded-md">
                    Error: {error}. Please try again later.
                </div>
            </div>
        );
    }

    if (!currentImage && images.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg">
                <div className="text-gray-500 p-4 bg-gray-100 rounded-md">
                    No images available.
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p- rounded-lg">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">MammoAnnotate Pro</h1>
                <div className="flex items-center justify-between">
                    <p className="text-gray-600">
                        Case ID: {caseId} | Patient age:{patientAge} | Date:{date}
                    </p>
                    <div className="flex items-center">
                        <div className="w-6 h-6 bg-blue-500 rounded-full mr-2"></div>
                        <div className="w-40 h-2 bg-gray-200 rounded-full relative mr-2">
                            <div
                                className="absolute top-0 left-0 h-2 bg-blue-500 rounded-full"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                        <p className="text-gray-600">Image {currentImageNumber} of {totalImages}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <p className="text-center mb-2">Original Image</p>
                    <div className="bg-purple-900  h-80 rounded-lg overflow-hidden flex items-center justify-center">
                        {currentImage ? (
                            <ImageWithLoading
                                src={currentImage.originalUrl}
                                alt="Mammogram"
                                className="mammogram-image object-contain"
                                style={{
                                    maxHeight: `${zoomLevel}%`,
                                    maxWidth: `${zoomLevel}%`
                                }}
                            />
                        ) : (
                            <div className="text-white">No image available</div>
                        )}
                    </div>
                </div>
                <div>
                    <p className="text-center mb-2">Ground Truth Mask</p>
                    <div className="bg-black h-80 rounded-lg overflow-hidden flex items-center justify-center">
                        {/* This would be your ground truth mask */}
                        {/* For demonstration purposes, we'll leave this blank */}
                    </div>
                </div>

                <div>
                    <p className="text-center mb-2">Predicted Mask (Dice: 0.30)</p>
                    <div className="bg-black h-80 rounded-lg overflow-hidden flex items-center justify-center">
                        {/* This would be your predicted mask */}
                        {/* For demonstration purposes, we'll leave this blank */}
                    </div>
                </div>
            </div>

            <div className="flex justify-between mt-8">
                <div className="flex items-center space-x-4">
                    <button
                        className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-full tool-button"
                        onClick={handleZoomIn}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </button>

                    <button
                        className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-full tool-button"
                        onClick={handleReset}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>

                    <button
                        className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-full tool-button"
                        onClick={handleZoomOut}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                    </button>

                    <div className="px-4 py-2 bg-white border border-gray-300 rounded-md">
                        {zoomLevel}%
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        className={`px-6 py-2 ${currentImageNumber > 1 ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'} hover:cursor-pointer rounded-md`}
                        onClick={goToPreviousImage}
                        disabled={currentImageNumber <= 1}
                    >
                        Previous
                    </button>

                    <button
                        className={`px-6 py-2 ${currentImageNumber < totalImages ? 'bg-blue-500 text-white' : 'bg-blue-300 text-white cursor-not-allowed'} hover:cursor-pointer rounded-md`}
                        onClick={goToNextImage}
                        disabled={currentImageNumber >= totalImages}
                    >
                        Next Image
                    </button>

                    <button className="px-6 py-2 bg-green-500 text-white rounded-md">
                        Complete
                    </button>
                </div>
            </div>
        </div>
    );
}