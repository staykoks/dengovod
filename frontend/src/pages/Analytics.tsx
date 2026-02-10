import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { translations } from '../i18n/translations';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const Analytics = () => {
    const { user } = useAuthStore();
    const [data, setData] = useState<any>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [groupBy, setGroupBy] = useState('month'); // day, month
    const [period, setPeriod] = useState('year'); // month, year
    const [catFilter, setCatFilter] = useState('');

    const { language, theme } = useSettingsStore();
    const t = translations[language];

    const fetchCategories = async () => {
        try { const res = await api.get('/categories/'); setCategories(res.data); }
        catch(e) {}
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/analytics/summary?group_by=${groupBy}&period=${period}&category_id=${catFilter}`);
            setData(res.data);
        } catch(err) { console.error(err); }
        finally { setLoading(false); }
    };
    
    useEffect(() => { fetchCategories(); }, []);
    useEffect(() => { fetchData(); }, [groupBy, period, catFilter, user?.currency]); 

    if (loading) return <div className="p-8 text-gray-500 dark:text-gray-400">{t.loading}</div>;
    if (!data) return <div className="p-8 text-red-500">Failed to load analytics.</div>;

    // Helper to translate month names
    const formatXAxis = (tickItem: string) => {
        if (t.months && t.months[tickItem as keyof typeof t.months]) {
            return t.months[tickItem as keyof typeof t.months];
        }
        return tickItem;
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.reports}</h2>
                    <p className="text-gray-500 dark:text-gray-400">{t.financialInsights} {data.currency}.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white">
                        <option value="">{t.allCategories}</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={period} onChange={e => {
                        setPeriod(e.target.value);
                        // Auto-adjust group by for better UX
                        if (e.target.value === 'month') setGroupBy('day');
                        else setGroupBy('month');
                    }} className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white">
                        <option value="month">{t.currentMonth}</option>
                        <option value="year">{t.currentYear}</option>
                    </select>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-6">{t.incomeVsExpense}</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.bar_data || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{fill: '#9ca3af'}} 
                                    tickFormatter={formatXAxis}
                                />
                                <YAxis tick={{fill: '#9ca3af'}} />
                                <Tooltip 
                                    cursor={{fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}} 
                                    contentStyle={{
                                        borderRadius: '8px', 
                                        border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb', 
                                        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', 
                                        color: theme === 'dark' ? '#fff' : '#111827'
                                    }}
                                    formatter={(value: any, name: any) => [value, name === 'income' ? t.income : t.expense]}
                                    labelFormatter={formatXAxis}
                                />
                                <Legend formatter={(value) => value === 'income' ? t.income : t.expense} />
                                <Bar dataKey="income" fill="#10b981" name="income" />
                                <Bar dataKey="expense" fill="#ef4444" name="expense" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-6">{t.topExpenses}</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.pie_data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.pie_data.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => value.toFixed(2)} />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{color: '#9ca3af'}} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            
            {/* Balance Dynamics */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="font-bold text-gray-800 dark:text-white mb-6">{t.balanceDynamics}</h3>
                 <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.bar_data || []}>
                            <XAxis 
                                dataKey="name" 
                                tick={{fill: '#9ca3af'}} 
                                tickFormatter={formatXAxis}
                            />
                            <YAxis tick={{fill: '#9ca3af'}} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                            <Tooltip 
                                contentStyle={{
                                    borderRadius: '8px', 
                                    border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb', 
                                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', 
                                    color: theme === 'dark' ? '#fff' : '#111827'
                                }}
                                formatter={(value: any, name: any) => [value, name === 'income' ? t.income : t.expense]}
                                labelFormatter={formatXAxis}
                            />
                            <Area type="monotone" dataKey="income" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="income" />
                            <Area type="monotone" dataKey="expense" stackId="2" stroke="#8884d8" fill="#8884d8" name="expense" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 font-bold text-gray-700 dark:text-gray-200">{t.detailedReport}</div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-700">
                                <th className="p-3 text-left text-gray-600 dark:text-gray-400">{t.date}</th>
                                <th className="p-3 text-left text-gray-600 dark:text-gray-400">{t.category}</th>
                                <th className="p-3 text-left text-gray-600 dark:text-gray-400">{t.description}</th>
                                <th className="p-3 text-right text-gray-600 dark:text-gray-400">{t.amount} ({data.currency})</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {data.recent.map((t: any) => (
                                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                    <td className="p-3 text-gray-700 dark:text-gray-300">{new Date(t.date).toLocaleDateString()}</td>
                                    <td className="p-3 text-gray-700 dark:text-gray-300">{t.category_name}</td>
                                    <td className="p-3 text-gray-500 dark:text-gray-400">{t.description}</td>
                                    <td className={`p-3 text-right font-bold ${t.type==='income'?'text-green-600 dark:text-green-400':'text-red-600 dark:text-red-400'}`}>
                                        {t.amount.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default Analytics;
