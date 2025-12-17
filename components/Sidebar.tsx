import React from 'react';
import { LayoutDashboard, ShoppingCart, Pill, BarChart3, TrendingUp } from 'lucide-react';
import { Page } from '../types';

interface SidebarProps {
  activePage: Page;
  setPage: (page: Page) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setPage }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'billing', label: 'Billing / POS', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory', icon: Pill },
    { id: 'orders', label: 'Auto Orders', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 z-10">
      <div className="p-6 flex items-center space-x-2 border-b border-gray-100">
        <div className="bg-teal-600 p-2 rounded-lg">
          <Pill className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-bold text-gray-800">PharmaPulse</span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id as Page)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-teal-50 text-teal-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-100">
        <div className="text-xs text-center text-gray-400">
          PharmaPulse v1.0
        </div>
      </div>
    </div>
  );
};