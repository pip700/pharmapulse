import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Billing } from './pages/Billing';
import { Analytics } from './pages/Analytics';
import { Orders } from './pages/Orders';
import { SettingsModal } from './components/SettingsModal';
import { Page, AppSettings } from './types';
import { db } from './services/db';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(db.getSettings());

  const saveSettings = (newSettings: AppSettings) => {
    db.saveSettings(newSettings);
    setSettings(newSettings);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(settings.locale, {
      style: 'currency',
      currency: settings.currency
    }).format(amount);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard formatCurrency={formatCurrency} />;
      case 'inventory': return <Inventory formatCurrency={formatCurrency} />;
      case 'billing': return <Billing formatCurrency={formatCurrency} />;
      case 'analytics': return <Analytics formatCurrency={formatCurrency} />;
      case 'orders': return <Orders formatCurrency={formatCurrency} />;
      default: return <Dashboard formatCurrency={formatCurrency} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar 
        activePage={currentPage} 
        setPage={setCurrentPage} 
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      
      <main className="ml-64 flex-1 p-8 overflow-y-auto">
        {renderPage()}
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        currentSettings={settings}
        onSave={saveSettings}
      />
    </div>
  );
}