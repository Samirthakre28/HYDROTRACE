import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { DisclaimerBanner } from './DisclaimerBanner';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 flex flex-col font-sans">
      <DisclaimerBanner />
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 bg-[#0B0F19] overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
