import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import * as dicomParser from 'dicom-parser';
import * as cornerstone from 'cornerstone-core';
import cornerstoneWebImageLoader from 'cornerstone-web-image-loader';

const ImageUploader = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [segmentationMask, setSegmentationMask] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLesionType, setSelectedLesionType] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [currentUser, setCurrentUser] = useState({});
  const [imageStats, setImageStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDicomFile, setIsDicomFile] = useState(false);
  const [dicomMetadata, setDicomMetadata] = useState(null);

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
  const moroccanRegions = [
    { value: '', label: 'Select Region' },
    { value: 'tanger-tetouan-al-hoceima', label: 'Tanger-Tétouan-Al Hoceïma' },
    { value: 'oriental', label: 'Oriental' },
    { value: 'fes-meknes', label: 'Fès-Meknès' },
    { value: 'rabat-sale-kenitra', label: 'Rabat-Salé-Kénitra' },
    { value: 'beni-mellal-khenifra', label: 'Béni Mellal-Khénifra' },
    { value: 'casablanca-settat', label: 'Casablanca-Settat' },
    { value: 'marrakech-safi', label: 'Marrakech-Safi' },
    { value: 'draa-tafilalet', label: 'Drâa-Tafilalet' },
    { value: 'souss-massa', label: 'Souss-Massa' },
    { value: 'guelmim-oued-noun', label: 'Guelmim-Oued Noun' },
    { value: 'laayoune-sakia-el-hamra', label: 'Laâyoune-Sakia El Hamra' },
    { value: 'dakhla-oued-ed-dahab', label: 'Dakhla-Oued Ed-Dahab' }
  ];

  useEffect(() => {
    // Initialize cornerstone
    cornerstoneWebImageLoader.external.cornerstone = cornerstone;
    cornerstoneWebImageLoader.external.dicomParser = dicomParser;
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if it's a DICOM file
      const isDicom = file.name.toLowerCase().endsWith('.dcm') ||
        file.type === 'application/dicom' ||
        file.name.toLowerCase().includes('dicom');

      setIsDicomFile(isDicom);
      setImage(file);

      if (isDicom) {
        handleDicomFile(file);
      } else if (file.type.startsWith('image/')) {
        handleStandardImage(file);
      } else {
        setError('Unsupported file format. Please upload a DICOM (.dcm) file or standard image format.');
        return;
      }

      // Reset segmentation result when new image is selected
      setSegmentationMask(null);
      setError(null);
    }
  };


  // 6. Add this new function to handle DICOM files:
  const handleDicomFile = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const byteArray = new Uint8Array(arrayBuffer);

      try {
        // Parse DICOM file
        const dataSet = dicomParser.parseDicom(byteArray);

        // Extract metadata
        const metadata = {
          patientName: dataSet.string('x00100010') || 'Unknown',
          studyDate: dataSet.string('x00080020') || 'Unknown',
          modality: dataSet.string('x00080060') || 'Unknown',
          rows: dataSet.uint16('x00280010'),
          columns: dataSet.uint16('x00280011'),
          bitsAllocated: dataSet.uint16('x00280100') || 16,
          bitsStored: dataSet.uint16('x00280101') || 16,
          highBit: dataSet.uint16('x00280102') || 15,
          pixelRepresentation: dataSet.uint16('x00280103') || 0,
          windowCenter: dataSet.string('x00281050') || dataSet.floatString('x00281050'),
          windowWidth: dataSet.string('x00281051') || dataSet.floatString('x00281051'),
          rescaleIntercept: dataSet.floatString('x00281052') || 0,
          rescaleSlope: dataSet.floatString('x00281053') || 1,
        };

        console.log('DICOM Metadata:', metadata);
        setDicomMetadata(metadata);

        // Get pixel data
        const pixelDataElement = dataSet.elements.x7fe00010;
        if (!pixelDataElement) {
          throw new Error('No pixel data found in DICOM file');
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = metadata.columns;
        canvas.height = metadata.rows;

        // Determine pixel data type and read accordingly
        let pixelData;
        const pixelDataLength = metadata.rows * metadata.columns;

        if (metadata.bitsAllocated === 8) {
          // 8-bit data
          pixelData = new Uint8Array(
            dataSet.byteArray.buffer,
            pixelDataElement.dataOffset,
            pixelDataLength
          );
        } else {
          // 16-bit data (most common for medical images)
          pixelData = new Uint16Array(
            dataSet.byteArray.buffer,
            pixelDataElement.dataOffset,
            pixelDataLength
          );
        }

        // Find min/max values efficiently for large arrays
        let pixelMin = pixelData[0];
        let pixelMax = pixelData[0];
        for (let i = 1; i < pixelData.length; i++) {
          if (pixelData[i] < pixelMin) pixelMin = pixelData[i];
          if (pixelData[i] > pixelMax) pixelMax = pixelData[i];
        }

        console.log('Pixel data info:', {
          length: pixelData.length,
          min: pixelMin,
          max: pixelMax,
          bitsAllocated: metadata.bitsAllocated
        });

        // Apply rescale slope and intercept if available
        const processedPixelData = new Float32Array(pixelData.length);
        let processedMin = Infinity;
        let processedMax = -Infinity;

        for (let i = 0; i < pixelData.length; i++) {
          const processedValue = pixelData[i] * metadata.rescaleSlope + metadata.rescaleIntercept;
          processedPixelData[i] = processedValue;
          if (processedValue < processedMin) processedMin = processedValue;
          if (processedValue > processedMax) processedMax = processedValue;
        }

        // Calculate automatic windowing if not provided
        let windowCenter, windowWidth;
        if (metadata.windowCenter && metadata.windowWidth) {
          windowCenter = parseFloat(metadata.windowCenter.split('\\')[0]); // Handle multiple values
          windowWidth = parseFloat(metadata.windowWidth.split('\\')[0]);
        } else {
          // Auto-calculate window/level
          windowCenter = (processedMin + processedMax) / 2;
          windowWidth = processedMax - processedMin;
          console.log('Auto-calculated windowing:', { windowCenter, windowWidth, min: processedMin, max: processedMax });
        }

        // Apply windowing and convert to display values
        const imageData = context.createImageData(metadata.columns, metadata.rows);
        const data = imageData.data;

        const windowMin = windowCenter - windowWidth / 2;
        const windowMax = windowCenter + windowWidth / 2;

        for (let i = 0; i < processedPixelData.length; i++) {
          let pixelValue = processedPixelData[i];

          // Apply windowing
          if (pixelValue < windowMin) {
            pixelValue = 0;
          } else if (pixelValue > windowMax) {
            pixelValue = 255;
          } else {
            pixelValue = ((pixelValue - windowMin) / windowWidth) * 255;
          }

          // Ensure value is in valid range
          pixelValue = Math.max(0, Math.min(255, Math.round(pixelValue)));

          const index = i * 4;
          data[index] = pixelValue;     // R
          data[index + 1] = pixelValue; // G
          data[index + 2] = pixelValue; // B
          data[index + 3] = 255;        // A (fully opaque)
        }

        // Put image data on canvas
        context.putImageData(imageData, 0, 0);

        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/png');
        setPreview(dataUrl);

        console.log('DICOM processing completed successfully');

      } catch (parseError) {
        console.error('Error parsing DICOM:', parseError);
        setError('Invalid DICOM file format: ' + parseError.message);
      }

    } catch (error) {
      console.error('Error reading DICOM file:', error);
      setError('Error reading DICOM file: ' + error.message);
    }
  };

  const handleStandardImage = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setDicomMetadata(null);
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
    if (file) {
      const isDicom = file.name.toLowerCase().endsWith('.dcm') ||
        file.type === 'application/dicom' ||
        file.name.toLowerCase().includes('dicom');

      setIsDicomFile(isDicom);
      setImage(file);

      if (isDicom) {
        handleDicomFile(file);
      } else if (file.type.startsWith('image/')) {
        handleStandardImage(file);
      } else {
        setError('Unsupported file format. Please upload a DICOM (.dcm) file or standard image format.');
        return;
      }

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
    setHidePreview(false);
    setSegmentationMask(null);
    setError(null);
    setIsDicomFile(false);
    setDicomMetadata(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const [hidePreview, setHidePreview] = useState(false)
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
      setHidePreview(true)
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

  const [zoomConfig, setZoomConfig] = useState({
    level: 100,
    minZoom: 50,
    maxZoom: 300,
    step: 10
  });

  const [activeToolType, setActiveToolType] = useState('brush'); // 'brush' or 'eraser'
  const [brushConfig, setBrushConfig] = useState({
    size: 10,
    color: '#FFFFFF', // Red for brush
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
    if (segmentationMask && imageRef.current && containerRef.current) {
      const img = imageRef.current;
      if (img.complete) {
        initializeCanvas();
      } else {
        img.onload = () => {
          initializeCanvas();
        };
      }
    }
  }, [segmentationMask]);

  // 2. Add this new useEffect for zoom changes:
  useEffect(() => {
    if (segmentationMask && canvasRef.current) {
      initializeCanvas();
      redrawAnnotations(annotationHistory);
    }
  }, [zoomConfig.level]);

  // Initialize drawing canvas
  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const image = imageRef.current;

    if (!canvas || !container || !image) return;

    // Get container dimensions
    const containerRect = container.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();

    // Set canvas dimensions to match the visible image size
    canvas.width = imageRect.width;
    canvas.height = imageRect.height;

    // Set canvas style to match exactly
    canvas.style.width = `${imageRect.width}px`;
    canvas.style.height = `${imageRect.height}px`;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'auto';

    // Clear the canvas
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Fixed mouse position calculation
  const getMousePosition = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    return { x, y };
  };

  const startDrawing = useCallback((e) => {
    if (!canvasRef.current) return;

    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getMousePosition(e);

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
      ctx.strokeStyle = '#000000';
      ctx.globalCompositeOperation = 'destination-out';
    }

    setCurrentAnnotation({
      points: [{ x, y }],
      brushSize: brushConfig.size,
      color: brushConfig.color,
      tool: activeToolType,
      zoom: zoomConfig.level
    });
  }, [brushConfig, activeToolType, zoomConfig.level]);

  const draw = useCallback((e) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getMousePosition(e);

    ctx.lineTo(x, y);
    ctx.stroke();

    setCurrentAnnotation(prev => {
      if (prev) {
        return {
          ...prev,
          points: [...prev.points, { x, y }]
        };
      }
      return prev;
    });
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;

    setIsDrawing(false);

    if (currentAnnotation) {
      setAnnotationHistory(prev => [...prev, currentAnnotation]);
      setCurrentAnnotation(null);
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.closePath();
    }
  }, [isDrawing, currentAnnotation]);

  const clearAnnotations = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    setAnnotationHistory([]);
  };

  const undoLastAnnotation = () => {
    if (annotationHistory.length === 0 || !canvasRef.current) return;

    setAnnotationHistory(prev => prev.slice(0, -1));

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    redrawAnnotations(annotationHistory.slice(0, -1));
  };

  const redrawAnnotations = (annotations) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    annotations.forEach(annotation => {
      if (annotation.points.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(annotation.points[0].x, annotation.points[0].y);

      ctx.lineWidth = annotation.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (annotation.tool === 'brush') {
        ctx.strokeStyle = annotation.color;
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.strokeStyle = '#000000';
        ctx.globalCompositeOperation = 'destination-out';
      }

      annotation.points.forEach(point => {
        ctx.lineTo(point.x, point.y);
      });

      ctx.stroke();
      ctx.closePath();
    });
  };

  const changeBrushSize = (newSize) => {
    setBrushConfig(prev => ({
      ...prev,
      size: newSize
    }));
  };

  const changeBrushColor = (newColor) => {
    setBrushConfig(prev => ({
      ...prev,
      color: newColor
    }));
  };

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
  const [showStats, setShowStats] = useState(false);

  //saving annotation ------------------------------------------------------------------------------------------

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [notes, setNotes] = useState('');
  const saveAnnotation = async () => {
    // Validation checks
    if (!selectedCategory) {
      setSaveError('Please select a BI-RADS category');
      return;
    }

    if (!selectedLesionType) {
      setSaveError('Please select a lesion type');
      return;
    }
    if (!selectedRegion) {
      setSaveError('Please select a region');
      return;
    }

    if (!preview) {
      setSaveError('No original image available');
      return;
    }

    if (annotationHistory.length === 0) {
      setSaveError('Please create some annotations before saving');
      return;
    }

    if (!currentUser.id) {
      setSaveError('User information not available');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Get canvas annotation as base64
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas not available');
      }

      const annotationBase64 = canvas.toDataURL('image/png');

      // Prepare the data to send
      const annotationData = {
        original_image: preview, // Base64 original image for S3 upload
        annotation_mask: annotationBase64, // Base64 canvas mask for MongoDB storage
        file_name: image.name,
        folder_name: 'mammogram-annotations',
        region: selectedRegion, // Added region field
        birads_category: selectedCategory,
        lesion_type: selectedLesionType,
        annotated_by: currentUser.id || 'anonymous',
        annotator_name: currentUser.name || currentUser.username || 'Anonymous User',
        notes: notes.trim() || null,
        dice_score: Math.random().toFixed(3) // Replace with actual dice score calculation if available
      };

      // Send to backend
      const response = await axios.post(
        'http://127.0.0.1:8000/api/api/mammogram/save_upload',
        annotationData,
        {
          headers: {
            'Content-Type': 'application/json',
          },

        }
      );

      if (response.status === 201) {
        setSaveSuccess(true);

        // Reset form after successful save
        setTimeout(() => {
          setSaveSuccess(false);
          // Optionally reset the form
          // setSelectedCategory('');
          // setSelectedLesionType('');
          // setNotes('');
          // clearAnnotations();
        }, 3000);

        console.log('Annotation saved successfully:', response.data);
      }

    } catch (error) {
      console.error('Error saving annotation:', error);

      if (error.response) {
        // Server responded with error status
        setSaveError(error.response.data?.detail || 'Server error occurred while saving annotation');
      } else if (error.request) {
        // Request was made but no response received
        setSaveError('Unable to connect to server. Please check your connection.');
      } else {
        // Error in request setup
        setSaveError(error.message || 'An unexpected error occurred');
      }

      setSaveSuccess(false);
    } finally {
      setSaving(false);
    }
  };

  // Add this useEffect to get current user info (add this near your other useEffects)
  useEffect(() => {
    // Get current user info - replace this with your actual user management logic
    const getUserInfo = () => {
      // This is a placeholder - replace with your actual user authentication
      const user = {
        id: localStorage.getItem('userId') || 'user_' + Date.now(),
        name: localStorage.getItem('userName') || 'Current User',
        username: localStorage.getItem('username') || 'currentuser'
      };

      setCurrentUser(user);
      setLoading(false);
    };

    getUserInfo();
  }, []);

  return (
    <div className='flex space-x-4 space-y-2'>
      <div className="w-72 sapace-y-2 flex-col  rounded-lg ">
        <div className='bg-white rounded-lg space-y-4 border-gray-300 border mb-2  p-4'>
          <h2 className="text-2xl font-bold mb-4">Annotation Tools</h2>
          <div className="flex items-center space-x-2 mb-4">
            <button
              onClick={handleZoomOut}
              className="px-2 py-1 bg-gray-200 rounded-md hover:bg-gray-300"
              disabled={zoomConfig.level <= zoomConfig.minZoom}
            >
              -
            </button>
            <span className="text-sm font-medium">{zoomConfig.level}%</span>
            <button
              onClick={handleZoomIn}
              className="px-2 py-1 bg-gray-200 rounded-md hover:bg-gray-300"
              disabled={zoomConfig.level >= zoomConfig.maxZoom}
            >
              +
            </button>
            <button
              onClick={handleReset}
              className="px-2 py-1 bg-gray-200 rounded-md hover:bg-gray-300 text-xs"
            >
              Reset
            </button>
          </div>
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
              <p className="text-gray-600 mb-2">Region :</p>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full bg-gray-100 p-2 rounded-md border border-gray-300"
              >
                {moroccanRegions.map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>

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


          </div>
        </div>

      </div>
      <div className="w-full bg-white h-auto rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Mammogram Segmentation Tool</h2>


        {hidePreview ? (
          <>
          </>

        ) : (
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
              accept="image/*,.dcm,application/dicom"
            />
            {preview ? (
              <div className="relative w-full h-full">

                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />

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
                <p className="text-xs text-gray-400 mt-2">DICOM (.dcm), PNG, JPG up to 10MB</p>
              </>
            )}
          </div>
        )}




        {image && (


          <div className="mt-4">
            {!segmentationMask && (
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
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                {error}
              </div>
            )}



            {segmentationMask && (
              <div className="mt-6 w-full">
                <div className='flex w-full space-x-2 px-4 justify-between'>
                  <h3 className="text-lg font-medium mb-2">Segmentation Result</h3>
                  <button
                    onClick={removeImage}
                    className="bg-green-500 text-white rounded-lg p-2 flex items-center"
                  >
                    + New Segmentation
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 p-4">
                  {/* originale Image */}
                  <div className="border border-gray-300 bg-black rounded-lg overflow-hidden relative">
                    <div className="bg-gray-200 p-2 text-center font-semibold">
                      Original Image (Draw Annotations)
                    </div>
                    <div
                      ref={containerRef}
                      className="w-full h-96 flex items-center justify-center overflow-auto relative bg-black"
                      style={{
                        maxHeight: '24rem',
                        overflow: 'auto'
                      }}
                    >
                      <div className="relative" style={{
                        transform: `scale(${zoomConfig.level / 100})`,
                        transformOrigin: 'center center'
                      }}>
                        <img
                          ref={imageRef}
                          src={preview}
                          alt="Original Mammogram"
                          className="block max-w-full max-h-full object-contain"
                          onLoad={initializeCanvas}
                        />
                        <canvas
                          ref={canvasRef}
                          className="absolute top-0 left-0 cursor-crosshair"
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                        />
                      </div>
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
    </div >
  );
};

export default ImageUploader;