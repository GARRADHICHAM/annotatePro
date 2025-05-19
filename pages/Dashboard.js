// pages/dashboard.js
import { useState, useEffect } from 'react';
import { Bar, Pie, Line } from 'recharts';
import Layout from '../components/Layout';
import { 
    BarChart, 
    PieChart, 
    LineChart, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    Cell // Added the missing Cell import
  } from 'recharts';
import { Database, FileImage, BarChart2, Award, Info } from 'lucide-react';

export default function Dashboard() {
    const [dbStats, setDbStats] = useState({
        totalImages: 0,
        totalSizeGB: 0,
        biRadsDistribution: [],
        modelMetrics: {
            accuracy: 0.95,
            sensitivity: 0.83,
            specificity: 0.89,
            diceScore: 0.80,
            auc: 0.91
        }
    });

    // Simulating data fetch - in a real app, this would call your FastAPI endpoint
    useEffect(() => {
        const fetchData = async () => {
            try {
                // In actual implementation: const response = await fetch('/api/stats');
                // const data = await response.json();

                // Simulated data based on your MongoDB example
                const data = {
                    totalImages: 635,
                    totalSizeGB: 12,
                    biRadsDistribution: [
                        { name: 'BI-RADS 1', value: 212, color: '#22c55e' },
                        { name: 'BI-RADS 2', value: 201, color: '#3b82f6' },
                        { name: 'BI-RADS 3', value: 43, color: '#eab308' },
                        { name: 'BI-RADS 4', value: 52, color: '#f97316' },
                        { name: 'BI-RADS 5', value: 41, color: '#ef4444' },
                    ],
                    modelMetrics: {
                        accuracy: 0.95,
                        sensitivity: 0.83,
                        specificity: 0.89,
                        diceScore: 0.80,
                        auc: 0.91
                    }
                };

                setDbStats(data);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            }
        };

        fetchData();
    }, []);

    // Format for bar chart
    const biRadsBarData = dbStats.biRadsDistribution.map(item => ({
        name: item.name,
        Images: item.value,
        fill: item.color
    }));

    // Format for model performance chart
    const performanceData = [
        { name: 'Accuracy', value: dbStats.modelMetrics.accuracy * 100 },
        { name: 'Sensitivity', value: dbStats.modelMetrics.sensitivity * 100 },
        { name: 'Specificity', value: dbStats.modelMetrics.specificity * 100 },
        { name: 'Dice Score', value: dbStats.modelMetrics.diceScore * 100 },
        { name: 'AUC', value: dbStats.modelMetrics.auc * 100 }
    ];

    return (
        <Layout>
            <div className="min-h-screen bg-gray-50 rounded-lg">
                <div className="bg-white shadow rounded-lg">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-6">
                            <div className="flex items-center">
                                <FileImage className="h-8 w-8 text-blue-600" />
                                <h1 className="ml-3 text-2xl font-bold text-gray-900">MammoAnnotate Pro</h1>
                            </div>
                            <nav className="flex space-x-4">
                                <a href="#" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Dashboard</a>
                                <a href="#" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">AI Segmentation</a>
                                <a href="#" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Sign Out</a>
                            </nav>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h2 className="text-lg font-semibold mb-6">Dashboard Overview</h2>

                    {/* Stats Overview Cards */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                                        <Database className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Total Images</dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-gray-900">{dbStats.totalImages}</div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                                        <BarChart2 className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Database Size</dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-gray-900">{dbStats.totalSizeGB} GB</div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                                        <Award className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Model Accuracy</dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-gray-900">{(dbStats.modelMetrics.accuracy * 100).toFixed(1)}%</div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                                        <Info className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Dice Score</dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-gray-900">{(dbStats.modelMetrics.diceScore * 100).toFixed(1)}%</div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        {/* BI-RADS Distribution */}
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">BI-RADS Classification Distribution</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={biRadsBarData}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="Images" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* BI-RADS Pie Chart */}
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">BI-RADS Distribution (%)</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={dbStats.biRadsDistribution}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={120}
                                                fill="#8884d8"
                                                dataKey="value"
                                                nameKey="name"
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {dbStats.biRadsDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => [`${value} images`, 'Count']} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Model Performance Metrics */}
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Model Performance Metrics</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={performanceData}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis domain={[0, 100]} />
                                            <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Value']} />
                                            <Legend />
                                            <Bar dataKey="value" fill="#8884d8" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* About the Platform */}
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">About MammoAnnotate Pro</h3>
                                <div className="prose max-w-none">
                                    <p>
                                        MammoAnnotate Pro is an advanced breast cancer detection platform that uses deep learning algorithms to assist radiologists in identifying and classifying potential lesions in mammographic images.
                                    </p>
                                    <h4 className="font-medium text-gray-900 mt-4">Key Features:</h4>
                                    <ul className="list-disc pl-5 mt-2">
                                        <li>AI-powered lesion segmentation and classification</li>
                                        <li>BI-RADS categorization support</li>
                                        <li>High-accuracy detection with 86% accuracy</li>
                                        <li>Interactive annotation tools</li>
                                        <li>Secure cloud storage for mammographic images</li>
                                    </ul>
                                    <h4 className="font-medium text-gray-900 mt-4">Model Information:</h4>
                                    <p>
                                        The platform utilizes a state-of-the-art convolutional neural network trained on over 10,000 mammographic images. The model has been validated through extensive clinical trials and provides decision support to enhance radiologists' diagnostic capabilities.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}