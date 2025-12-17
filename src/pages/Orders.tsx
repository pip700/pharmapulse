import React, { useEffect, useState } from 'react';
import { Medicine, Vendor, OrderSuggestion } from '../types';
import { db } from '../services/db';
import { ShoppingBag, Truck, CheckCircle, CheckSquare } from 'lucide-react';

interface OrdersProps {
  formatCurrency: (value: number) => string;
}

export const Orders: React.FC<OrdersProps> = ({ formatCurrency }) => {
  const [suggestions, setSuggestions] = useState<OrderSuggestion[]>([]);

  useEffect(() => {
    const meds = db.getMedicines();
    const vendors = db.getVendors();

    const newSuggestions: OrderSuggestion[] = [];

    meds.forEach(med => {
      if (med.stock <= med.threshold) {
        const vendor = vendors.find(v => v.id === med.vendorId);
        if (vendor) {
          // Logic: Suggest enough to reach 3x threshold
          const suggestedQty = (med.threshold * 3) - med.stock;
          
          newSuggestions.push({
            medicineId: med.id,
            medicineName: med.name,
            currentStock: med.stock,
            suggestedQty,
            vendorId: vendor.id,
            vendorName: vendor.name,
            estimatedCost: suggestedQty * med.costPrice,
            reason: 'Stock below threshold'
          });
        }
      }
    });

    setSuggestions(newSuggestions);
  }, []);

  const handleOrder = (index: number) => {
    // In a real app, this would send an email or create an Order record
    alert(`Order placed for ${suggestions[index].medicineName} sent to ${suggestions[index].vendorName}`);
    // Simulate removing from suggestions for demo
    const newSugg = [...suggestions];
    newSugg.splice(index, 1);
    setSuggestions(newSugg);
  };

  const handleOrderAll = () => {
    if(confirm(`Are you sure you want to place ${suggestions.length} orders?`)) {
      alert(`Successfully placed ${suggestions.length} orders to respective vendors.`);
      setSuggestions([]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <header className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Auto-Order Suggestions</h1>
            <p className="text-gray-500">Based on your stock levels and configured thresholds.</p>
        </div>
        {suggestions.length > 0 && (
            <button 
                onClick={handleOrderAll}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-teal-700 shadow-sm"
            >
                <CheckSquare size={18} />
                <span>Place All Orders</span>
            </button>
        )}
      </header>

      {suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <CheckCircle size={48} className="text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-800">All Stock Healthy</h3>
              <p className="text-gray-500">No items are currently below their reorder threshold.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestions.map((item, idx) => (
                  <div key={item.medicineId} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <h3 className="font-bold text-gray-800">{item.medicineName}</h3>
                              <span className="text-xs font-semibold px-2 py-1 bg-red-100 text-red-600 rounded-full mt-1 inline-block">
                                  Low Stock: {item.currentStock}
                              </span>
                          </div>
                          <ShoppingBag className="text-teal-500" />
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 flex-1">
                          <div className="flex justify-between">
                              <span>Suggestion:</span>
                              <span className="font-medium">+{item.suggestedQty} Units</span>
                          </div>
                          <div className="flex justify-between">
                              <span>Vendor:</span>
                              <span>{item.vendorName}</span>
                          </div>
                          <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                              <span>Est. Cost:</span>
                              <span className="font-bold text-gray-800">{formatCurrency(item.estimatedCost)}</span>
                          </div>
                      </div>

                      <button 
                        onClick={() => handleOrder(idx)}
                        className="mt-6 w-full flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg transition-colors"
                      >
                          <Truck size={16} />
                          <span>Place Order</span>
                      </button>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};