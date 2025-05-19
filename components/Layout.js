import React from 'react';
import Sidebar from './Sidebar';
import Header from './header'

export default function Layout({ children }) {
  return (
    <div className="flex-col min-h-screen bg-[#F4F2EE]">
      <Header />
      <main className="flex-1 p-4">
        {children}
      </main>
    </div>
  );
}
