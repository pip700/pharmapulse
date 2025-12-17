import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Billing } from './pages/Billing';
import { Analytics } from './pages/Analytics';
import { Orders } from './pages/Orders';
import { Page } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <Inventory />;
      case 'billing': return <Billing />;
      case 'analytics': return <Analytics />;
      case 'orders': return <Orders />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        activePage={currentPage} 
        setPage={setCurrentPage} 
      />
      
      <main className="ml-64 flex-1 p-8">
        {renderPage()}
      </main>
    </div>
  );
}