
import React, { useState, useEffect } from 'react';
import { AppSettings, AuditLog } from '../types';
import { X, Globe, Check, Coins, ShieldCheck, History, Activity } from 'lucide-react';
import { db } from '../services/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

const REGIONS = [
  { id: 'us', name: 'United States', locale: 'en-US', currency: 'USD', flag: '🇺🇸' },
  { id: 'eu', name: 'Europe', locale: 'de-DE', currency: 'EUR', flag: '🇪🇺' },
  { id: 'uk', name: 'United Kingdom', locale: 'en-GB', currency: 'GBP', flag: '🇬🇧' },
  { id: 'in', name: 'India', locale: 'en-IN', currency: 'INR', flag: '🇮🇳' },
  { id: 'jp', name: 'Japan', locale: 'ja-JP', currency: 'JPY', flag: '🇯🇵' },
  { id: 'ca', name: 'Canada', locale: 'en-CA', currency: 'CAD', flag: '🇨🇦' },
  { id: 'au', name: 'Australia', locale: 'en-AU', currency: 'AUD', flag: '🇦🇺' },
  { id: 'ae', name: 'UAE', locale: 'en-AE', currency: 'AED', flag: '🇦🇪' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentSettings, onSave }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'logs'>('general');
  const [selectedRegion, setSelectedRegion] = useState(REGIONS.find(r => r.currency === currentSettings.currency) || REGIONS[0]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLogs(db.getAuditLogs());
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      currency: selectedRegion.currency,
      locale: selectedRegion.locale,
      countryName: selectedRegion.name
    });
    db.addAuditLog('Settings Updated', `Changed region to ${selectedRegion.name}`, 'warning');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">System Configuration</h2>
            <p className="text-sm text-gray-500">Manage settings and audit logs</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'general' ? 'border-teal-500 text-teal-700 bg-teal-50/30' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            General Settings
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'logs' ? 'border-teal-500 text-teal-700 bg-teal-50/30' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Security Audit Logs
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {activeTab === 'general' ? (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Globe size={16} /> Region & Currency
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {REGIONS.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => setSelectedRegion(region)}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                      selectedRegion.id === region.id 
                      ? 'border-teal-500 bg-teal-50/50' 
                      : 'border-transparent bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{region.flag}</span>
                      <div className="text-left">
                        <p className={`font-semibold ${selectedRegion.id === region.id ? 'text-teal-900' : 'text-gray-700'}`}>
                          {region.name}
                        </p>
                        <p className="text-xs text-gray-500">{region.currency}</p>
                      </div>
                    </div>
                    {selectedRegion.id === region.id && (
                      <div className="bg-teal-500 text-white p-1 rounded-full">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="mt-6 bg-blue-50 p-4 rounded-xl flex items-start gap-3 border border-blue-100">
                <Coins className="text-blue-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-blue-900">Preview Format</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {new Intl.NumberFormat(selectedRegion.locale, { style: 'currency', currency: selectedRegion.currency }).format(1234.56)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-gray-700 flex items-center gap-2">
                   <ShieldCheck size={18} className="text-teal-600"/> Audit Trail
                 </h3>
                 <span className="text-xs text-gray-400">Last 200 Actions</span>
               </div>
               
               <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-gray-100 border-b border-gray-200 text-gray-500">
                     <tr>
                       <th className="p-3 font-medium">Time</th>
                       <th className="p-3 font-medium">Action</th>
                       <th className="p-3 font-medium">Details</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200 bg-white">
                     {logs.map((log) => (
                       <tr key={log.id} className="hover:bg-gray-50">
                         <td className="p-3 text-gray-500 whitespace-nowrap w-32">
                           <div className="text-xs">{new Date(log.timestamp).toLocaleDateString()}</div>
                           <div className="text-xs opacity-75">{new Date(log.timestamp).toLocaleTimeString()}</div>
                         </td>
                         <td className="p-3 font-medium w-40">
                           <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                             log.type === 'success' ? 'bg-green-100 text-green-700' :
                             log.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                             'bg-blue-100 text-blue-700'
                           }`}>
                             {log.type === 'success' && <Check size={12} />}
                             {log.type === 'warning' && <Activity size={12} />}
                             {log.type === 'info' && <History size={12} />}
                             {log.action}
                           </span>
                         </td>
                         <td className="p-3 text-gray-600 truncate max-w-xs" title={log.details}>
                           {log.details}
                         </td>
                       </tr>
                     ))}
                     {logs.length === 0 && (
                       <tr>
                         <td colSpan={3} className="p-8 text-center text-gray-400">
                           No logs recorded yet.
                         </td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'general' && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-white hover:shadow-sm rounded-lg transition-all">
              Cancel
            </button>
            <button onClick={handleSave} className="px-5 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 shadow-md shadow-teal-200 transition-all">
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
