import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import Link from 'next/link';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const UserAnnotationHistory = () => {
    const [currentUser, setCurrentUser] = useState({});

    const [userId, setUserId] = useState('');
    useEffect(() => {
        const userDataString = localStorage.getItem("userData");

        const userData = JSON.parse(userDataString)
        setCurrentUser(userData)
        setUserId(userData._id)

    }, [])
    const [annotations, setAnnotations] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        birads_category: '',
        lesion_type: '',
        date_range: '7' // last 7 days by default
    });

    // For pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 12;

    useEffect(() => {
        console.log("userdataaaa :", userId)
        if (userId) {
            fetchAnnotationHistory();
            fetchAnnotationStats();
        }


    }, [userId, filters, currentPage]);

    const fetchAnnotationHistory = async () => {
        try {
            setLoading(true);

            // Calculate date filters
            let startDate = null;
            if (filters.date_range) {
                const days = parseInt(filters.date_range);
                if (!isNaN(days)) {
                    startDate = new Date();
                    startDate.setDate(startDate.getDate() - days);
                    startDate = startDate.toISOString();
                }
            }

            const response = await axios.get(`http://127.0.0.1:8000/api/api/annotations/user/${userId}`, {
                params: {
                    skip: (currentPage - 1) * itemsPerPage,
                    limit: itemsPerPage,
                    birads_category: filters.birads_category || undefined,
                    lesion_type: filters.lesion_type || undefined,
                    start_date: startDate || undefined
                }
            });

            setAnnotations(response.data);
            setTotalItems(response.headers['x-total-count'] || annotations.length); // Assuming backend sends total count header
            setError(null);
        } catch (err) {
            console.error('Failed to fetch annotation history:', err);
            setError('Failed to load annotation history');
        } finally {
            setLoading(false);
        }
    };

    const fetchAnnotationStats = async () => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/api/annotations/stats/user/${userId}`);
            setStats(response.data);
        } catch (err) {
            console.error('Failed to fetch annotation stats:', err);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        setCurrentPage(1); // Reset to first page when filters change
    };

    // Calculate total pages
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
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

    // Prepare chart data if stats are available
    const activityChartData = stats?.daily_activity ? {
        labels: stats.daily_activity.map(day => day._id),
        datasets: [
            {
                label: 'Annotations',
                data: stats.daily_activity.map(day => day.count),
                fill: false,
                backgroundColor: 'rgb(59, 130, 246)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
            }
        ]
    } : null;

    // Sort options
    const sortOptions = [
        { value: 'recent', label: 'Most Recent' },
        { value: 'birads', label: 'BI-RADS Category' },
        { value: 'lesion', label: 'Lesion Type' }
    ];

    return (
        <div className="container mx-auto p-4 max-w-7xl">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Your Annotation History</h1>

            {/* Stats Summary Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Total Annotations</h3>
                        <p className="text-4xl font-bold text-blue-600">{stats.total_annotations}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">BI-RADS Distribution</h3>
                        <div className="flex justify-around">
                            {stats.birads_distribution.map(item => (
                                <div key={item._id} className="text-center">
                                    <div className={`${getBiRadsBadgeColor(item._id)} text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto`}>
                                        {item._id}
                                    </div>
                                    <p className="mt-1 text-sm">{item.count}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Activity</h3>
                        {activityChartData && (
                            <div className="h-32">
                                <Line
                                    data={activityChartData}
                                    options={{
                                        maintainAspectRatio: false,
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                ticks: {
                                                    precision: 0
                                                }
                                            }
                                        },
                                        plugins: {
                                            legend: {
                                                display: false
                                            }
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                        <select
                            name="date_range"
                            value={filters.date_range}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 p-2"
                        >
                            <option value="">All Time</option>
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                            <option value="90">Last 3 Months</option>
                            <option value="180">Last 6 Months</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">BI-RADS Category</label>
                        <select
                            name="birads_category"
                            value={filters.birads_category}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 p-2"
                        >
                            <option value="">All Categories</option>
                            <option value="0">0 - Incomplete</option>
                            <option value="1">1 - Negative</option>
                            <option value="2">2 - Benign Finding</option>
                            <option value="3">3 - Probably Benign</option>
                            <option value="4">4 - Suspicious</option>
                            <option value="5">5 - Highly Suspicious</option>
                            <option value="6">6 - Known Malignancy</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lesion Type</label>
                        <select
                            name="lesion_type"
                            value={filters.lesion_type}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 p-2"
                        >
                            <option value="">All Types</option>
                            <option value="mass">Mass</option>
                            <option value="calcification">Calcification</option>
                            <option value="architectural-distortion">Architectural Distortion</option>
                            <option value="asymmetry">Asymmetry</option>
                            <option value="focal-asymmetry">Focal Asymmetry</option>
                            <option value="suspicious-lymph-node">Suspicious Lymph Node</option>
                            <option value="skin-lesion">Skin Lesion</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                        <select
                            name="sort"
                            value={filters.sort}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 p-2"
                        >
                            {sortOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            {/* Annotation Cards Grid */}
            {!loading && annotations.length === 0 ? (
                <div className="bg-gray-50 p-12 text-center rounded-lg border border-gray-200">
                    <p className="text-xl text-gray-500">No annotations found matching your criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {annotations.map(annotation => (
                        <div key={annotation._id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                            {/* Card Header with Image Preview */}
                            <div className="h-48 bg-gray-100 relative overflow-hidden">
                                {annotation.image_path ? (
                                    <img
                                        src={annotation.image_path}
                                        alt="Annotation"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-gray-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}

                                {/* BI-RADS Badge */}
                                <div className={`absolute top-2 right-2 ${getBiRadsBadgeColor(annotation.birads_category)} text-white text-sm font-bold px-3 py-1 rounded-full`}>
                                    BI-RADS {annotation.birads_category}
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-gray-800 truncate">
                                        {annotation.file_name || 'Unnamed Image'}
                                    </h3>
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                        {annotation.lesion_type || 'Unspecified'}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-600 mb-3 line-clamp-2 h-10">
                                    {annotation.notes || 'No additional notes provided.'}
                                </p>

                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <div>
                                        {formatDate(annotation.annotation_date)}
                                    </div>
                                    <div>
                                        {annotation.folder_name || 'Unknown folder'}
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-xs text-gray-500">
                                    ID: {annotation._id.substring(0, 8)}...
                                </span>
                                <Link
                                    href={{
                                        pathname: "/AnnotationDetail",
                                        query: { id: annotation._id }
                                    }}
                                >
                                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                        View Details
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                    <nav className="inline-flex rounded-md shadow">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-l-md border ${currentPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Previous
                        </button>

                        {/* Page numbers - show up to 5 pages */}
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            // Calculate which page numbers to show
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            return (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`px-4 py-2 border-t border-b ${currentPage === pageNum
                                        ? 'bg-blue-50 border-blue-500 text-blue-600 font-medium'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                        } ${i === 0 ? '' : 'border-l'}`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 rounded-r-md border ${currentPage === totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Next
                        </button>
                    </nav>
                </div>
            )}
        </div>
    );
};

export default UserAnnotationHistory;