
import React, { useEffect, useState } from 'react';
import { Medicine, Vendor } from '../types';
import { db } from '../services/db';
import { Search, Plus, Trash2, Edit2, AlertCircle, Filter, CalendarClock, ArrowUpDown, ArrowUp, ArrowDown, LayoutGrid, List, Minus, DollarSign, Package, FileDown, X } from 'lucide-react';

interface InventoryProps {
  formatCurrency: (value: number) => string;
}

export const Inventory: React.FC<InventoryProps> = ({ formatCurrency }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'stock', direction: 'asc' });

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

  const handleStockAdjust = (id: string, delta: number) => {
    const medName = medicines.find(m => m.id === id)?.name;
    const updated = medicines.map(m => {
        if (m.id === id) {
            return { ...m, stock: Math.max(0, m.stock + delta) };
        }
        return m;
    });
    setMedicines(updated);
    db.saveMedicines(updated);
    if(Math.abs(delta) > 0) {
        db.addAuditLog('Stock Adjustment', `Manual adjustment for ${medName}: ${delta > 0 ? '+' : ''}${delta}`, 'info');
    }
  };

  const handleExportRestock = () => {
    const lowStockItems = medicines.filter(m => m.stock <= m.threshold);
    if (lowStockItems.length === 0) {
        alert("No items are currently below stock threshold.");
        return;
    }
    
    const headers = ['Medicine Name', 'Category', 'Current Stock', 'Min Threshold', 'Vendor', 'Cost Price'];
    const rows = lowStockItems.map(m => [
        m.name,
        m.category,
        m.stock,
        m.threshold,
        getVendorName(m.vendorId),
        m.costPrice.toFixed(2)
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `restock_list_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    db.addAuditLog('Export', 'Downloaded Restock CSV List', 'info');
  };

  const filtered = medicines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || 
                          m.category.toLowerCase().includes(search.toLowerCase());
    
    if (showExpiringOnly) {
        const days = getDaysToExpiry(m.expiryDate);
        return matchesSearch && days <= 90;
    }
    return matchesSearch;
  });

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
    if(confirm('Are you sure you want to delete this medicine?')) {
      const medName = medicines.find(m => m.id === id)?.name;
      const updated = medicines.filter(m => m.id !== id);
      db.saveMedicines(updated);
      setMedicines(updated);
      db.addAuditLog('Delete Item', `Removed medicine: ${medName}`, 'warning');
    }
  };

  const handleSave = () => {
    if (!editItem.name || !editItem.sellingPrice) return;
    
    let updatedMeds = [...medicines];
    if (editItem.id) {
        // Edit
        updatedMeds = updatedMeds.map(m => m.id === editItem.id ? { ...m, ...editItem } as Medicine : m);
        db.addAuditLog('Update Item', `Updated details for ${editItem.name}`, 'info');
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
        db.addAuditLog('New Item', `Added new medicine: ${newMed.name}`, 'success');
    }
    db.saveMedicines(updatedMeds);
    setMedicines(updatedMeds);
    setIsModalOpen(false);
    setEditItem({});
  };

  // --- SUMMARY STATS ---
  const totalItems = medicines.length;
  const totalValue = medicines.reduce((acc, m) => acc + (m.stock * m.costPrice), 0);
  const lowStockCount = medicines.filter(m => m.stock <= m.threshold).length;
  const expiringCount = medicines.filter(m => getDaysToExpiry(m.expiryDate) <= 90).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
            <p className="text-sm text-gray-500">Track stock, values, and expiry dates</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleExportRestock}
                className="bg-white border border-teal-200 text-teal-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-teal-50 shadow-sm"
                title="Download Restock CSV"
            >
                <FileDown size={18} />
                <span className="hidden sm:inline">Restock List</span>
            </button>

            <div className="bg-gray-100 p-1 rounded-lg flex">
                <button 
                    onClick={() => setViewMode('list')} 
                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="List View"
                >
                    <List size={20} />
                </button>
                <button 
                    onClick={() => setViewMode('grid')} 
                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Grid Visualization"
                >
                    <LayoutGrid size={20} />
                </button>
            </div>
            <button 
                onClick={() => { setEditItem({}); setIsModalOpen(true); }}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-teal-700 shadow-sm"
            >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Medicine</span>
            </button>
        </div>
      </div>

      {/* Inventory Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Package size={20} /></div>
              <div>
                  <p className="text-xs text-gray-500 font-medium">Total Items</p>
                  <p className="text-xl font-bold text-gray-800">{totalItems}</p>
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={20} /></div>
              <div>
                  <p className="text-xs text-gray-500 font-medium">Stock Value (Cost)</p>
                  <p className="text-xl font-bold text-gray-800">{formatCurrency(totalValue)}</p>
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><AlertCircle size={20} /></div>
              <div>
                  <p className="text-xs text-gray-500 font-medium">Low Stock</p>
                  <p className="text-xl font-bold text-gray-800">{lowStockCount}</p>
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><CalendarClock size={20} /></div>
              <div>
                  <p className="text-xs text-gray-500 font-medium">Expiring Soon</p>
                  <p className="text-xl font-bold text-gray-800">{expiringCount}</p>
              </div>
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 min-h-[500px]">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text"
                    placeholder="Search medicines by name, category, or manufacturer..."
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
                <span>Expiring (90 Days)</span>
            </button>

            {(search || showExpiringOnly) && (
                <button 
                    onClick={() => { setSearch(''); setShowExpiringOnly(false); }}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
                >
                    <X size={16} />
                    Clear
                </button>
            )}
        </div>

        {filtered.length === 0 && (
             <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                 <Package size={48} className="mb-2 opacity-20" />
                 <p>No medicines found matching your criteria.</p>
                 <button onClick={() => { setSearch(''); setShowExpiringOnly(false); }} className="mt-4 text-teal-600 hover:underline">Clear all filters</button>
             </div>
        )}

        {viewMode === 'list' && filtered.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                            <SortHeader label="Medicine Name" sortKey="name" />
                            <SortHeader label="Category" sortKey="category" />
                            <SortHeader label="Stock Status" sortKey="stock" align="center" />
                            <SortHeader label="Vendor" sortKey="vendor" />
                            <SortHeader label="Price" sortKey="sellingPrice" align="right" />
                            <th className="p-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedMedicines.map(med => {
                            const isOutOfStock = med.stock === 0;
                            const isLow = med.stock <= med.threshold;
                            const maxScale = Math.max(med.stock, med.threshold * 3);
                            const stockPercent = (med.stock / maxScale) * 100;
                            const daysToExpiry = getDaysToExpiry(med.expiryDate);
                            
                            let statusColor = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                            let barColor = 'bg-emerald-500';

                            if (isOutOfStock) {
                                statusColor = 'bg-red-100 text-red-700 border-red-200';
                                barColor = 'bg-red-500';
                            } else if (isLow) {
                                statusColor = 'bg-amber-100 text-amber-700 border-amber-200';
                                barColor = 'bg-amber-500';
                            }
                            
                            return (
                                <tr key={med.id} className={`hover:bg-gray-50 transition-colors ${isOutOfStock ? 'bg-red-50/30' : ''}`}>
                                    <td className="p-3">
                                        <div className="font-medium text-gray-800">{med.name}</div>
                                        <div className="text-xs text-gray-500">Exp: {med.expiryDate} {daysToExpiry <= 90 && <span className="text-amber-600 font-bold">({daysToExpiry} days)</span>}</div>
                                    </td>
                                    <td className="p-3 text-sm text-gray-600">{med.category}</td>
                                    
                                    <td className="p-3 w-64">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                                                    {med.stock} Units
                                                </span>
                                                <span className="text-gray-400">Min: {med.threshold}</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.max(5, stockPercent)}%` }} />
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-3 text-sm text-gray-600">{getVendorName(med.vendorId)}</td>
                                    <td className="p-3 text-sm text-right font-medium text-teal-600">{formatCurrency(med.sellingPrice)}</td>
                                    <td className="p-3 text-center space-x-2">
                                        <button onClick={() => { setEditItem(med); setIsModalOpen(true); }} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(med.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        ) : filtered.length > 0 ? (
            // GRID VISUALIZATION MODE
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedMedicines.map(med => {
                    const isOutOfStock = med.stock === 0;
                    const isLow = med.stock <= med.threshold;
                    
                    let cardBorder = 'border-emerald-200';
                    let headerBg = 'bg-emerald-50';
                    let textColor = 'text-emerald-700';
                    let progressBg = 'bg-emerald-500';
                    let statusLabel = 'In Stock';
                    
                    if (isOutOfStock) {
                        cardBorder = 'border-red-200';
                        headerBg = 'bg-red-50';
                        textColor = 'text-red-700';
                        progressBg = 'bg-red-500';
                        statusLabel = 'Out of Stock';
                    } else if (isLow) {
                        cardBorder = 'border-amber-200';
                        headerBg = 'bg-amber-50';
                        textColor = 'text-amber-700';
                        progressBg = 'bg-amber-500';
                        statusLabel = 'Low Stock';
                    }

                    // Calculate bar width
                    const max = Math.max(med.stock, med.threshold * 2);
                    const percent = Math.min(100, (med.stock / max) * 100);

                    return (
                        <div key={med.id} className={`rounded-xl border ${cardBorder} shadow-sm bg-white overflow-hidden flex flex-col hover:shadow-md transition-shadow`}>
                            <div className={`p-3 border-b ${cardBorder} ${headerBg} flex justify-between items-center`}>
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white border ${cardBorder} ${textColor}`}>
                                    {statusLabel}
                                </span>
                                <div className="flex gap-1">
                                    <button onClick={() => { setEditItem(med); setIsModalOpen(true); }} className="text-gray-400 hover:text-blue-600"><Edit2 size={14}/></button>
                                    <button onClick={() => handleDelete(med.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={14}/></button>
                                </div>
                            </div>
                            
                            <div className="p-4 flex-1">
                                <h3 className="font-bold text-gray-800 text-lg mb-1 truncate" title={med.name}>{med.name}</h3>
                                <p className="text-xs text-gray-500 mb-4">{med.category}</p>
                                
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-3xl font-bold text-gray-700">{med.stock}</span>
                                    <span className="text-xs text-gray-400 mb-1">Target: {med.threshold * 2}</span>
                                </div>
                                
                                <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                                    <div className={`h-full ${progressBg} transition-all duration-500`} style={{width: `${percent}%`}}></div>
                                </div>

                                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                    <span className="text-xs font-semibold text-gray-500">Adjust:</span>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => handleStockAdjust(med.id, -1)}
                                            className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:text-red-600 text-gray-500 transition-colors"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleStockAdjust(med.id, 1)}
                                            className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 shadow-sm shadow-teal-200 transition-colors"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : null}
      </div>

      {/* Add/Edit Modal */}
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
