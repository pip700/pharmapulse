import React, { useState } from 'react';
import { AppSettings } from '../types';
import { X, Globe, Check, Coins } from 'lucide-react';

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
  const [selectedRegion, setSelectedRegion] = useState(REGIONS.find(r => r.currency === currentSettings.currency) || REGIONS[0]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      currency: selectedRegion.currency,
      locale: selectedRegion.locale,
      countryName: selectedRegion.name
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Application Settings</h2>
            <p className="text-sm text-gray-500">Customize your experience</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Globe size={16} /> Region & Currency
            </label>
            
            <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-1">
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
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-white hover:shadow-sm rounded-lg transition-all">
            Cancel
          </button>
          <button onClick={handleSave} className="px-5 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 shadow-md shadow-teal-200 transition-all">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};