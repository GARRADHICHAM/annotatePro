import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';

const MammoAnnotatePro = () => {

    const [currentUser, setCurrentUser] = useState({});
    const [imageStats, setImageStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [statsError, setStatsError] = useState(null);
    useEffect(() => {
        const userDataString = localStorage.getItem("userData");
        console.log("userdataaaa :", userDataString)
        const userData = JSON.parse(userDataString)
        setCurrentUser(userData)

    }, [])
    console.log("userdata :", currentUser)
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedLesionType, setSelectedLesionType] = useState('');
    const [imageData, setImageData] = useState({
        originalImageUrl: '',
        predictedMaskBase64: '',
        viridisImageBase64: '',
        totalImages: 0,
        currentIndex: 0,
        // New metadata fields
        _id: '',
        fileName: '',
        folderName: '',
        uploadData: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [zoomConfig, setZoomConfig] = useState({
        level: 100,
        minZoom: 50,
        maxZoom: 300,
        step: 10
    });
    // Drawing state and tools
    const [activeToolType, setActiveToolType] = useState('brush'); // 'brush' or 'eraser'
    const [brushConfig, setBrushConfig] = useState({
        size: 10,
        color: '#ff0000', // Red for brush
    });
    const [isDrawing, setIsDrawing] = useState(false);
    const [annotationHistory, setAnnotationHistory] = useState([]);
    const [currentAnnotation, setCurrentAnnotation] = useState(null);

    // Canvas refs
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Image container ref for calculating max zoom
    const imageContainerRef = useRef(null);
    const imageRef = useRef(null);

    // Initialize canvas after image loads
    useEffect(() => {
        if (!loading && canvasRef.current) {
            initializeCanvas();
        }
    }, [loading, imageData.originalImageUrl]);

    // Initialize drawing canvas
    const initializeCanvas = () => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        // Set canvas dimensions to match the container
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        // Clear the canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    // Drawing functions
    const startDrawing = useCallback((e) => {
        if (!canvasRef.current) return;

        setIsDrawing(true);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        // Calculate position considering zoom
        const scaleRatio = zoomConfig.level / 100;
        const x = (e.clientX - rect.left) / scaleRatio;
        const y = (e.clientY - rect.top) / scaleRatio;

        // Start new path
        ctx.beginPath();
        ctx.moveTo(x, y);

        // Set drawing styles
        ctx.lineWidth = brushConfig.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (activeToolType === 'brush') {
            ctx.strokeStyle = brushConfig.color;
            ctx.globalCompositeOperation = 'source-over';
        } else {
            // Eraser
            ctx.strokeStyle = '#000000'; // doesn't matter, we're erasing
            ctx.globalCompositeOperation = 'destination-out';
        }

        setCurrentAnnotation({
            points: [{ x, y }],
            brushSize: brushConfig.size,
            color: brushConfig.color,
            tool: activeToolType
        });
    }, [brushConfig, activeToolType, zoomConfig.level]);

    const draw = useCallback((e) => {
        if (!isDrawing || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        // Calculate position considering zoom
        const scaleRatio = zoomConfig.level / 100;
        const x = (e.clientX - rect.left) / scaleRatio;
        const y = (e.clientY - rect.top) / scaleRatio;

        ctx.lineTo(x, y);
        ctx.stroke();

        // Update current annotation
        setCurrentAnnotation(prev => {
            if (prev) {
                return {
                    ...prev,
                    points: [...prev.points, { x, y }]
                };
            }
            return prev;
        });
    }, [isDrawing, zoomConfig.level]);

    const stopDrawing = useCallback(() => {
        if (!isDrawing) return;

        setIsDrawing(false);

        // Save the current annotation to history
        if (currentAnnotation) {
            setAnnotationHistory(prev => [...prev, currentAnnotation]);
            setCurrentAnnotation(null);
        }

        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.closePath();
        }
    }, [isDrawing, currentAnnotation]);

    // Clear all annotations
    const clearAnnotations = () => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        setAnnotationHistory([]);
    };

    // Undo last annotation
    const undoLastAnnotation = () => {
        if (annotationHistory.length === 0 || !canvasRef.current) return;

        // Remove the last annotation from history
        setAnnotationHistory(prev => prev.slice(0, -1));

        // Redraw all remaining annotations
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Redraw remaining annotations
        redrawAnnotations(annotationHistory.slice(0, -1));
    };

    // Redraw all annotations from history
    const redrawAnnotations = (annotations) => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        annotations.forEach(annotation => {
            if (annotation.points.length < 2) return;

            ctx.beginPath();
            ctx.moveTo(annotation.points[0].x, annotation.points[0].y);

            // Set styles based on the annotation
            ctx.lineWidth = annotation.brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (annotation.tool === 'brush') {
                ctx.strokeStyle = annotation.color;
                ctx.globalCompositeOperation = 'source-over';
            } else {
                // Eraser
                ctx.strokeStyle = '#000000';
                ctx.globalCompositeOperation = 'destination-out';
            }

            // Draw the path
            annotation.points.forEach(point => {
                ctx.lineTo(point.x, point.y);
            });

            ctx.stroke();
            ctx.closePath();
        });
    };

    // Change brush size
    const changeBrushSize = (newSize) => {
        setBrushConfig(prev => ({
            ...prev,
            size: newSize
        }));
    };

    // Change brush color
    const changeBrushColor = (newColor) => {
        setBrushConfig(prev => ({
            ...prev,
            color: newColor
        }));
    };

    // Zoom handlers with improved logic
    const handleZoomIn = useCallback(() => {
        setZoomConfig(prev => ({
            ...prev,
            level: Math.min(prev.level + prev.step, prev.maxZoom)
        }));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoomConfig(prev => ({
            ...prev,
            level: Math.max(prev.level - prev.step, prev.minZoom)
        }));
    }, []);

    const handleReset = useCallback(() => {
        setZoomConfig(prev => ({
            ...prev,
            level: 100
        }));
    }, []);
    const [showStats, setShowStats] = useState(false); // Toggle for showing/hiding stats
    // Fetch image data
    const fetchImageData = async (index = 0, caseId = null) => {
        try {
            setLoading(true);
            const response = await axios.get('http://127.0.0.1:8000/api/mammogram/predict_next', {
                params: {
                    current_index: index,
                    case_id: caseId
                }
            });

            // Reset zoom when new image loads
            setZoomConfig(prev => ({
                ...prev,
                level: 100
            }));

            // Clear annotations when loading new image
            setAnnotationHistory([]);

            setImageData(response.data);
            setError(null);

            const fetchImageStats = async (imageId) => {
                try {
                    setLoadingStats(true);
                    setStatsError(null);
                    const response2 = await axios.get(`http://127.0.0.1:8000/api/api/annotations/stats/image/${response.data.id}`);
                    setImageStats(response2.data);
                } catch (err) {
                    console.error('Failed to fetch image statistics:', err);
                    setStatsError('Failed to load image statistics');
                } finally {
                    setLoadingStats(false);
                }
            };
            fetchImageStats()
        } catch (err) {
            setError('Failed to fetch mammogram data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Initial data fetch
    useEffect(() => {
        fetchImageData();
    }, []);

    // Handle next image
    const handleNextImage = () => {
        fetchImageData(imageData.currentIndex);
    };

    // Handle previous image
    const handlePreviousImage = () => {
        // Subtract 2 to go back one image (since next API increments)
        fetchImageData(Math.max(0, imageData.currentIndex - 2));
    };

    //saving annotation ------------------------------------------------------------------------------------------

    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState(null);

    const [notes, setNotes] = useState('');
    const saveAnnotation = async () => {
        if (!canvasRef.current || !selectedLesionType) {
            setSaveError("Please select a lesion type before saving");
            setTimeout(() => setSaveError(null), 3000);
            return;
        }

        try {
            setSaving(true);
            setSaveSuccess(false);
            setSaveError(null);

            // Get canvas data as base64
            const canvas = canvasRef.current;
            const annotationDataUrl = canvas.toDataURL('image/png');
            const annotationBase64 = annotationDataUrl.split(',')[1]; // Remove the data:image/png;base64, part

            // Prepare the payload
            const payload = {
                image_id: imageData.id,
                image_path: imageData.originalImageUrl,
                file_name: imageData.fileName,
                folder_name: imageData.folderName || imageData.classe,
                annotation_base64: annotationBase64,
                birads_category: selectedCategory,
                lesion_type: selectedLesionType,
                annotated_by: currentUser._id,
                annotator_name: currentUser.full_name,
                notes: notes,
                annotation_date: new Date().toISOString(),
                dice_score: Math.random().toFixed(2), // This would be calculated properly in a real scenario
                // Optional: store drawing history for future editing
            };

            // Send to backend
            const response = await axios.post('http://127.0.0.1:8000/api/api/mammogram/save_annotation', payload);

            console.log('Annotation saved:', response.data);
            setSaveSuccess(true);

            // Reset annotation canvas after successful save if needed
            // clearAnnotations();

            // Auto-advance to next image after short delay
            setTimeout(() => {
                setSaveSuccess(false);
                handleNextImage();
            }, 1500);

        } catch (err) {
            console.error('Failed to save annotation:', err);
            setSaveError(err.response?.data?.detail || "Failed to save annotation");
        } finally {
            setSaving(false);
        }
    };


    // Get lesion type display label
    const getLesionTypeLabel = (value) => {
        const lesion = lesionTypes.find(l => l.value === value);
        return lesion ? lesion.label : value;
    };

    // Get birads category display label
    const getBiRadsCategoryLabel = (value) => {
        const category = biRadsCategories.find(c => c.value === value);
        return category ? category.label : `BI-RADS ${value}`;
    };

    // Render loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-blue-500"></div>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="text-red-500 text-center p-4">
                {error}
            </div>
        );
    }




    const biRadsCategories = [
        { value: '', label: 'Select BI-RADS Type' },
        { value: '0', label: '0 - Incomplete/Needs Additional Imaging' },
        { value: '1', label: '1 - Negative' },
        { value: '2', label: '2 - Benign Finding' },
        { value: '3', label: '3 - Probably Benign' },
        { value: '4', label: '4 - Suspicious' },
        { value: '5', label: '5 - Highly Suspicious of Malignancy' },
        { value: '6', label: '6 - Known Biopsy-Proven Malignancy' }


    ];

    const lesionTypes = [
        { value: '', label: 'Select Lesion Type' },
        { value: 'mass', label: 'Mass' },
        { value: 'calcification', label: 'Calcification' },
        { value: 'architectural-distortion', label: 'Architectural Distortion' },
        { value: 'asymmetry', label: 'Asymmetry' },
        { value: 'focal-asymmetry', label: 'Focal Asymmetry' },
        { value: 'suspicious-lymph-node', label: 'Suspicious Lymph Node' },
        { value: 'skin-lesion', label: 'Skin Lesion' },
        { value: 'other', label: 'Other' }
    ];

    // Generate a color for chart based on category
    const getCategoryColor = (category) => {
        const colors = {
            '0': '#9CA3AF', // gray-500
            '1': '#10B981', // green-500
            '2': '#34D399', // green-400
            '3': '#F59E0B', // yellow-500
            '4': '#F97316', // orange-500
            '5': '#EF4444', // red-500
            '6': '#DC2626', // red-600
            'mass': '#3B82F6', // blue-500
            'calcification': '#8B5CF6', // purple-500
            'architectural-distortion': '#EC4899', // pink-500
            'asymmetry': '#F97316', // orange-500
            'focal-asymmetry': '#F59E0B', // yellow-500
            'suspicious-lymph-node': '#EF4444', // red-500
            'skin-lesion': '#10B981', // green-500
            'other': '#6B7280' // gray-500
        };
        return colors[category] || '#6B7280'; // Default to gray
    };



    return (
        <div className='flex space-x-4 space-y-2'>
            <div className="w-72 sapace-y-2 flex-col  rounded-lg ">
                <div className='bg-white rounded-lg space-y-4 border-gray-300 border mb-2  p-4'>
                    <h2 className="text-2xl font-bold mb-4">Annotation Tools</h2>
                    <div className="flex items-center space-x-4">

                        <button
                            className={`px-4 py-2 rounded-md ${activeToolType === 'brush' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                            onClick={() => setActiveToolType('brush')}
                        >
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Brush
                            </div>
                        </button>
                        <button
                            className={`px-4 py-2 rounded-md ${activeToolType === 'eraser' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                            onClick={() => setActiveToolType('eraser')}
                        >
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.086 2.207a2 2 0 012.828 0l3.879 3.879a2 2 0 010 2.828l-5.5 5.5A2 2 0 017.879 15H5.12a2 2 0 01-1.414-.586l-2.5-2.5a2 2 0 010-2.828l6.879-6.879zm.66 11.34L3.453 8.254 1.914 9.793a1 1 0 000 1.414l2.5 2.5a1 1 0 00.707.293H7.88a1 1 0 00.707-.293l.16-.16z" clipRule="evenodd" />
                                </svg>
                                Eraser
                            </div>
                        </button>
                    </div>

                    {/* Brush Size Control */}
                    <div className="flex-col items-center w-full space-x-4">
                        <div className="font-medium text-gray-700">Brush Size:</div>
                        <div className='flex w-full'>
                            <input
                                type="range"
                                min="1"
                                max="50"
                                value={brushConfig.size}
                                onChange={(e) => changeBrushSize(parseInt(e.target.value))}
                                className="w-full"
                            />
                            <div className="px-2 py-1 bg-gray-100 rounded-md text-sm">{brushConfig.size}px</div>
                        </div>
                    </div>
                    {/* Brush Color (only visible when brush is active) */}
                    {activeToolType === 'brush' && (
                        <div className="flex items-center space-x-4">
                            <div className="font-medium text-gray-700">Color:</div>
                            <input
                                type="color"
                                value={brushConfig.color}
                                onChange={(e) => changeBrushColor(e.target.value)}
                                className="w-8 h-8 rounded-md cursor-pointer"
                            />
                        </div>
                    )}
                    <div className="flex items-center space-x-2">
                        <button
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            onClick={undoLastAnnotation}
                            disabled={annotationHistory.length === 0}
                        >
                            Undo
                        </button>
                        <button
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            onClick={clearAnnotations}
                            disabled={annotationHistory.length === 0}
                        >
                            Clear All
                        </button>
                    </div>
                </div>

                <div className='bg-white rounded-lg border-gray-300 border  p-4'>

                    <div className="space-y-4">
                        <div>
                            <p className="text-gray-600 mb-2">Lesion Type :</p>
                            <select
                                value={selectedLesionType}
                                onChange={(e) => setSelectedLesionType(e.target.value)}
                                className="w-full bg-gray-100 p-2 rounded-md border border-gray-300"
                            >
                                {lesionTypes.map((lesion) => (
                                    <option key={lesion.value} value={lesion.value}>
                                        {lesion.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <p className="text-gray-600 mb-2">BI-RADS Rating :</p>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full bg-gray-100 p-2 rounded-md border border-gray-300"
                            >
                                {biRadsCategories.map((category) => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {/* New notes field */}
                        <div>
                            <p className="text-gray-600 mb-2">Notes :</p>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-gray-100 p-2 rounded-md border border-gray-300 h-24"
                                placeholder="Add any additional findings or notes here..."
                            />
                        </div>


                        {/* Save button */}
                        <button
                            className={`w-full py-3 rounded-md flex items-center justify-center ${saving ? 'bg-gray-400' : saveSuccess ? 'bg-green-500' : 'bg-green-500 hover:bg-green-600'
                                } text-white`}
                            onClick={saveAnnotation}
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : saveSuccess ? (
                                <>
                                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Saved!
                                </>
                            ) : (
                                'Save'
                            )}
                        </button>
                        {/* Error message */}
                        {saveError && (
                            <div className="text-red-500 text-center p-2 bg-red-50 rounded-md">
                                {saveError}
                            </div>
                        )}

                        {/* Show current user */}
                        <div className="text-sm text-gray-500 mt-2 text-center">
                            Annotating as: {currentUser.name}
                        </div>
                    </div>
                </div>

            </div>
            <div className="container mx-auto space-y-2 max-w-6xl">
                <div className="bg-white border-gray-300 border shadow-lg rounded-lg overflow-hidden">
                    {/* Header with Progress Bar and Metadata */}
                    <div className="p-4 bg-gray-100 border-b border-gray-300">
                        <div className="flex justify-between items-center mb-2">
                            <h1 className="text-2xl font-bold text-gray-800">
                                MammoAnnotate Pro
                            </h1>
                            <div className="text-gray-600 flex flex-col items-end">
                                <div className="mb-1">Image {imageData.currentIndex + 1} of {imageData.totalImages}</div>
                                {/* Progress Bar */}
                                <div className="w-40 bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-500 h-2.5 rounded-full"
                                        style={{ width: `${((imageData.currentIndex + 1) / imageData.totalImages) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Image Metadata */}
                        <div className="grid grid-cols-4 gap-4 mt-3 text-sm bg-white p-3 rounded-md shadow-sm">
                            <div>
                                <span className="font-semibold text-gray-700">ID:</span>
                                <span className="ml-2 text-gray-600">{imageData.id ? imageData.id.substring(0, 10) + '...' : 'N/A'}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">File Name:</span>
                                <span className="ml-2 text-gray-600">{imageData.fileName || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Folder:</span>
                                <span className="ml-2 text-gray-600">{imageData.classe || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Upload Date:</span>
                                <span className="ml-2 text-gray-600">
                                    {imageData.uploadData ? new Date(imageData.uploadData).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Image Grid */}
                    <div className="grid grid-cols-3 gap-4 p-4">
                        {/* Original Image with Annotation Canvas */}
                        <div
                            ref={imageContainerRef}
                            className="border border-gray-300 bg-black rounded-lg overflow-hidden relative"
                        >
                            <div className="bg-gray-200 p-2 text-center font-semibold">
                                Original Image (Draw Annotations)
                            </div>
                            <div
                                ref={containerRef}
                                className="w-full h-96 flex items-center justify-center overflow-auto relative"
                                style={{
                                    maxHeight: '24rem',
                                    overflow: 'auto'
                                }}
                            >
                                <img
                                    ref={imageRef}
                                    src={imageData.originalImageUrl}
                                    alt="Original Mammogram"
                                    className="object-contain transition-transform duration-300 ease-in-out"
                                    style={{
                                        transform: `scale(${zoomConfig.level / 100})`,
                                        transformOrigin: 'center center'
                                    }}
                                />
                                <canvas
                                    ref={canvasRef}
                                    className="absolute top-0 left-0 w-full h-full cursor-crosshair pointer-events-auto"
                                    style={{
                                        transform: `scale(${zoomConfig.level / 100})`,
                                        transformOrigin: 'center center'
                                    }}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                ></canvas>
                            </div>
                        </div>

                        {/* Predicted Mask */}
                        <div className="border border-gray-300 bg-black rounded-lg overflow-hidden">
                            <div className="bg-gray-200 p-2 text-center font-semibold">
                                Predicted Mask {/*(Dice: {Math.random().toFixed(2)})*/}
                            </div>
                            <div
                                className="w-full h-96 flex items-center justify-center overflow-auto"
                                style={{
                                    maxHeight: '24rem',
                                    overflow: 'auto'
                                }}
                            >
                                <img
                                    src={`data:image/png;base64,${imageData.predictedMaskBase64}`}
                                    alt="Predicted Mask"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        </div>

                        {/* Original + Mask Overlay */}
                        <div className="border border-gray-300 rounded-lg overflow-hidden relative">
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
                                    src={imageData.originalImageUrl}
                                    alt="Original Mammogram"
                                    className="object-contain absolute top-0 left-0 w-full h-full transition-transform duration-300 ease-in-out"

                                />

                                {/* Overlay Mask */}
                                <img
                                    src={`data:image/png;base64,${imageData.predictedMaskBase64}`}
                                    alt="Mask Overlay"
                                    className="object-contain absolute top-0 left-0 w-full h-full opacity-60 pointer-events-none"

                                />
                            </div>
                        </div>
                    </div>



                    {/* Navigation and Zoom Controls */}
                    <div className="flex justify-between p-4 bg-gray-50 border-t border-gray-200">
                        {/* Zoom Controls */}
                        <div className="flex items-center space-x-4">
                            {/* Zoom In Button */}
                            <button
                                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-100"
                                onClick={handleZoomIn}
                                disabled={zoomConfig.level >= zoomConfig.maxZoom}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </button>

                            {/* Reset Zoom Button */}
                            <button
                                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-100"
                                onClick={handleReset}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>

                            {/* Zoom Out Button */}
                            <button
                                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-100"
                                onClick={handleZoomOut}
                                disabled={zoomConfig.level <= zoomConfig.minZoom}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                            </button>

                            {/* Zoom Level Display */}
                            <div className="px-4 py-2 bg-white border border-gray-300 rounded-md">
                                {zoomConfig.level}%
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center space-x-4">
                            <button
                                className={`px-4 py-2 border ${showStats ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'} rounded hover:bg-blue-600 hover:text-white`}
                                onClick={() => setShowStats(!showStats)}
                            >
                                {showStats ? 'Hide Statistics' : 'Show Statistics'}
                            </button>

                            <button
                                className="px-6 py-2 bg-gray-100 text-gray-800 cursor-pointer rounded-md hover:bg-gray-200"
                                onClick={handlePreviousImage}
                            >
                                Previous
                            </button>

                            <button
                                className="px-6 py-2 bg-blue-500 cursor-pointer text-white rounded-md hover:bg-blue-600"
                                onClick={handleNextImage}
                            >
                                Next Image
                            </button>

                            <button className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
                                Complete
                            </button>
                        </div>
                    </div>
                </div>


                {/* Stats Section */}
                {showStats && (
                    <div className="p-6 border-b bg-white rounded-lg border  border-gray-200">
                        <h2 className="text-xl font-bold mb-4">Image Annotation Statistics</h2>

                        {loadingStats ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        ) : statsError ? (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                <p>{statsError}</p>
                            </div>
                        ) : imageStats ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Statistics */}
                                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                    <h3 className="text-lg font-semibold mb-3">Overview</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white p-3 rounded-md shadow-sm">
                                            <div className="text-sm text-gray-500">Total Annotations</div>
                                            <div className="text-2xl font-bold">{imageStats.total_annotations}</div>
                                        </div>
                                        <div className="bg-white p-3 rounded-md shadow-sm">
                                            <div className="text-sm text-gray-500">Unique Annotators</div>
                                            <div className="text-2xl font-bold">{imageStats.unique_annotators}</div>
                                        </div>
                                    </div>

                                    {/* Consensus Information */}
                                    {imageStats.consensus_data && imageStats.unique_annotators > 1 && (
                                        <div className="mt-4 bg-white p-3 rounded-md shadow-sm">
                                            <h4 className="font-semibold text-gray-700 mb-2">Consensus Analysis</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span>Most Common BI-RADS:</span>
                                                    <span className="font-medium">{getBiRadsCategoryLabel(imageStats.consensus_data.most_common_birads)}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div
                                                        className="bg-blue-600 h-2.5 rounded-full"
                                                        style={{ width: `${imageStats.consensus_data.birads_agreement_percentage}%` }}
                                                    ></div>
                                                </div>
                                                <div className="text-sm text-gray-500 text-right">
                                                    {imageStats.consensus_data.birads_agreement_percentage}% agreement
                                                </div>

                                                <div className="flex justify-between mt-2">
                                                    <span>Most Common Lesion Type:</span>
                                                    <span className="font-medium">{getLesionTypeLabel(imageStats.consensus_data.most_common_lesion)}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div
                                                        className="bg-purple-600 h-2.5 rounded-full"
                                                        style={{ width: `${imageStats.consensus_data.lesion_agreement_percentage}%` }}
                                                    ></div>
                                                </div>
                                                <div className="text-sm text-gray-500 text-right">
                                                    {imageStats.consensus_data.lesion_agreement_percentage}% agreement
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Distribution Charts */}
                                <div className="space-y-4">
                                    {/* BI-RADS Distribution */}
                                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                        <h3 className="text-lg font-semibold mb-3">BI-RADS Distribution</h3>
                                        <div className="space-y-2">
                                            {imageStats.birads_distribution.map((birads) => (
                                                <div key={birads.category} className="flex items-center">
                                                    <div className="w-24 text-sm">BI-RADS {birads.category}</div>
                                                    <div className="flex-1 mx-2">
                                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                            <div
                                                                className="h-2.5 rounded-full"
                                                                style={{
                                                                    width: `${birads.percentage}%`,
                                                                    backgroundColor: getCategoryColor(birads.category)
                                                                }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                    <div className="w-16 text-sm text-right">{birads.percentage}%</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Lesion Type Distribution */}
                                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                        <h3 className="text-lg font-semibold mb-3">Lesion Type Distribution</h3>
                                        <div className="space-y-2">
                                            {imageStats.lesion_distribution.map((lesion) => (
                                                <div key={lesion.lesion_type} className="flex items-center">
                                                    <div className="w-32 text-sm truncate" title={getLesionTypeLabel(lesion.lesion_type)}>
                                                        {getLesionTypeLabel(lesion.lesion_type)}
                                                    </div>
                                                    <div className="flex-1 mx-2">
                                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                            <div
                                                                className="h-2.5 rounded-full"
                                                                style={{
                                                                    width: `${lesion.percentage}%`,
                                                                    backgroundColor: getCategoryColor(lesion.lesion_type)
                                                                }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                    <div className="w-16 text-sm text-right">{lesion.percentage}%</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* User Distribution */}
                                <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg shadow-sm">
                                    <h3 className="text-lg font-semibold mb-3">Annotator Distribution</h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full bg-white">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left py-2 px-4">Annotator</th>
                                                    <th className="text-left py-2 px-4">Annotations</th>
                                                    <th className="text-right py-2 px-4">Percentage</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {imageStats.user_distribution.map((user, index) => (
                                                    <tr key={user.user_id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                                        <td className="py-2 px-4">{user.annotator_name || user.user_id}</td>
                                                        <td className="py-2 px-4">{user.count}</td>
                                                        <td className="py-2 px-4 text-right">
                                                            <div className="flex items-center justify-end">
                                                                <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                                                                    <div
                                                                        className="bg-blue-600 h-2.5 rounded-full"
                                                                        style={{ width: `${user.percentage}%` }}
                                                                    ></div>
                                                                </div>
                                                                {user.percentage}%
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4 text-gray-500">
                                No statistics available for this image
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MammoAnnotatePro;