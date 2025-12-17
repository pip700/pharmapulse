import React, { useEffect, useState } from 'react';
import { Medicine, Vendor } from '../types';
import { db } from '../services/db';
import { Search, Plus, Trash2, Edit2, AlertCircle, Filter, CalendarClock, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export const Inventory: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  // Simple Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Partial<Medicine>>({});

  useEffect(() => {
    setMedicines(db.getMedicines());
    setVendors(db.getVendors());
  }, []);

  const getVendorName = (id: string) => vendors.find(v => v.id === id)?.name || 'Unknown';

  const getDaysToExpiry = (dateStr: string) => {
    const today = new Date();
    const expiry = new Date(dateStr);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Filter Logic
  const filtered = medicines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || 
                          m.category.toLowerCase().includes(search.toLowerCase());
    
    if (showExpiringOnly) {
        // Filter for items expiring in 90 days or less (including already expired)
        const days = getDaysToExpiry(m.expiryDate);
        return matchesSearch && days <= 90;
    }
    return matchesSearch;
  });

  // Sort Logic
  const sortedMedicines = [...filtered].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    if (sortConfig.key === 'vendor') {
        aValue = getVendorName(a.vendorId).toLowerCase();
        bValue = getVendorName(b.vendorId).toLowerCase();
    } else {
        aValue = a[sortConfig.key as keyof Medicine];
        bValue = b[sortConfig.key as keyof Medicine];
    }

    // Normalize strings for comparison
    if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleSort = (key: string) => {
    setSortConfig(current => ({
        key,
        direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortHeader = ({ label, sortKey, align = 'left' }: { label: string, sortKey: string, align?: 'left' | 'center' | 'right' }) => (
      <th 
          className={`p-3 cursor-pointer hover:bg-gray-100 transition-colors select-none group ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}
          onClick={() => handleSort(sortKey)}
      >
          <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
              {label}
              {sortConfig.key === sortKey ? (
                  sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-teal-600" /> : <ArrowDown size={14} className="text-teal-600" />
              ) : (
                  <ArrowUpDown size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
          </div>
      </th>
  );

  const handleDelete = (id: string) => {
    if(confirm('Are you sure?')) {
      const updated = medicines.filter(m => m.id !== id);
      db.saveMedicines(updated);
      setMedicines(updated);
    }
  };

  const handleSave = () => {
    if (!editItem.name || !editItem.sellingPrice) return;
    
    let updatedMeds = [...medicines];
    if (editItem.id) {
        // Edit
        updatedMeds = updatedMeds.map(m => m.id === editItem.id ? { ...m, ...editItem } as Medicine : m);
    } else {
        // Add
        const newMed: Medicine = {
            id: Date.now().toString(),
            name: editItem.name || '',
            category: editItem.category || 'General',
            stock: Number(editItem.stock) || 0,
            threshold: Number(editItem.threshold) || 10,
            costPrice: Number(editItem.costPrice) || 0,
            sellingPrice: Number(editItem.sellingPrice) || 0,
            expiryDate: editItem.expiryDate || new Date().toISOString().split('T')[0],
            manufacturer: editItem.manufacturer || '',
            vendorId: editItem.vendorId || vendors[0]?.id
        };
        updatedMeds.push(newMed);
    }
    db.saveMedicines(updatedMeds);
    setMedicines(updatedMeds);
    setIsModalOpen(false);
    setEditItem({});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
        <button 
            onClick={() => { setEditItem({}); setIsModalOpen(true); }}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-teal-700 shadow-sm"
        >
          <Plus size={18} />
          <span>Add Medicine</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text"
                    placeholder="Search medicines by name or category..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
            </div>
            <button
                onClick={() => setShowExpiringOnly(!showExpiringOnly)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 border transition-colors ${
                    showExpiringOnly 
                    ? 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-200' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
            >
                <Filter size={18} className={showExpiringOnly ? "fill-amber-700/20" : ""} />
                <span>Expiring Soon</span>
            </button>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                        <SortHeader label="Medicine Name" sortKey="name" />
                        <SortHeader label="Category" sortKey="category" />
                        <SortHeader label="Stock Status" sortKey="stock" align="center" />
                        <SortHeader label="Vendor" sortKey="vendor" />
                        <SortHeader label="Cost" sortKey="costPrice" align="right" />
                        <SortHeader label="Price" sortKey="sellingPrice" align="right" />
                        <th className="p-3 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {sortedMedicines.map(med => {
                        const isOutOfStock = med.stock === 0;
                        const isLow = med.stock <= med.threshold;
                        // Calculate percentage relative to 3x threshold for visual scaling
                        const maxScale = Math.max(med.stock, med.threshold * 3);
                        const stockPercent = (med.stock / maxScale) * 100;
                        
                        // Expiry Logic
                        const daysToExpiry = getDaysToExpiry(med.expiryDate);
                        const isExpired = daysToExpiry < 0;
                        const isExpiringSoon = daysToExpiry <= 90 && !isExpired;
                        
                        let statusColor = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                        let barColor = 'bg-emerald-500';
                        let statusText = 'In Stock';

                        if (isOutOfStock) {
                            statusColor = 'bg-red-100 text-red-700 border-red-200';
                            barColor = 'bg-red-500';
                            statusText = 'Out of Stock';
                        } else if (isLow) {
                            statusColor = 'bg-amber-100 text-amber-700 border-amber-200';
                            barColor = 'bg-amber-500';
                            statusText = 'Low Stock';
                        }
                        
                        return (
                            <tr key={med.id} className={`hover:bg-gray-50 transition-colors ${isOutOfStock ? 'bg-red-50/30' : ''}`}>
                                <td className="p-3">
                                    <div className="font-medium text-gray-800 flex items-center gap-2">
                                        {med.name}
                                        
                                        {/* Expiring Soon Dot Indicator */}
                                        {isExpiringSoon && (
                                            <div className="relative group">
                                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-100 animate-pulse"></div>
                                                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-lg">
                                                    Expiring in {daysToExpiry} days
                                                </div>
                                            </div>
                                        )}

                                        {isExpired && <span className="bg-red-100 text-red-700 text-[10px] px-1.5 rounded font-bold uppercase border border-red-200">Expired</span>}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                      <span className={`${isExpired ? 'text-red-600 font-bold' : isExpiringSoon ? 'text-amber-600 font-semibold' : ''}`}>
                                        Exp: {med.expiryDate}
                                      </span>
                                      
                                      {isExpiringSoon && (
                                          <span className="flex items-center text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100">
                                              <CalendarClock size={10} className="mr-1" />
                                              {daysToExpiry} days
                                          </span>
                                      )}
                                      
                                      {isLow && !isOutOfStock && (
                                        <span className="flex items-center text-amber-500" title="Low Stock">
                                            <AlertCircle size={12} />
                                        </span>
                                      )}
                                    </div>
                                </td>
                                <td className="p-3 text-sm text-gray-600">{med.category}</td>
                                
                                <td className="p-3 w-64">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                                                {statusText}
                                            </span>
                                            <span className="text-gray-500 font-medium">
                                                {med.stock} <span className="text-gray-400 font-normal">/ {med.threshold} min</span>
                                            </span>
                                        </div>
                                        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                                                style={{ width: `${Math.max(2, stockPercent)}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>

                                <td className="p-3 text-sm text-gray-600 truncate max-w-[120px]" title={getVendorName(med.vendorId)}>
                                    {getVendorName(med.vendorId)}
                                </td>
                                <td className="p-3 text-sm text-right text-gray-600">${med.costPrice.toFixed(2)}</td>
                                <td className="p-3 text-sm text-right font-medium text-teal-600">${med.sellingPrice.toFixed(2)}</td>
                                <td className="p-3 text-center space-x-2">
                                    <button 
                                        onClick={() => { setEditItem(med); setIsModalOpen(true); }}
                                        className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(med.id)}
                                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>

      {/* Basic Add/Edit Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg transform transition-all scale-100">
                  <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">{editItem.id ? 'Edit Medicine' : 'Add New Medicine'}</h2>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</label>
                        <input className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all" value={editItem.name || ''} onChange={e => setEditItem({...editItem, name: e.target.value})} placeholder="e.g. Paracetamol" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</label>
                        <input className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" value={editItem.category || ''} onChange={e => setEditItem({...editItem, category: e.target.value})} placeholder="e.g. Pain Relief" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock Qty</label>
                        <input type="number" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" value={editItem.stock || ''} onChange={e => setEditItem({...editItem, stock: Number(e.target.value)})} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Selling Price</label>
                        <input type="number" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" value={editItem.sellingPrice || ''} onChange={e => setEditItem({...editItem, sellingPrice: Number(e.target.value)})} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cost Price</label>
                        <input type="number" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" value={editItem.costPrice || ''} onChange={e => setEditItem({...editItem, costPrice: Number(e.target.value)})} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Min Threshold</label>
                        <input type="number" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" value={editItem.threshold || ''} onChange={e => setEditItem({...editItem, threshold: Number(e.target.value)})} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Expiry Date</label>
                         <input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" value={editItem.expiryDate || ''} onChange={e => setEditItem({...editItem, expiryDate: e.target.value})} />
                      </div>
                      <div className="col-span-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor</label>
                          <select className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white" value={editItem.vendorId || ''} onChange={e => setEditItem({...editItem, vendorId: e.target.value})}>
                              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                          </select>
                      </div>
                  </div>
                  <div className="mt-8 flex justify-end space-x-3">
                      <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
                      <button onClick={handleSave} className="px-5 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 shadow-lg shadow-teal-200 transition-all">Save Changes</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};