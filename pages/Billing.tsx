import React, { useState, useEffect } from 'react';
import { Medicine, CartItem, Sale } from '../types';
import { db } from '../services/db';
import { Search, PlusCircle, MinusCircle, Trash, Receipt, Printer, History, Calendar, Filter, X } from 'lucide-react';

export const Billing: React.FC = () => {
  // Tabs: 'pos' or 'history'
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');

  // POS State
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // History State
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });

  useEffect(() => {
    setMedicines(db.getMedicines());
    setSalesHistory(db.getSales());
  }, []);

  const refreshData = () => {
      setMedicines(db.getMedicines());
      setSalesHistory(db.getSales());
  };

  // --- POS HANDLERS ---
  const addToCart = (med: Medicine) => {
    const existing = cart.find(item => item.id === med.id);
    if (existing) {
      if (existing.quantity < med.stock) {
        setCart(cart.map(item => item.id === med.id ? { ...item, quantity: item.quantity + 1 } : item));
      } else {
        alert('Not enough stock!');
      }
    } else {
      if (med.stock > 0) {
        setCart([...cart, { ...med, quantity: 1 }]);
      } else {
        alert('Out of stock!');
      }
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const med = medicines.find(m => m.id === id);
        const newQty = Math.max(1, item.quantity + delta);
        if (med && newQty > med.stock) {
          alert('Stock limit reached');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((acc, item) => acc + (item.sellingPrice * item.quantity), 0);

  const handlePrint = (cartItems: CartItem[] = cart, cName: string = customerName, date: string = new Date().toISOString(), total: number = totalAmount) => {
    const printContent = `
      <html>
        <head>
          <title>PharmaPulse Receipt</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
            .total { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; }
            .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>PharmaPulse</h2>
            <p>Date: ${new Date(date).toLocaleDateString()} ${new Date(date).toLocaleTimeString()}</p>
            ${cName ? `<p>Customer: ${cName}</p>` : '<p>Customer: Walk-in</p>'}
          </div>
          <div>
            ${cartItems.map(item => `
              <div class="item">
                <span>${item.name} x${item.quantity}</span>
                <span>$${(item.sellingPrice * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
          <div class="total">
            <span>TOTAL</span>
            <span>$${total.toFixed(2)}</span>
          </div>
          <div class="footer">
            <p>Thank you for your business!</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const totalCost = cart.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0);
    const sale: Sale = {
      id: `S${Date.now()}`,
      date: new Date().toISOString(),
      customerName: customerName || 'Walk-in Customer',
      items: cart.map(c => ({
        medicineId: c.id,
        medicineName: c.name,
        quantity: c.quantity,
        priceAtSale: c.sellingPrice,
        costAtSale: c.costPrice
      })),
      totalAmount,
      totalProfit: totalAmount - totalCost
    };

    db.addSale(sale);
    setSuccessMsg('Bill generated successfully!');
    setCart([]);
    setCustomerName('');
    
    refreshData();

    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const filteredMeds = medicines.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  // --- HISTORY LOGIC ---
  const getFilteredHistory = () => {
      return salesHistory.filter(sale => {
          const searchLower = historySearch.toLowerCase();
          // Check Customer Name
          const matchesCustomer = sale.customerName?.toLowerCase().includes(searchLower);
          // Check Medicine Names in items
          const matchesMedicine = sale.items.some(item => item.medicineName.toLowerCase().includes(searchLower));
          
          const matchesSearch = !historySearch || matchesCustomer || matchesMedicine;

          let matchesDate = true;
          if (dateRange.start) {
              const startDate = new Date(dateRange.start);
              startDate.setHours(0, 0, 0, 0);
              matchesDate = matchesDate && new Date(sale.date) >= startDate;
          }
          if (dateRange.end) {
              const endDate = new Date(dateRange.end);
              endDate.setHours(23, 59, 59, 999);
              matchesDate = matchesDate && new Date(sale.date) <= endDate;
          }

          return matchesSearch && matchesDate;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const filteredHistory = getFilteredHistory();

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      {/* Header Tabs */}
      <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('pos')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'pos' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  New Sale (POS)
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  Sales History
              </button>
          </div>
      </div>

      {activeTab === 'pos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
          {/* Product List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text"
                  placeholder="Search medicines..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredMeds.map(med => (
                <button 
                  key={med.id}
                  onClick={() => addToCart(med)}
                  disabled={med.stock === 0}
                  className={`text-left p-4 rounded-lg border transition-all ${
                    med.stock === 0 
                    ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed' 
                    : 'bg-white border-gray-200 hover:border-teal-400 hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-800 truncate pr-2">{med.name}</h3>
                    <span className="font-bold text-teal-600">${med.sellingPrice}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{med.category}</p>
                  <div className="mt-3 flex justify-between items-center text-xs">
                     <span className={`${med.stock < med.threshold ? 'text-red-500' : 'text-gray-500'}`}>
                       Stock: {med.stock}
                     </span>
                     <span className="text-teal-600 font-medium">+ Add</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cart / Invoice */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 bg-gray-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Receipt className="mr-2" size={20} />
                Current Bill
              </h2>
              <input 
                type="text"
                placeholder="Customer Name (Optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-4 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <PlusCircle size={48} className="mb-2 opacity-20" />
                  <p>Add items to cart</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-800">{item.name}</h4>
                      <p className="text-xs text-gray-500">${item.sellingPrice} x {item.quantity}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <button onClick={() => updateQty(item.id, -1)} className="text-gray-400 hover:text-teal-600">
                          <MinusCircle size={18} />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="text-gray-400 hover:text-teal-600">
                          <PlusCircle size={18} />
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Total Amount</span>
                <span className="text-2xl font-bold text-teal-700">${totalAmount.toFixed(2)}</span>
              </div>
              
              {successMsg && (
                <div className="mb-3 p-2 bg-green-100 text-green-700 text-sm rounded text-center">
                  {successMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                 <button 
                    onClick={() => handlePrint()}
                    disabled={cart.length === 0} 
                    className="flex justify-center items-center py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                 >
                    <Printer size={18} className="mr-2" />
                    Print
                 </button>
                 <button 
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className="py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 shadow-lg shadow-teal-200 disabled:opacity-50 disabled:shadow-none"
                 >
                    Generate Bill
                 </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // --- HISTORY VIEW ---
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col flex-1 overflow-hidden">
             <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 sm:items-center">
                 <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                      type="text"
                      placeholder="Filter by medicine name or customer..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                 </div>
                 <div className="flex items-center space-x-2">
                     <button 
                        onClick={() => setShowDateFilter(!showDateFilter)}
                        className={`px-4 py-2 border rounded-lg flex items-center space-x-2 transition-colors ${showDateFilter ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                     >
                        <Calendar size={18} />
                        <span>Date Range</span>
                        {showDateFilter ? <X size={16} className="ml-2" /> : <Filter size={16} className="ml-2" />}
                     </button>
                 </div>
             </div>

             {showDateFilter && (
                 <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">From:</span>
                        <input 
                            type="date" 
                            value={dateRange.start}
                            onChange={e => setDateRange({...dateRange, start: e.target.value})}
                            className="p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">To:</span>
                        <input 
                            type="date" 
                            value={dateRange.end}
                            onChange={e => setDateRange({...dateRange, end: e.target.value})}
                            className="p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                    </div>
                    {(dateRange.start || dateRange.end) && (
                        <button 
                            onClick={() => setDateRange({start: '', end: ''})}
                            className="text-sm text-red-500 hover:text-red-700 hover:underline px-2"
                        >
                            Clear Dates
                        </button>
                    )}
                 </div>
             )}

             <div className="flex-1 overflow-auto">
                 <table className="w-full text-left border-collapse">
                     <thead className="bg-gray-50 sticky top-0 z-10">
                         <tr className="text-gray-500 text-sm">
                             <th className="p-4 font-medium border-b border-gray-100">Date</th>
                             <th className="p-4 font-medium border-b border-gray-100">Customer</th>
                             <th className="p-4 font-medium border-b border-gray-100">Items Summary</th>
                             <th className="p-4 font-medium border-b border-gray-100 text-right">Total</th>
                             <th className="p-4 font-medium border-b border-gray-100 text-center">Action</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                         {filteredHistory.length > 0 ? filteredHistory.map(sale => (
                             <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                                 <td className="p-4 text-sm text-gray-600">
                                     <div>{new Date(sale.date).toLocaleDateString()}</div>
                                     <div className="text-xs text-gray-400">{new Date(sale.date).toLocaleTimeString()}</div>
                                 </td>
                                 <td className="p-4 text-sm font-medium text-gray-800">{sale.customerName}</td>
                                 <td className="p-4 text-sm text-gray-600 max-w-xs">
                                     <div className="truncate" title={sale.items.map(i => `${i.medicineName} (${i.quantity})`).join(', ')}>
                                        {sale.items.map(i => `${i.medicineName} x${i.quantity}`).join(', ')}
                                     </div>
                                 </td>
                                 <td className="p-4 text-sm font-bold text-teal-600 text-right">${sale.totalAmount.toFixed(2)}</td>
                                 <td className="p-4 text-center">
                                     <button 
                                        onClick={() => {
                                            const cartItems = sale.items.map(i => ({
                                                id: i.medicineId,
                                                name: i.medicineName,
                                                quantity: i.quantity,
                                                sellingPrice: i.priceAtSale,
                                                costPrice: i.costAtSale,
                                                category: '', stock: 0, threshold: 0, expiryDate: '', manufacturer: '', vendorId: ''
                                            }));
                                            handlePrint(cartItems, sale.customerName, sale.date, sale.totalAmount);
                                        }}
                                        className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                        title="Reprint Receipt"
                                     >
                                         <Printer size={18} />
                                     </button>
                                 </td>
                             </tr>
                         )) : (
                             <tr>
                                 <td colSpan={5} className="p-8 text-center text-gray-400">
                                     <History className="mx-auto mb-2 opacity-50" size={32} />
                                     <p>No sales found matching filters.</p>
                                 </td>
                             </tr>
                         )}
                     </tbody>
                 </table>
             </div>
        </div>
      )}
    </div>
  );
};