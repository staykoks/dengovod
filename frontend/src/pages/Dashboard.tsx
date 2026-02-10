import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  ArrowUpCircle, ArrowDownCircle, DollarSign, Euro, PoundSterling, JapaneseYen, RussianRuble, Coins,
  CreditCard, Activity, Plus, RefreshCw 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import { translations } from '../i18n/translations';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const getCurrencyIcon = (currencyCode: string) => {
  switch (currencyCode) {
    case 'USD': return DollarSign;
    case 'EUR': return Euro;
    case 'GBP': return PoundSterling;
    case 'CNY': return JapaneseYen; // Yuan often shares symbol with Yen in icon sets or use generic
    case 'JPY': return JapaneseYen;
    case 'RUB': return RussianRuble;
    default: return Coins;
  }
};

const StatCard = ({ title, amount, currency, icon: Icon, color, subtext }: any) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition hover:shadow-md">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="text-2xl font-bold mt-2 text-gray-800 dark:text-white">
           {currency} {amount?.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2}) ?? '0'}
        </h3>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { language, theme } = useSettingsStore();
  const t = translations[language];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/analytics/summary');
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center text-blue-600">{t.loading}</div>;

  if (error) return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 text-gray-600 dark:text-gray-400">
      <p>{error}</p>
      <button onClick={fetchData} className="flex items-center gap-2 text-blue-600 hover:underline">
        <RefreshCw size={18} /> {t.retry}
      </button>
    </div>
  );

  if (!data) return null;

  // Helper to translate month names if they match standard abbreviations
  const formatXAxis = (tickItem: string) => {
      // Backend returns "Jan", "Feb" etc. Try to map them.
      // If it's something else (e.g. date), return as is.
      if (t.months && t.months[tickItem as keyof typeof t.months]) {
          return t.months[tickItem as keyof typeof t.months];
      }
      return tickItem;
  };

  const CurrencyIcon = getCurrencyIcon(data.currency);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.dashboard}</h1>
           <p className="text-gray-500 dark:text-gray-400">{t.welcomeBack}</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => navigate('/transactions')} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm transition">
             <Plus size={18} /> {t.addNew}
           </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t.totalBalance} amount={data.balance} currency={data.currency} icon={CurrencyIcon} color="text-blue-600 bg-blue-600" />
        <StatCard title={t.monthlyIncome} amount={data.total_income} currency={data.currency} icon={ArrowUpCircle} color="text-green-600 bg-green-600" />
        <StatCard title={t.monthlyExpense} amount={data.total_expenses} currency={data.currency} icon={ArrowDownCircle} color="text-red-600 bg-red-600" />
        <StatCard title={t.availableFunds} amount={data.balance} currency={data.currency} icon={CreditCard} color="text-purple-600 bg-purple-600" />
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Income vs Expenses Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-gray-800 dark:text-white">{t.cashFlow}</h3>
             <Activity className="text-gray-400" size={20} />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.bar_data || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9ca3af', fontSize: 12}} 
                    dy={10} 
                    tickFormatter={formatXAxis}
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
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
                <Legend iconType="circle" formatter={(value) => value === 'income' ? t.income : t.expense}/>
                <Bar dataKey="income" fill="#10b981" name="income" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="expense" fill="#ef4444" name="expense" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">{t.topExpenses}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.pie_data || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(data.pie_data || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => `${val.toFixed(2)} ${data.currency}`} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">{t.recentTransactions}</h3>
            <button onClick={() => navigate('/transactions')} className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">{t.viewAll}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.date}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.category}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.description}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.amount}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {(data.recent || []).map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {new Date(t.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
                      {t.category_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200 font-medium">
                    {t.description || '-'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'}{data.currency} {t.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </td>
                </tr>
              ))}
              {(data.recent || []).length === 0 && (
                <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">{t.noTransactions}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
