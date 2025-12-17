import React, { useEffect, useState } from 'react';
import { Medicine, Sale } from '../types';
import { db } from '../services/db';
import { DollarSign, AlertTriangle, TrendingUp, Package, Lightbulb, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, PieChart, Pie, Legend } from 'recharts';

interface DashboardProps {
  formatCurrency: (value: number) => string;
}

export const Dashboard: React.FC<DashboardProps> = ({ formatCurrency }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    setSales(db.getSales());
    setMedicines(db.getMedicines());
  }, []);

  useEffect(() => {
    if (sales.length > 0 || medicines.length > 0) {
      setInsights(generateLocalInsights(sales, medicines));
    }
  }, [sales, medicines]);

  const generateLocalInsights = (salesData: Sale[], inventoryData: Medicine[]): string[] => {
    const results: string[] = [];
    const totalRev = salesData.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalProf = salesData.reduce((acc, s) => acc + s.totalProfit, 0);
    const margin = totalRev > 0 ? ((totalProf / totalRev) * 100).toFixed(1) : '0';
    results.push(`Net Profit Margin is ${margin}%. Aim for >20% for sustainability.`);

    const itemSales: Record<string, number> = {};
    salesData.forEach(s => s.items.forEach(i => {
      itemSales[i.medicineName] = (itemSales[i.medicineName] || 0) + i.quantity;
    }));
    const sortedItems = Object.entries(itemSales).sort((a, b) => b[1] - a[1]);
    if (sortedItems.length > 0) {
      results.push(`Top Performer: ${sortedItems[0][0]} with ${sortedItems[0][1]} units sold.`);
    }

    const criticalStock = inventoryData.filter(m => m.stock === 0).length;
    const lowStock = inventoryData.filter(m => m.stock > 0 && m.stock <= m.threshold).length;
    
    if (criticalStock > 0) {
      results.push(`Critical: ${criticalStock} items are completely out of stock.`);
    } else if (lowStock > 0) {
      results.push(`Attention: ${lowStock} items are running low.`);
    } else {
      results.push("Inventory levels are healthy across the board.");
    }

    return results;
  };

  const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalProfit = sales.reduce((acc, s) => acc + s.totalProfit, 0);
  const lowStockCount = medicines.filter(m => m.stock <= m.threshold).length;
  const criticalStockCount = medicines.filter(m => m.stock === 0).length;
  const healthyStockCount = medicines.filter(m => m.stock > m.threshold).length;
  const totalStock = medicines.reduce((acc, m) => acc + m.stock, 0);

  const lowStockItems = medicines
    .filter(m => m.stock <= m.threshold * 1.5)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 10);

  const stockHealthData = [
    { name: 'Healthy', value: healthyStockCount, color: '#10b981' },
    { name: 'Low Stock', value: lowStockCount, color: '#f59e0b' },
    { name: 'Out of Stock', value: criticalStockCount, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800 mt-2">{value}</h3>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color} shadow-sm`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome back, here's what's happening today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(totalRevenue)} 
          icon={DollarSign} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Total Profit" 
          value={formatCurrency(totalProfit)} 
          icon={TrendingUp} 
          color="bg-blue-500" 
          subtext="Net earnings"
        />
        <StatCard 
          title="Low Stock Alerts" 
          value={lowStockCount + criticalStockCount} 
          icon={AlertTriangle} 
          color="bg-red-500" 
          subtext="Items needing attention"
        />
        <StatCard 
          title="Total Inventory" 
          value={totalStock} 
          icon={Package} 
          color="bg-purple-500" 
          subtext="Units in stock"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Priority Refill List</h2>
                    <div className="h-64">
                        {lowStockItems.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={lowStockItems} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={10} interval={0} angle={-15} textAnchor="end" height={40} tick={{fill: '#6b7280'}} />
                                <YAxis fontSize={12} tick={{fill: '#6b7280'}} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="stock" name="Current Stock" radius={[4, 4, 0, 0]}>
                                    {lowStockItems.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.stock === 0 ? '#ef4444' : entry.stock <= entry.threshold ? '#f59e0b' : '#3b82f6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-center">
                                <p>All items above threshold.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <PieChartIcon size={18} className="text-gray-500"/>
                        Stock Health
                    </h2>
                    <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stockHealthData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stockHealthData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Sales</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                    <thead>
                        <tr className="text-gray-400 text-sm border-b border-gray-100">
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Customer</th>
                        <th className="pb-3 font-medium">Items</th>
                        <th className="pb-3 font-medium text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sales.slice().reverse().slice(0, 5).map((sale) => (
                        <tr key={sale.id} className="text-sm">
                            <td className="py-3 text-gray-600">{new Date(sale.date).toLocaleDateString()}</td>
                            <td className="py-3 text-gray-800 font-medium">{sale.customerName || 'Walk-in'}</td>
                            <td className="py-3 text-gray-600">{sale.items.length} items</td>
                            <td className="py-3 text-right font-medium text-teal-600">{formatCurrency(sale.totalAmount)}</td>
                        </tr>
                        ))}
                        {sales.length === 0 && (
                        <tr>
                            <td colSpan={4} className="py-4 text-center text-gray-400">No sales recorded yet.</td>
                        </tr>
                        )}
                    </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6 h-fit">
          <div className="flex items-center space-x-2 mb-4">
            <Lightbulb className="text-indigo-600" size={20} />
            <h2 className="text-lg font-bold text-indigo-900">Business Insights</h2>
          </div>
          
          <div className="space-y-4">
            {insights.length > 0 ? (
               <ul className="space-y-3">
                 {insights.map((insight, idx) => (
                   <li key={idx} className="flex items-start space-x-2 text-sm text-indigo-800">
                     <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                     <span className="leading-relaxed">{insight}</span>
                   </li>
                 ))}
               </ul>
            ) : (
              <p className="text-sm text-indigo-400 opacity-70">Make some sales to generate insights!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};