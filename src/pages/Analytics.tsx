import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { db } from '../services/db';
import { Sale, Medicine } from '../types';
import { FileSpreadsheet } from 'lucide-react';

interface AnalyticsProps {
  formatCurrency: (value: number) => string;
}

export const Analytics: React.FC<AnalyticsProps> = ({ formatCurrency }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  useEffect(() => {
    setSales(db.getSales());
    setMedicines(db.getMedicines());
  }, []);

  // Prepare data for bar/line charts
  const salesByDate = sales.reduce((acc, sale) => {
    const date = new Date(sale.date).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { date, amount: 0, profit: 0 };
    }
    acc[date].amount += sale.totalAmount;
    acc[date].profit += sale.totalProfit;
    return acc;
  }, {} as Record<string, any>);

  const chartData = Object.values(salesByDate);

  // Prepare Pie Chart Data (Category Breakdown)
  const medicinesMap = medicines.reduce((acc, med) => {
    acc[med.id] = med;
    return acc;
  }, {} as Record<string, Medicine>);

  const categoryStats = sales.reduce((acc, sale) => {
    sale.items.forEach(item => {
        // Fallback to finding by name if ID lookup fails (legacy data safety)
        let med = medicinesMap[item.medicineId];
        if (!med) {
             med = medicines.find(m => m.name === item.medicineName) as Medicine;
        }
        
        const category = med ? med.category : 'Uncategorized';
        
        if (!acc[category]) {
            acc[category] = { name: category, sales: 0, profit: 0 };
        }
        
        const itemRevenue = item.priceAtSale * item.quantity;
        const itemCost = item.costAtSale * item.quantity;
        
        acc[category].sales += itemRevenue;
        acc[category].profit += (itemRevenue - itemCost);
    });
    return acc;
  }, {} as Record<string, {name: string, sales: number, profit: number}>);

  const pieData = Object.values(categoryStats).filter(d => d.sales > 0);
  
  // Vibrant color palette for charts
  const COLORS = ['#0d9488', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

  const handleDownloadCSV = () => {
    const csv = db.exportSalesToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Tooltip for Pie Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg">
          <p className="font-bold text-gray-700">{payload[0].name}</p>
          <p className="text-sm text-gray-500">
            Value: <span className="font-medium text-gray-900">{formatCurrency(payload[0].value)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Financial Analytics</h1>
            <p className="text-gray-500">Deep dive into your pharmacy's performance.</p>
        </div>
        <button 
            onClick={handleDownloadCSV}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm"
        >
            <FileSpreadsheet size={18} />
            <span>Export Excel Report</span>
        </button>
      </div>

      {/* Row 1: Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-6">Daily Revenue & Profit</h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => formatCurrency(val).replace(/\.00$/, '')} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => formatCurrency(value)}
                            cursor={{ fill: '#f8fafc' }}
                        />
                        <Bar dataKey="amount" name="Revenue" fill="#0d9488" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="profit" name="Profit" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-6">Profit Trend</h3>
            <div className="h-80">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => formatCurrency(val).replace(/\.00$/, '')} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Line type="monotone" dataKey="profit" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Row 2: Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-6">Sales by Category</h3>
            <div className="h-80">
                {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="sales"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip />} />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">No sales data available</div>
                )}
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-6">Profit by Category</h3>
            <div className="h-80">
                 {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="profit"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip />} />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                     <div className="h-full flex items-center justify-center text-gray-400">No sales data available</div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};