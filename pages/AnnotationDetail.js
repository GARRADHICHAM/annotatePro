import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from "next/router";
import Layout from '@/components/Layout';

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

    return (
        <Layout>
            <div className="container mx-auto max-w-6xl p-4 bg-gray-50 min-h-screen">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <button className="flex items-center text-blue-600 hover:text-blue-800">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to History
                    </button>

                    <div className="flex items-center space-x-2">
                        <button 
                            className={`px-4 py-2 border ${showStats ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'} rounded hover:bg-blue-600 hover:text-white`}
                            onClick={() => setShowStats(!showStats)}
                        >
                            {showStats ? 'Hide Statistics' : 'Show Statistics'}
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50">
                            Export
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50">
                            Print
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                        {/* Image Section */}
                        <div className="space-y-4">
                            <div className="bg-gray-100 rounded-lg overflow-hidden shadow-inner relative">
                                {/* Image Display */}
                                <div className="grid grid-cols-2 gap-4 p-4 items-center justify-center">
                                    <div className="border border-gray-300 bg-black rounded-lg overflow-hidden">
                                        <div className="bg-gray-200 p-2 text-center font-semibold">
                                            Original Image
                                        </div>
                                        <div className="w-full h-auto flex items-center justify-center overflow-auto">
                                            <img
                                                src={annotation.image_path}
                                                alt="Original Image"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    </div>
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
                        </div>

                        {/* Annotation information */}
                        <div>
                            <div className="space-y-4">
                                <div>
                                    <p className="font-bold mb-2">Lesion Type:</p>
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
                                    <p className="font-bold mb-2">BI-RADS Rating:</p>
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

                                <div>
                                    <p className="font-bold mb-2">Notes:</p>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full bg-gray-100 p-2 rounded-md border border-gray-300 h-24"
                                        placeholder="Add any additional findings or notes here..."
                                    />
                                </div>

                                <button
                                    className={`w-full py-3 rounded-md flex items-center justify-center ${
                                        saving ? 'bg-gray-400' : saveSuccess ? 'bg-green-500' : 'bg-green-500 hover:bg-green-600'
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
                </div>
            </div>
        </Layout>
    );
};

export default AnnotationDetail;