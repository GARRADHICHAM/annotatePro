import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Image,
  BarChart3,
  Settings,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  LogOut,
  Eye,
  Download,
  Upload,
  AlertTriangle,
  Award,
  Activity,
  Search,
  Filter,
  MoreVertical,
  RefreshCw,
  Bell,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
// Define the base URL for your FastAPI backend
const API_URL = 'http://127.0.0.1:8000/api';

const AdminInterface = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { logout } = useAuth();
  const logoutClick = () => {
    logout();
  };

  // State for all API data
  const [dashboardStats, setDashboardStats] = useState(null);
  const [biradsDistribution, setBiradsDistribution] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [users, setUsers] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [annotationStats, setAnnotationStats] = useState(null);
  const [qualityMetrics, setQualityMetrics] = useState(null);
  const [flaggedAnnotations, setFlaggedAnnotations] = useState([]);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);

  const handleReviewClick = (annotation) => {
    setSelectedAnnotation(annotation);
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedAnnotation(null);
  };

  // Memoized data fetching function
  const fetchDataForTab = useCallback(async (tab) => {
    setLoading(true);
    setError(null);
    try {
      const fetchJson = async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      };

      switch (tab) {
        case 'dashboard':
          const [stats, birads, performance] = await Promise.all([
            fetchJson(`${API_URL}/api/admin/dashboard/stats`),
            fetchJson(`${API_URL}/api/admin/dashboard/birads-distribution`),
            fetchJson(`${API_URL}/api/admin/dashboard/performance-trends`),
          ]);
          setDashboardStats(stats);
          setBiradsDistribution(birads);
          setPerformanceData(performance);
          break;
        case 'users':
          const usersData = await fetchJson(`${API_URL}/api/admin/users`);
          setUsers(usersData);
          console.log('datatt', usersData)
          break;
        case 'annotations':
          const [annotationsData, annStatsData] = await Promise.all([
            fetchJson(`${API_URL}/api/admin/annotations`),
            fetchJson(`${API_URL}/api/admin/annotations/stats`),
          ]);
          setAnnotations(annotationsData);
          setAnnotationStats(annStatsData);
          console.log("Annotation Stats:", annotationsData);
          break;
        case 'quality':
          const [metrics, flagged] = await Promise.all([
            fetchJson(`${API_URL}/api/admin/quality/metrics`),
            fetchJson(`${API_URL}/api/admin/quality/flagged-annotations`),
          ]);
          setQualityMetrics(metrics);
          setFlaggedAnnotations(flagged);
          break;
        default:
          break;
      }
    } catch (err) {
      setError(err.message);
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDataForTab(activeTab);
  }, [activeTab, fetchDataForTab]);

  // In AdminInterface.js, add these state variables at the beginning of the component
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Add this function to handle user status toggle
  const updateUserInList = (updatedUser) => {
    setUsers(users.map(user =>
      user.id === updatedUser.id ? { ...user, disabled: updatedUser.disabled } : user
    ));
  };

  // Then modify the handleToggleUserStatus function
  const handleToggleUserStatus = async (user) => {
    try {
      const response = await fetch(`${API_URL}/auth/users/${user.id}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      const data = await response.json();

      // Update the user in the local state
      updateUserInList({
        ...user,
        disabled: data.disabled
      });

      setShowConfirmModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error toggling user status:', error);
      // Optionally show an error message to the user
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, color = "blue", subtitle, isLoading = false }) => {
    const colorVariants = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500', border: 'border-blue-100' },
      green: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-500', border: 'border-emerald-100' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-500', border: 'border-purple-100' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'text-orange-500', border: 'border-orange-100' },
      red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-500', border: 'border-red-100' },
    };

    const variant = colorVariants[color] || colorVariants.blue;

    return (
      <div className={`bg-white rounded-xl shadow-sm border ${variant.border} p-6 hover:shadow-md transition-all duration-200 hover:scale-[1.02]`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <div className={`p-2 rounded-lg ${variant.bg}`}>
                <Icon className={`w-5 h-5 ${variant.icon}`} />
              </div>
            </div>

            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-20 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ) : (
              <>
                <p className={`text-3xl font-bold ${variant.text} mb-1`}>{value}</p>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                {trend !== undefined && (
                  <div className={`flex items-center text-sm mt-2 ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {trend > 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                    <span className="font-medium">{Math.abs(trend)}%</span>
                    <span className="text-gray-500 ml-1">vs last month</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const QuickActionButton = ({ icon: Icon, label, onClick, variant = "primary" }) => {
    const variants = {
      primary: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white",
      secondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300",
      success: "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white",
    };

    return (
      <button
        onClick={onClick}
        className={`${variants[variant]} px-4 py-2.5 rounded-lg font-medium flex items-center transition-all duration-200 shadow-sm hover:shadow-md`}
      >
        <Icon className="w-4 h-4 mr-2" />
        {label}
      </button>
    );
  };
  // Add this confirmation modal component right before the return statement
  const ConfirmationModal = () => {
    if (!showConfirmModal || !selectedUser) return null;

    const isDisabled = selectedUser.disabled;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900">
            {isDisabled ? 'Activate User' : 'Deactivate User'}
          </h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to {isDisabled ? 'activate' : 'deactivate'} {selectedUser.name}?
            {!isDisabled && " This will prevent them from accessing the system."}
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowConfirmModal(false);
                setSelectedUser(null);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleToggleUserStatus(selectedUser)}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${isDisabled
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700'
                }`}
            >
              {isDisabled ? 'Activate' : 'Deactivate'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
          <p className="text-gray-600">Monitor your medical imaging annotation platform performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>

        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          title="Total Images"
          value={dashboardStats?.total_images || 0}
          icon={Image}
          trend={8.2}
          subtitle="Medical scans"
          isLoading={loading}
        />
        <StatCard
          title="Annotations"
          value={dashboardStats?.total_annotations || 0}
          icon={Target}
          trend={12.5}
          subtitle="Completed"
          isLoading={loading}
        />
        <StatCard
          title="Active Users"
          value={dashboardStats?.active_users || 0}
          icon={Users}
          trend={5.1}
          subtitle="This month"
          isLoading={loading}
        />
        <StatCard
          title="Accuracy"
          value={`${dashboardStats?.model_accuracy || 0}%`}
          icon={Award}
          trend={1.2}
          color="green"
          subtitle="Model performance"
          isLoading={loading}
        />
        <StatCard
          title="Dice Score"
          value={dashboardStats?.dice_score || 0}
          icon={Activity}
          trend={0.8}
          color="purple"
          subtitle="Segmentation quality"
          isLoading={loading}
        />
        <StatCard
          title="Pending"
          value={dashboardStats?.pending_reviews || 0}
          icon={Clock}
          color="orange"
          subtitle="Reviews needed"
          isLoading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* BI-RADS Distribution */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">BI-RADS Distribution</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={biradsDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {biradsDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {biradsDistribution.map((item, index) => (
                <div key={index} className="flex items-center text-sm">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-600 font-medium">{item.name}</span>
                  <span className="ml-auto text-gray-900 font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Trends */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
              <div className="flex items-center space-x-2">
                <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Last 6 months</option>
                  <option>Last year</option>
                </select>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line type="monotone" dataKey="accuracy" stroke="#3B82F6" strokeWidth={3} name="Accuracy %" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="dice" stroke="#10B981" strokeWidth={3} name="Dice Score" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="sensitivity" stroke="#F59E0B" strokeWidth={3} name="Sensitivity %" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="specificity" stroke="#EF4444" strokeWidth={3} name="Specificity %" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">User Management</h2>
          <p className="text-gray-600">Manage radiologists and annotation specialists</p>
        </div>
        <QuickActionButton icon={Users} label="Add New User" variant="primary" />
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Annotations</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Accuracy</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white font-semibold text-sm">{user.name.charAt(0)}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${user.role === 'Radiologist'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-emerald-100 text-emerald-800'
                      }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${!user.disabled
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {!user.disabled ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{user.annotations}</div>
                    <div className="text-xs text-gray-500">annotations</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-semibold text-gray-900">{user.accuracy}%</div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{ width: `${user.accuracy}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">

                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowConfirmModal(true);
                        }}
                        className={`font-medium text-sm ${user.disabled
                          ? 'text-emerald-600 hover:text-emerald-800'
                          : 'text-red-600 hover:text-red-800'
                          }`}
                      >
                        {user.disabled ? 'Activate' : 'Deactivate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );



  const renderAnnotationManagement = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Annotation Management</h2>
          <p className="text-gray-600">Monitor and manage medical image annotations</p>
        </div>
        <div className="flex items-center space-x-3">
          <QuickActionButton icon={Download} label="Export Data" variant="success" />
          <QuickActionButton icon={Upload} label="Bulk Upload" variant="secondary" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Annotations"
          value={annotationStats?.total || 0}
          icon={Target}
          color="blue"
          subtitle="All time"
        />
        <StatCard
          title="Approved"
          value={annotationStats?.approved || 0}
          icon={CheckCircle}
          color="green"
          subtitle="Quality verified"
        />
        <StatCard
          title="Pending Review"
          value={(annotationStats?.pending + annotationStats?.under_review) || 0}
          icon={Clock}
          color="orange"
          subtitle="Awaiting approval"
        />
        <StatCard
          title="Flagged"
          value={annotationStats?.flagged || 0}
          icon={AlertTriangle}
          color="red"
          subtitle="Need attention"
        />
      </div>

      {/* Annotations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Annotations</h3>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search annotations..."
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Image ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Annotator</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">BI-RADS</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Confidence</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {annotations.map((annotation) => {
                const birads = parseInt(annotation.birads_category, 10);
                return (
                  <tr key={annotation.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{annotation.file_name}</div>
                      <div className="text-xs text-gray-500">#{annotation.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-xs font-semibold">{annotation.annotator.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{annotation.annotator}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${birads <= 2 ? 'bg-emerald-100 text-emerald-800' :
                        birads === 3 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                        BI-RADS {annotation.birads_category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${annotation.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        annotation.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          annotation.status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                        {annotation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{annotation.confidence?.toFixed(2) || 'N/A'}</span>
                        {annotation.confidence && (
                          <div className="ml-2 w-12 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full"
                              style={{ width: `${annotation.confidence * 100}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(annotation.annotation_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          onClick={() => handleReviewClick(annotation)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderQualityControl = () => (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Quality Control</h2>
        <p className="text-gray-600">Monitor annotation quality and consistency metrics</p>
      </div>

      {/* Quality Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900">Inter-Observer Agreement</h3>
            <div className="p-2 bg-blue-200 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-700">Cohen's Kappa</span>
              <span className="text-xl font-bold text-blue-900">{qualityMetrics?.inter_observer_agreement?.cohens_kappa || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-700">Fleiss' Kappa</span>
              <span className="text-xl font-bold text-blue-900">{qualityMetrics?.inter_observer_agreement?.fleiss_kappa || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-700">Pearson Correlation</span>
              <span className="text-xl font-bold text-blue-900">{qualityMetrics?.inter_observer_agreement?.pearson_correlation || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-emerald-900">Quality Scores</h3>
            <div className="p-2 bg-emerald-200 rounded-lg">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-emerald-700">Average Quality</span>
              <span className="text-xl font-bold text-emerald-900">{qualityMetrics?.quality_scores?.average_quality || '0'}/10</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-emerald-700">Consistency Rate</span>
              <span className="text-xl font-bold text-emerald-900">{qualityMetrics?.quality_scores?.consistency_rate || '0'}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-emerald-700">Error Rate</span>
              <span className="text-xl font-bold text-emerald-900">{qualityMetrics?.quality_scores?.error_rate || '0'}%</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-orange-900">Review Queue</h3>
            <div className="p-2 bg-orange-200 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-orange-700">Pending Reviews</span>
              <span className="text-xl font-bold text-orange-900">{qualityMetrics?.review_queue?.pending_reviews || '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-orange-700">High Priority</span>
              <span className="text-xl font-bold text-orange-900">{qualityMetrics?.review_queue?.high_priority || '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-orange-700">Avg Review Time</span>
              <span className="text-xl font-bold text-orange-900">{qualityMetrics?.review_queue?.avg_review_time || '0'} min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flagged Annotations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Flagged Annotations Requiring Review</h3>
            <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-1 rounded-full">
              {flaggedAnnotations.length} items
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Annotator</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {flaggedAnnotations.map(ann => (
                <tr key={ann.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{ann.image_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{ann.issue}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-xs font-semibold">{ann.annotator.charAt(0)}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{ann.annotator}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${ann.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {ann.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ann.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
                        Review
                      </button>
                      <button className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors">
                        Approve
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading data...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-20">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Connection Error</h3>
            <p className="text-red-700 mb-4">Error: {error}</p>
            <p className="text-sm text-red-600">Please ensure the backend is running on port 8000.</p>
            <button
              onClick={() => fetchDataForTab(activeTab)}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'users': return renderUserManagement();
      case 'annotations': return renderAnnotationManagement();
      case 'quality': return renderQualityControl();
      default: return null;
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'annotations', label: 'Annotations', icon: Target },
    { id: 'quality', label: 'Quality', icon: CheckCircle }
  ];
  console.log("Annotation base64:", selectedAnnotation?.annotation_base64);

  return (
    <>
      {showConfirmModal && <ConfirmationModal />}
      {showReviewModal && selectedAnnotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-40 backdrop-blur">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-8 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              onClick={closeReviewModal}
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold mb-4 text-gray-900">Review Annotation</h3>
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-gray-700">File Name:</span> {selectedAnnotation.file_name}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Annotator:</span> {selectedAnnotation.annotator_name}
              </div>
              <div>
                <span className="font-semibold text-gray-700">BI-RADS:</span> {selectedAnnotation.birads_category}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Lesion Type:</span> {selectedAnnotation.lesion_type}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Date:</span> {new Date(selectedAnnotation.annotation_date).toLocaleString()}
              </div>
              <div className="flex flex-col md:flex-row gap-4 mt-4">
                {/* Original Image */}
                <div className="flex-1">
                  <div className="font-semibold text-gray-700 mb-1">Original Image</div>
                  {selectedAnnotation.image_path ? (
                    <img
                      src={selectedAnnotation.image_path}
                      alt="Original"
                      className="w-full bg-black max-h-48 object-contain border rounded-lg"
                    />
                  ) : (
                    <div className="text-gray-400 italic">No image available</div>
                  )}
                </div>
                {/* Annotated Image */}
                <div className="flex-1">
                  <div className="font-semibold text-gray-700 mb-1">Annotated Image</div>
                  {selectedAnnotation.annotation_base64 ? (
                    <img
                      src={
                        selectedAnnotation.annotation_base64.startsWith('data:image')
                          ? selectedAnnotation.annotation_base64
                          : `data:image/png;base64,${selectedAnnotation?.annotation_base64}`
                      }
                      alt="Annotation"
                      className="w-full bg-black max-h-48 object-contain border rounded-lg"
                    />
                  ) : (
                    <div className="text-gray-400 italic">No annotation available</div>
                  )}
                </div>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Notes:</span> {selectedAnnotation.notes || 'None'}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
              >
                Approve
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <img
                  src="logo2.png"
                  className="h-12 w-28 "
                  alt="MammoAnnotate Pro"
                />
                <span className="ml-2 text-sm text-gray-500 font-medium">Admin Panel</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={logoutClick}
                  className="w-full flex items-center hover:cursor-pointer space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>

                <div className="w-14 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">A</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation Tabs */}
          <div className="mb-8">
            <nav className="flex space-x-1 bg-white rounded-xl p-1 shadow-sm border border-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default AdminInterface;