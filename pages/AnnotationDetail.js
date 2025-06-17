import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from "next/router";
import Layout from '@/components/Layout';
import { FileText, Calendar, User, Stethoscope, ClipboardList, CheckCircle, X } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AnnotationDetail = () => {
    const router = useRouter();
    const { id } = router.query;

    const [annotation, setAnnotation] = useState(null);
    const [imageStats, setImageStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [statsError, setStatsError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedLesionType, setSelectedLesionType] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [showOriginal, setShowOriginal] = useState(true); // Toggle between original and annotated
    const [showStats, setShowStats] = useState(false); // Toggle for showing/hiding stats
    const [maskLoading, setMaskLoading] = useState(false);

    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [segmentationMask, setSegmentationMask] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const fileInputRef = useRef(null);

    const [selectedRegion, setSelectedRegion] = useState('');
    const [currentUser, setCurrentUser] = useState({});

    const [isDicomFile, setIsDicomFile] = useState(false);
    const [dicomMetadata, setDicomMetadata] = useState(null);
    // Add these state variables at the top with other useState declarations
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportData, setReportData] = useState({
        patientName: '',
        patientAge: '',
        examDate: '',
        technique: 'Examen réalisé avec incidence de face, profil et oblique.',
        clinicalFindings: '',
        conclusion: '',
        doctorName: ''
    });

    // Add this function before the exportToPDF function
    const handleReportDataChange = (e) => {
        const { name, value } = e.target;
        setReportData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Modify the exportToPDF function to use the modal
    const handleExportPDF = () => {
        setShowReportModal(true);
    };

    useEffect(() => {
        fetchAnnotationDetail();
    }, [id]);

    // Fetch annotation details
    const fetchAnnotationDetail = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://127.0.0.1:8000/api/api/annotations/${id}`);
            setAnnotation(response.data);
            setSelectedCategory(response.data.birads_category)
            setSelectedLesionType(response.data.lesion_type)
            setNotes(response.data.notes)

            // After fetching annotation, fetch image stats
            if (response.data && response.data.image_id) {
                fetchImageStats(response.data.image_id);

            }

            setError(null);
        } catch (err) {
            console.error('Failed to fetch annotation detail:', err);
            setError('Failed to load annotation details. The annotation may not exist or has been deleted.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (annotation) {
            const fetchmask = async () => {
                try {
                    setMaskLoading(true); // Start loading
                    // Use the new AWS path segmentation endpoint with query parameters
                    const response = await fetch(`http://127.0.0.1:8000/api/segment-from-aws-path?aws_path=${encodeURIComponent(annotation.image_path)}&return_format=image`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    if (!response.ok) {
                        try {
                            const errorData = await response.json();
                            const errorMessage = errorData.detail || errorData.message || 'Failed to process image';
                            throw new Error(errorMessage);
                        } catch (jsonError) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                    }

                    const blob = await response.blob();
                    const reader = new FileReader();
                    reader.onload = () => {
                        setSegmentationMask(reader.result);
                        setMaskLoading(false); // End loading
                    };
                    reader.readAsDataURL(blob);

                } catch (err) {
                    setError(err.message || 'An error occurred while processing the image');
                    console.error('Error processing image:', err);
                    setMaskLoading(false); // End loading even on error
                }
            }
            fetchmask()
        }
    }, [annotation]);


    // Fetch image statistics
    const fetchImageStats = async (imageId) => {
        try {
            setLoadingStats(true);
            setStatsError(null);
            const response = await axios.get(`http://127.0.0.1:8000/api/api/annotations/stats/image/${imageId}`);
            setImageStats(response.data);
        } catch (err) {
            console.error('Failed to fetch image statistics:', err);
            setStatsError('Failed to load image statistics');
        } finally {
            setLoadingStats(false);
        }
    };

    const UpdateAnnotation = async () => {
        // Reset previous save state
        setSaveSuccess(false);
        setSaveError(null);

        // Validate inputs
        if (!selectedCategory) {
            setSaveError('Please select a BI-RADS category');
            return;
        }

        if (!selectedLesionType) {
            setSaveError('Please select a lesion type');
            return;
        }

        try {
            // Start saving process
            setSaving(true);

            // Prepare update payload
            const updatePayload = {
                birads_category: selectedCategory,
                lesion_type: selectedLesionType,
                notes: notes
            };

            // Send update request
            const response = await axios.put(
                `http://127.0.0.1:8000/api/api/updateAnnotations/${id}`,
                updatePayload
            );

            // Update local state with response
            setAnnotation(response.data.annotation);

            // Refresh image stats after updating annotation
            if (response.data.annotation && response.data.annotation.image_id) {
                fetchImageStats(response.data.annotation.image_id);
            }

            // Show success state
            setSaveSuccess(true);

            // Reset success state after 3 seconds
            setTimeout(() => {
                setSaveSuccess(false);
            }, 3000);

        } catch (err) {
            // Handle error
            console.error('Failed to update annotation:', err);
            setSaveError(
                err.response?.data?.detail ||
                'Failed to update annotation. Please try again.'
            );
        } finally {
            // Always reset saving state
            setSaving(false);
        }
    };

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
    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get badge color for BI-RADS category
    const getBiRadsBadgeColor = (category) => {
        const colors = {
            '0': 'bg-gray-500',
            '1': 'bg-green-500',
            '2': 'bg-green-400',
            '3': 'bg-yellow-500',
            '4': 'bg-orange-500',
            '5': 'bg-red-500',
            '6': 'bg-red-600',
        };
        return colors[category] || 'bg-blue-500';
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


    // drawing ccanvas --------------------------------------------------------------------------------------------------
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


    // export pdf repport ------------------------------------------------------------------------------------
    const exportToPDF = async () => {
        try {
            // Show loading state
            const exportButton = document.querySelector('[data-export-button]');
            const originalText = exportButton?.textContent;
            if (exportButton) {
                exportButton.textContent = 'Generating PDF...';
                exportButton.disabled = true;
            }

            const pdf = new jsPDF('p', 'pt', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 40;
            const contentWidth = pageWidth - 2 * margin;
            let yPosition = margin;

            const checkPageBreak = (requiredHeight) => {
                if (yPosition + requiredHeight > pageHeight - margin) {
                    pdf.addPage();
                    yPosition = margin;
                    return true;
                }
                return false;
            };

            const addWrappedText = (text, x, y, maxWidth, fontSize = 12, fontStyle = 'normal') => {
                pdf.setFontSize(fontSize);
                pdf.setFont('helvetica', fontStyle);
                const lines = pdf.splitTextToSize(text, maxWidth);
                pdf.text(lines, x, y);
                return lines.length * (fontSize + 2);
            };

            // 1. Header Section
            pdf.setFillColor(55, 65, 81);
            pdf.rect(0, 0, pageWidth, 80, 'F');

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(24);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Mammography Annotation Report', margin, 35);

            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Generated on: ${new Date().toLocaleString()}`, margin, 60);

            yPosition = 100;
            yPosition += 40;
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('INFORMATIONS DU PATIENT', margin, yPosition);
            yPosition += 20;

            const patientInfo = [
                ['Nom du patient:', reportData.patientName],
                ['Âge:', `${reportData.patientAge} ans`],
                ['Date d\'examen:', new Date(reportData.examDate).toLocaleDateString()],
            ];

            patientInfo.forEach(([label, value]) => {
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(10);
                pdf.text(label, margin, yPosition);
                pdf.setFont('helvetica', 'normal');
                pdf.text(value, margin + 100, yPosition);
                yPosition += 15;
            });

            // Technique Section
            yPosition += 10;
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(12);
            pdf.text('TECHNIQUE', margin, yPosition);
            yPosition += 15;
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            addWrappedText(reportData.technique, margin, yPosition, contentWidth - margin);
            yPosition += 30;

            // Clinical Findings Section
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(12);
            pdf.text('RÉSULTATS', margin, yPosition);
            yPosition += 15;
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            addWrappedText(reportData.clinicalFindings, margin, yPosition, contentWidth - margin);
            yPosition += 30;

            // Conclusion Section
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(12);
            pdf.text('CONCLUSION', margin, yPosition);
            yPosition += 15;
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            addWrappedText(reportData.conclusion, margin, yPosition, contentWidth - margin);
            yPosition += 30;

            // Doctor's Signature
            pdf.setFont('helvetica', 'bold');
            pdf.text('Médecin:', margin, yPosition);
            pdf.setFont('helvetica', 'normal');
            pdf.text(reportData.doctorName, margin + 50, yPosition);

            // 2. Basic Information Section
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Annotation Information', margin, yPosition);
            yPosition += 25;

            const infoData = [
                ['Annotation ID', annotation._id?.substring(0, 10) || 'N/A'],
                ['File Name', annotation.file_name || 'N/A'],
                ['Annotator', annotation.annotator_name || 'N/A'],
                ['Annotation Date', new Date(annotation.annotation_date).toLocaleDateString()],
                ['BI-RADS Category', getBiRadsCategoryLabel(annotation.birads_category)],
                ['Lesion Type', getLesionTypeLabel(annotation.lesion_type)],
                ['Notes', annotation.notes || 'No notes provided']
            ];

            const tableStartY = yPosition;
            const rowHeight = 20;

            infoData.forEach((row, index) => {
                const currentY = tableStartY + (index * rowHeight);
                checkPageBreak(rowHeight);

                if (index % 2 === 0) {
                    pdf.setFillColor(249, 250, 251);
                    pdf.rect(margin, currentY - 15, contentWidth, rowHeight, 'F');
                }

                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(10);
                pdf.text(row[0] + ':', margin + 10, currentY);

                pdf.setFont('helvetica', 'normal');
                const textHeight = addWrappedText(row[1], margin + 150, currentY, contentWidth - 160, 10);

                if (index === infoData.length - 1) {
                    yPosition = currentY + Math.max(rowHeight, textHeight);
                }
            });

            yPosition += 25;

            // 3. Statistics Section
            if (imageStats && showStats) {
                checkPageBreak(80);

                pdf.setFontSize(16);
                pdf.setFont('helvetica', 'bold');
                pdf.text('Image Statistics', margin, yPosition);
                yPosition += 20;

                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'bold');
                pdf.text('Overview', margin, yPosition);
                yPosition += 15;

                const overviewData = [
                    ['Total Annotations', imageStats.total_annotations?.toString() || '0'],
                    ['Unique Annotators', imageStats.unique_annotators?.toString() || '0']
                ];

                overviewData.forEach((row) => {
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(10);
                    pdf.text(`${row[0]}: ${row[1]}`, margin + 20, yPosition);
                    yPosition += 14;
                });

                yPosition += 8;

                if (imageStats.birads_distribution?.length > 0) {
                    checkPageBreak(100);

                    pdf.setFontSize(12);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('BI-RADS Distribution', margin, yPosition);
                    yPosition += 18;

                    imageStats.birads_distribution.forEach((birads) => {
                        pdf.setFont('helvetica', 'normal');
                        pdf.setFontSize(9);
                        pdf.text(`BI-RADS ${birads.category}: ${birads.percentage}%`, margin + 20, yPosition);

                        const barWidth = (birads.percentage / 100) * 150;
                        pdf.setFillColor(59, 130, 246);
                        pdf.rect(margin + 150, yPosition - 8, barWidth, 6, 'F');

                        yPosition += 15;
                    });
                }

                yPosition += 10;

                if (imageStats.lesion_distribution?.length > 0) {
                    checkPageBreak(100);

                    pdf.setFontSize(12);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Lesion Type Distribution', margin, yPosition);
                    yPosition += 18;

                    imageStats.lesion_distribution.forEach((lesion) => {
                        pdf.setFont('helvetica', 'normal');
                        pdf.setFontSize(9);
                        const lesionLabel = getLesionTypeLabel(lesion.lesion_type);
                        pdf.text(`${lesionLabel}: ${lesion.percentage}%`, margin + 20, yPosition);

                        const barWidth = (lesion.percentage / 100) * 120;
                        pdf.setFillColor(139, 92, 246);
                        pdf.rect(margin + 180, yPosition - 8, barWidth, 6, 'F');

                        yPosition += 15;
                    });
                }
            }

            // 4. Images Section - Modified for Grid Layout
            yPosition += 20;

            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Images', margin, yPosition);
            yPosition += 25;

            // Modified function to get image data
            const getImageData = async (imageElement, imageUrl = null) => {
                if (!imageElement && !imageUrl) return null;

                try {
                    let imgData;

                    if (imageUrl) {
                        try {
                            const proxyResponse = await fetch(`http://127.0.0.1:8000/api/api/get-image-for-pdf`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ image_url: imageUrl })
                            });

                            if (proxyResponse.ok) {
                                const blob = await proxyResponse.blob();
                                const dataUrl = await new Promise((resolve) => {
                                    const reader = new FileReader();
                                    reader.onload = () => resolve(reader.result);
                                    reader.readAsDataURL(blob);
                                });

                                const canvas = document.createElement('canvas');
                                const ctx = canvas.getContext('2d');
                                const img = new Image();

                                await new Promise((resolve, reject) => {
                                    img.onload = () => {
                                        canvas.width = img.naturalWidth;
                                        canvas.height = img.naturalHeight;
                                        ctx.drawImage(img, 0, 0);
                                        resolve();
                                    };
                                    img.onerror = reject;
                                    img.src = dataUrl;
                                });

                                imgData = canvas.toDataURL('image/jpeg', 0.8);
                            } else {
                                throw new Error(`Backend proxy failed with status: ${proxyResponse.status}`);
                            }
                        } catch (error) {
                            console.error(`Error using backend proxy for ${imageUrl}:`, error);
                            if (imageElement) {
                                const canvasFallback = await html2canvas(imageElement, {
                                    backgroundColor: '#000000',
                                    scale: 1,
                                    useCORS: true,
                                    allowTaint: true
                                });
                                imgData = canvasFallback.toDataURL('image/jpeg', 0.8);
                            } else {
                                throw error;
                            }
                        }
                    } else {
                        const canvas = await html2canvas(imageElement, {
                            backgroundColor: '#000000',
                            scale: 1,
                            useCORS: true,
                            allowTaint: true
                        });
                        imgData = canvas.toDataURL('image/jpeg', 0.8);
                    }

                    return imgData;
                } catch (error) {
                    console.error('Error getting image data:', error);
                    return null;
                }
            };

            // Collect all images
            const images = [];

            const originalImage = document.querySelector('img[alt="Original Mammogram"]');
            if (originalImage) {
                const imgData = await getImageData(originalImage, annotation.image_path);
                if (imgData) {
                    images.push({ title: 'Original Mammogram', data: imgData });
                }
            }

            const predictedMask = document.querySelector('img[alt="Predicted Mask"]');
            if (predictedMask) {
                const imgData = await getImageData(predictedMask);
                if (imgData) {
                    images.push({ title: 'Predicted Segmentation', data: imgData });
                }
            }

            const annotatedMask = document.querySelector('img[alt="Annotated Mask"]');
            if (annotatedMask) {
                const imgData = await getImageData(annotatedMask);
                if (imgData) {
                    images.push({ title: 'Annotated Mask', data: imgData });
                }
            }

            // Add images in a 3-column grid
            if (images.length > 0) {
                // Calculate grid dimensions
                const gridCols = 3;
                const imageSpacing = 8;
                const imageWidth = (contentWidth - (gridCols - 1) * imageSpacing) / gridCols;
                const imageHeight = imageWidth;// Smaller aspect ratio to fit better

                // Check if we need a new page for the grid
                const totalGridHeight = imageHeight + 40; // Height + space for titles
                checkPageBreak(totalGridHeight);

                const startY = yPosition;

                // Add images in grid layout
                for (let i = 0; i < images.length; i++) {
                    const col = i % gridCols;
                    const xPosition = margin + col * (imageWidth + imageSpacing);

                    // Add title above each image
                    pdf.setFontSize(9);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(images[i].title, xPosition, startY);

                    // Add image
                    try {
                        pdf.addImage(
                            images[i].data,
                            'JPEG',
                            xPosition,
                            startY + 15,
                            imageWidth,
                            imageHeight
                        );
                    } catch (error) {
                        console.error(`Error adding ${images[i].title} to PDF:`, error);
                        // Add placeholder text if image fails
                        pdf.setFontSize(7);
                        pdf.setFont('helvetica', 'italic');
                        pdf.text('Image could not be loaded', xPosition, startY + imageHeight / 2);
                    }
                }

                yPosition = startY + imageHeight + 25;
            } else {
                // No images found
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'italic');
                pdf.text('No images available for display', margin, yPosition);
                yPosition += 30;
            }

            // 5. Footer
            const totalPages = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(10);
                pdf.setTextColor(128, 128, 128);
                pdf.text(
                    `Page ${i} of ${totalPages} - Mammography Annotation Report`,
                    margin,
                    pageHeight - 20
                );
                pdf.text(
                    `Generated by Annotation System - ${new Date().toLocaleDateString()}`,
                    pageWidth - margin - 200,
                    pageHeight - 20
                );
            }

            const filename = `annotation_report_${annotation._id?.substring(0, 10) || 'unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;

            pdf.save(filename);

            if (exportButton) {
                exportButton.textContent = '✓ PDF Generated!';
                exportButton.style.backgroundColor = '#10B981';
                setTimeout(() => {
                    exportButton.textContent = originalText;
                    exportButton.style.backgroundColor = '';
                    exportButton.disabled = false;
                }, 3000);
            }

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF report. Please try again.');

            const exportButton = document.querySelector('[data-export-button]');
            if (exportButton) {
                exportButton.textContent = 'Export PDF';
                exportButton.disabled = false;
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto max-w-4xl p-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <h2 className="text-xl font-bold mb-2">Error</h2>
                    <p>{error}</p>
                    <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!annotation) {
        return null;
    }
    const ReportModal = () => {
       
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Rapport d'Examen</h2>
                                    <p className="text-blue-100 text-sm">Générer un rapport médical complet</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 overflow-y-auto max-h-[calc(95vh-200px)]">
                        <div className="space-y-8">
                            {/* Patient Information Section */}
                            <div>
                                <div className="flex items-center space-x-2 mb-6">
                                    <User className="w-5 h-5 text-blue-600" />
                                    <h3 className="text-lg font-semibold text-gray-800">Informations Patient</h3>
                                    <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nom complet du patient
                                        </label>
                                        <input
                                            type="text"
                                            name="patientName"
                                            value={reportData.patientName}
                                            onChange={handleReportDataChange}
                                            placeholder="Entrez le nom complet"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Âge
                                        </label>
                                        <input
                                            type="number"
                                            name="patientAge"
                                            value={reportData.patientAge}
                                            onChange={handleReportDataChange}
                                            placeholder="0"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Examination Details Section */}
                            <div>
                                <div className="flex items-center space-x-2 mb-6">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    <h3 className="text-lg font-semibold text-gray-800">Détails de l'Examen</h3>
                                    <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Date d'examen
                                        </label>
                                        <input
                                            type="date"
                                            name="examDate"
                                            value={reportData.examDate}
                                            onChange={handleReportDataChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nom du médecin
                                        </label>
                                        <input
                                            type="text"
                                            name="doctorName"
                                            value={reportData.doctorName}
                                            onChange={handleReportDataChange}
                                            placeholder="Dr. Nom du médecin"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Technical Information Section */}
                            <div>
                                <div className="flex items-center space-x-2 mb-6">
                                    <Stethoscope className="w-5 h-5 text-blue-600" />
                                    <h3 className="text-lg font-semibold text-gray-800">Technique Employée</h3>
                                    <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description de la technique
                                    </label>
                                    <textarea
                                        name="technique"
                                        value={reportData.technique}
                                        onChange={handleReportDataChange}
                                        rows="3"
                                        placeholder="Décrivez la technique utilisée pour l'examen..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none resize-none"
                                    />
                                </div>
                            </div>

                            {/* Clinical Findings Section */}
                            <div>
                                <div className="flex items-center space-x-2 mb-6">
                                    <ClipboardList className="w-5 h-5 text-blue-600" />
                                    <h3 className="text-lg font-semibold text-gray-800">Résultats Cliniques</h3>
                                    <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Observations et résultats détaillés
                                    </label>
                                    <textarea
                                        name="clinicalFindings"
                                        value={reportData.clinicalFindings}
                                        onChange={handleReportDataChange}
                                        rows="5"
                                        placeholder="Décrivez les observations et résultats de l'examen..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none resize-none"
                                    />
                                </div>
                            </div>

                            {/* Conclusion Section */}
                            <div>
                                <div className="flex items-center space-x-2 mb-6">
                                    <CheckCircle className="w-5 h-5 text-blue-600" />
                                    <h3 className="text-lg font-semibold text-gray-800">Conclusion</h3>
                                    <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Diagnostic et recommandations
                                    </label>
                                    <textarea
                                        name="conclusion"
                                        value={reportData.conclusion}
                                        onChange={handleReportDataChange}
                                        rows="3"
                                        placeholder="Résumez le diagnostic et les recommandations..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all font-medium"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => {
                                    setShowReportModal(false);
                                    exportToPDF();
                                }}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg hover:shadow-xl flex items-center space-x-2"
                            >
                                <FileText className="w-4 h-4" />
                                <span>Générer PDF</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Layout>
            {showReportModal && <ReportModal />}
            <div className='flex space-x-4'>
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
                                onClick={UpdateAnnotation}
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
                                    'Update'
                                )}
                            </button>

                            {saveError && (
                                <div className="text-red-500 text-center p-2 bg-red-50 rounded-md">
                                    {saveError}
                                </div>
                            )}



                        </div>
                    </div>


                </div>
                <div className="container mx-auto max-w-6xl p-4 bg-gray-50 min-h-screen">
                    {/* Header */}
                    <div className="mb-6 flex justify-between items-center">
                        <a href='/MyAnnotationHistory' className='hover:cursor-pointer'>
                            <button className="flex items-center text-blue-600 hover:text-blue-800">
                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back to History
                            </button>
                        </a>
                        <div className="flex items-center space-x-2">
                            <button
                                className={`px-4 py-2 border ${showStats ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'} rounded hover:bg-blue-600 hover:text-white`}
                                onClick={() => setShowStats(!showStats)}
                            >
                                {showStats ? 'Hide Statistics' : 'Show Statistics'}
                            </button>

                            <button
                                data-export-button
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center space-x-2"
                                onClick={handleExportPDF}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Export PDF</span>
                            </button>


                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        {/* Title Bar */}
                        <div className="bg-gray-800 text-white p-6">
                            <div className="flex justify-between items-center">
                                <h1 className="text-2xl font-bold">
                                    Annotation Details
                                </h1>
                                <div className={`${getBiRadsBadgeColor(annotation.birads_category)} px-4 py-2 rounded-full font-semibold`}>
                                    BI-RADS {annotation.birads_category}
                                </div>
                            </div>
                        </div>

                        {/* Image Metadata */}
                        <div className="grid grid-cols-4 gap-4 mt-3 text-sm bg-white p-3 rounded-md shadow-sm">
                            <div>
                                <span className="font-semibold text-gray-700">ID:</span>
                                <span className="ml-2 text-gray-600">{annotation._id.substring(0, 10)}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">File Name:</span>
                                <span className="ml-2 text-gray-600">{annotation.file_name}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Annotaded By:</span>
                                <span className="ml-2 text-gray-600">{annotation.annotator_name}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Upload Date:</span>
                                <span className="ml-2 text-gray-600">
                                    {new Date(annotation.annotation_date).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {/* Stats Section */}
                        {showStats && (
                            <div className="p-6 border-b border-gray-200">
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

                        <div className="flex w-full">
                            {/* Image Section */}


                            {segmentationMask ? (
                                <div className="mt-6 w-full">

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
                                                        src={annotation.image_path}
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
                                        {/* Predicted Mask */}
                                        <div className=" bg-black border border-gray-300 rounded-lg overflow-hidden">
                                            <div className="bg-gray-200 p-2 text-center font-semibold">
                                                Predicted Mask 
                                            </div>
                                            <div
                                                className="w-full h-96 flex items-center justify-center overflow-auto"
                                                style={{
                                                    maxHeight: '24rem',
                                                    overflow: 'auto'
                                                }}
                                            >
                                                {maskLoading ? (
                                                    <div className="flex flex-col items-center justify-center text-white">
                                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
                                                        <p className="text-sm">Generating segmentation mask...</p>
                                                    </div>
                                                ) : segmentationMask ? (
                                                    <img
                                                        src={segmentationMask}
                                                        alt="Predicted Mask"
                                                        className="w-full h-full object-contain"
                                                    />
                                                ) : (
                                                    <div className="text-white text-center">
                                                        <p>No mask available</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>



                                        {/* Overlay Mask */}
                                        {annotation.annotation_base64 ? (
                                            <div className="border border-gray-300 bg-black rounded-lg overflow-hidden">
                                                <div className="bg-gray-200 p-2 text-center font-semibold">
                                                    Annotaded Mask
                                                </div>
                                                <div className="w-full h-auto flex items-center justify-center overflow-auto">
                                                    <img
                                                        src={`data:image/png;base64,${annotation.annotation_base64}`}
                                                        alt="Annotated Mask"
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-white">No annotation image available</div>
                                        )}
                                    </div>


                                </div>

                            ) : (
                                <div className="flex w-full justify-center items-center h-screen">
                                    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-blue-500"></div>
                                </div>
                            )}

                            {/* Annotation information */}

                        </div>
                    </div>
                </div>
            </div>
        </Layout >
    );
};

export default AnnotationDetail;