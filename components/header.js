import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { 
  LayoutDashboard, 
  Target, 
  Brain, 
  History, 
  LogOut, 
  User,
  Bell,
  Settings,
  ChevronDown,
  Activity
} from 'lucide-react';
import ProfileSettingsModal from './ProfileSettingsModal'; // Import the modal

export default function Header() {
  const { logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const logoutClick = () => {
    logout();
  };

  const router = useRouter();
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    setCurrentPath(router.pathname);
    console.log('Current path:', router.pathname);
  }, [router]);

  // Load user data from localStorage
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        // Transform the userData to match component expectations
        setCurrentUser({
          name: parsedUserData.full_name || parsedUserData.username || "User",
          email: parsedUserData.email || "user@example.com",
          role: parsedUserData.username?.startsWith('dr_') ? "Doctor" : "User",
          username: parsedUserData.username,
          id: parsedUserData._id,
          created_at: parsedUserData.created_at,
          disabled: parsedUserData.disabled,
          avatar: null // Add avatar URL here if you have one
        });
      } else {
        // Fallback user data if localStorage is empty
        setCurrentUser({
          name: "Guest User",
          email: "guest@example.com",
          role: "User",
          username: "guest",
          avatar: null
        });
      }
    } catch (error) {
      console.error('Error loading user data from localStorage:', error);
      // Fallback user data in case of error
      setCurrentUser({
        name: "Guest User",
        email: "guest@example.com",
        role: "User",
        username: "guest",
        avatar: null
      });
    }
  };

  // Handle user data update from modal
  const handleUserUpdate = (updatedUserData) => {
    const transformedUser = {
      name: updatedUserData.full_name || updatedUserData.username || "User",
      email: updatedUserData.email || "user@example.com",
      role: updatedUserData.username?.startsWith('dr_') ? "Doctor" : "User",
      username: updatedUserData.username,
      id: updatedUserData._id,
      created_at: updatedUserData.created_at,
      disabled: updatedUserData.disabled,
      avatar: null
    };
    setCurrentUser(transformedUser);
  };

  // Don't render until user data is loaded
  if (!currentUser) {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-center">
            <div className="animate-pulse">Loading...</div>
          </div>
        </div>
      </header>
    );
  }

  const notifications = [
    { id: 1, message: "New annotation assignment", time: "5 min ago", unread: true },
    { id: 2, message: "Quality review completed", time: "1 hour ago", unread: true },
    { id: 3, message: "System maintenance scheduled", time: "2 hours ago", unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  // Helper function to get user initials
  const getUserInitials = (name) => {
    if (!name) return 'GU';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const NavigationLink = ({ href, icon: Icon, children, isActive }) => (
    <Link 
      href={href} 
      className={`
        relative flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
        ${isActive 
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105' 
          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
        }
      `}
    >
      <Icon className="w-4 h-4" />
      <span>{children}</span>
      {isActive && (
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
      )}
    </Link>
  );

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <img 
              src="logo2.png" 
              className="h-12 w-28 " 
              alt="MammoAnnotate Pro" 
            />

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {/* <NavigationLink 
                href="/Dashboard" 
                icon={LayoutDashboard}
                isActive={currentPath === '/Dashboard'}
              >
                Dashboard
              </NavigationLink> */}

              <NavigationLink 
                href="/" 
                icon={Target}
                isActive={currentPath === '/'}
              >
                AnnotationPro
              </NavigationLink>

              <NavigationLink 
                href="/segmentation" 
                icon={Brain}
                isActive={currentPath === '/segmentation'}
              >
                AI Segmentation
              </NavigationLink>

              <NavigationLink 
                href="/MyAnnotationHistory" 
                icon={History}
                isActive={currentPath === '/MyAnnotationHistory'}
              >
                My History
              </NavigationLink>
            </nav>

            {/* Right Section - Notifications & User Menu */}
            <div className="flex items-center space-x-4">
              {/* Settings */}
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {currentUser.avatar ? (
                    <img 
                      src={currentUser.avatar} 
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-white text-sm font-semibold">
                        {getUserInitials(currentUser.name)}
                      </span>
                    </div>
                  )}
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                    <p className="text-xs text-gray-500">{currentUser.role}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        {currentUser.avatar ? (
                          <img 
                            src={currentUser.avatar} 
                            alt={currentUser.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {getUserInitials(currentUser.name)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{currentUser.name}</p>
                          <p className="text-sm text-gray-500">{currentUser.email}</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                            {currentUser.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <button 
                        onClick={() => {
                          setShowProfileModal(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>Profile Settings</span>
                      </button>
                      <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                        <Settings className="w-4 h-4" />
                        <span>Preferences</span>
                      </button>
                    </div>

                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={logoutClick}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden mt-4 pb-2">
            <nav className="flex space-x-1 overflow-x-auto">
              <NavigationLink 
                href="/Dashboard" 
                icon={LayoutDashboard}
                isActive={currentPath === '/Dashboard'}
              >
                Dashboard
              </NavigationLink>

              <NavigationLink 
                href="/" 
                icon={Target}
                isActive={currentPath === '/'}
              >
                Annotate
              </NavigationLink>

              <NavigationLink 
                href="/segmentation" 
                icon={Brain}
                isActive={currentPath === '/segmentation'}
              >
                AI Seg
              </NavigationLink>

              <NavigationLink 
                href="/MyAnnotationHistory" 
                icon={History}
                isActive={currentPath === '/MyAnnotationHistory'}
              >
                History
              </NavigationLink>
            </nav>
          </div>
        </div>

        {/* Click outside handlers */}
        {(showUserMenu || showNotifications) && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setShowUserMenu(false);
              setShowNotifications(false);
            }}
          ></div>
        )}
      </header>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentUser={currentUser}
        onUserUpdate={handleUserUpdate}
      />
    </>
  );
}