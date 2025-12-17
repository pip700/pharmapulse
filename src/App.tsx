
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
import { Lock, Fingerprint } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') {
      setIsAuthenticated(true);
      setError('');
      db.addAuditLog('Login', 'User accessed the system', 'info');
    } else {
      setError('Incorrect PIN. Try 1234.');
      setPin('');
    }
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md animate-in fade-in duration-500 slide-in-from-bottom-4">
          <div className="text-center mb-8">
            <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="text-teal-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">PharmaPulse</h1>
            <p className="text-gray-500">Secure Pharmacy Management</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Security PIN
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-center tracking-widest text-lg"
                  placeholder="••••"
                  maxLength={4}
                  autoFocus
                />
                <Fingerprint className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              </div>
              {error && <p className="text-red-500 text-sm mt-2 text-center animate-pulse">{error}</p>}
            </div>
            
            <button
              type="submit"
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200"
            >
              Unlock Dashboard
            </button>
            
            <p className="text-xs text-center text-gray-400">
              Default Access Code: 1234
            </p>
          </form>
        </div>
      </div>
    );
  }

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
