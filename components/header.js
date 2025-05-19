import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

export default function Header() {
  const { logout } = useAuth();

  const logoutClick = () => {
    logout();
  };
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState('')

  useEffect(() => {
    // This code runs when the component mounts
    // or when the router object changes
    setCurrentPath(router.pathname)
    console.log('Current path:', router.pathname);

  }, [router]);

  return (
    <header className="bg-white shadow-md w-full">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img src="logo2.png" className="h-12 rounded-lg mr-4" alt="MammoAnnotate Pro" />

          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-6">
            {currentPath == '/Dashboard' ? (
              <Link href="/Dashboard" className="flex items-center p-2 text-md font-semibold rounded-lg hover:bg-gray-200 bg-gray-200 space-x-2  text-[#267489]">
                {/* <img src="dashboard.svg" className="h-4 w-4" alt="Dashboard icon" /> */}
                <span className=''>Dashboard</span>
              </Link>
            ) : (
              <Link href="/Dashboard" className="flex items-center p-2 text-md font-semibold rounded-lg hover:bg-gray-200 text-gray-500 space-x-2  hover:text-[#267489]">
                {/* <img src="dashboard.svg" className="h-4 w-4" alt="Dashboard icon" /> */}
                <span className=''>Dashboard</span>
              </Link>
            )}

            {currentPath == '/' ? (
              <Link href="/" className="flex items-center space-x-2 rounded-lg font-semibold bg-gray-200 p-2 hover:bg-gray-200 text-md  text-[#267489]">
                {/* <img src="anno.svg" className="h-5 w-5" alt="Annotation icon" /> */}
                <span>AnnotationPro</span>
              </Link>
            ) : (
              <Link href="/" className="flex items-center space-x-2 rounded-lg font-semibold p-2 hover:bg-gray-200 text-md text-gray-500 hover:text-[#267489]">
                {/* <img src="anno.svg" className="h-5 w-5" alt="Annotation icon" /> */}
                <span>AnnotationPro</span>
              </Link>
            )}

            {currentPath == '/segmentation' ? (
              <Link href="/segmentation" className="flex items-center rounded-lg font-semibold p-2 hover:bg-gray-200 space-x-2 text-md  bg-gray-200 text-[#267489]">
                {/* <img src="ai.svg" className="h-5 w-5" alt="AI icon" /> */}
                <span>AI Segmentation</span>
              </Link>
            ) : (
              <Link href="/segmentation" className="flex items-center rounded-lg font-semibold p-2 hover:bg-gray-200 space-x-2 text-md text-gray-500 hover:text-[#267489]">
                {/* <img src="ai.svg" className="h-5 w-5" alt="AI icon" /> */}
                <span>AI Segmentation</span>
              </Link>
            )}
            {currentPath == '/MyAnnotationHistory' ? (
              <Link href="/MyAnnotationHistory" className="flex items-center rounded-lg font-semibold p-2 hover:bg-gray-200 space-x-2 text-md  bg-gray-200 text-[#267489]">
                {/* <img src="ai.svg" className="h-5 w-5" alt="AI icon" /> */}
                <span>My Annotations History</span>
              </Link>
            ) : (
              <Link href="/MyAnnotationHistory" className="flex items-center rounded-lg font-semibold p-2 hover:bg-gray-200 space-x-2 text-md text-gray-500 hover:text-[#267489]">
                {/* <img src="ai.svg" className="h-5 w-5" alt="AI icon" /> */}
                <span>My Annotations History</span>
              </Link>
            )}


            <div onClick={logoutClick} className="flex items-center rounded-lg font-semibold p-2 hover:bg-gray-200 space-x-2 text-md text-gray-500 hover:text-[#267489] cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </div>
          </nav>
        </div>
      </div>
    </header >
  );
}