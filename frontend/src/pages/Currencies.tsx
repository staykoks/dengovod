import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { RefreshCw, Save } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSettingsStore } from '../store/settingsStore';
import { translations } from '../i18n/translations';

const Currencies = () => {
    const [rates, setRates] = useState<Record<string, number>>({});
    const [history, setHistory] = useState<any[]>([]);
    const [base, setBase] = useState('RUB');
    const [target, setTarget] = useState('USD');
    const [loading, setLoading] = useState(false);
    
    // For manual edit
    const [editTarget, setEditTarget] = useState('');
    const [editRate, setEditRate] = useState('');

    const { language, theme } = useSettingsStore();
    const t = translations[language];

    const fetchRates = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/currencies/rates?base=${base}`);
            setRates(res.data.rates);
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };
    
    const fetchHistory = async () => {
        try {
            const res = await api.get(`/currencies/history?base=${base}&target=${target}`);
            setHistory(res.data);
        } catch(e) { console.error(e); }
    }

    useEffect(() => {
        fetchRates();
    }, [base]);

    useEffect(() => {
        fetchHistory();
    }, [base, target]);

    const handleManualUpdate = async () => {
        if(!editTarget || !editRate) return;
        try {
            await api.post('/currencies/manual', {
                base, target: editTarget, rate: parseFloat(editRate)
            });
            fetchRates();
            setEditTarget('');
            setEditRate('');
        } catch(e) { alert("Error updating rate"); }
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.exchangeRates}</h2>
                <div className="flex gap-2 items-center">
                    <span className="text-gray-600 dark:text-gray-400">{t.base}:</span>
                    <select value={base} onChange={e => setBase(e.target.value)} className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white">
                        <option value="RUB">RUB</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="CNY">CNY</option>
                    </select>
                    <button onClick={fetchRates} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>
            
            {/* History Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-gray-800 dark:text-white">{t.rateHistory} ({base} / {target})</h3>
                     <select value={target} onChange={e => setTarget(e.target.value)} className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white">
                        {Object.keys(rates).map(r => <option key={r} value={r}>{r}</option>)}
                     </select>
                </div>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                            <XAxis dataKey="date" tick={{fontSize: 12, fill: '#9ca3af'}} minTickGap={30} />
                            <YAxis domain={['auto', 'auto']} tick={{fontSize: 12, fill: '#9ca3af'}} />
                            <Tooltip 
                                contentStyle={{
                                    borderRadius: '8px', 
                                    border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb', 
                                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', 
                                    color: theme === 'dark' ? '#fff' : '#111827'
                                }}
                                formatter={(value: any) => [value, t.rate]}
                            />
                            <Line type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={2} dot={false} name={t.rate} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Rate Table */}
                <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="p-4 text-left text-gray-600 dark:text-gray-300">{t.currencies}</th>
                                <th className="p-4 text-left text-gray-600 dark:text-gray-300">{t.rateHistory} (1 {base} =)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {Object.entries(rates).map(([curr, rate]) => (
                                <tr key={curr} className="text-gray-800 dark:text-gray-200">
                                    <td className="p-4 font-medium">{curr}</td>
                                    <td className="p-4">{rate.toFixed(4)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Manual Override */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
                    <h3 className="font-bold mb-4 text-gray-900 dark:text-white">{t.manualOverride}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t.manualOverrideDesc}</p>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-700 dark:text-gray-300">{t.targetCurrency} ({t.egUSD})</label>
                            <input value={editTarget} onChange={e => setEditTarget(e.target.value.toUpperCase())} className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg mt-1 dark:bg-gray-700 dark:text-white" />
                        </div>
                        <div>
                            <label className="text-sm text-gray-700 dark:text-gray-300">{t.newRate}</label>
                            <input type="number" step="0.0001" value={editRate} onChange={e => setEditRate(e.target.value)} className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg mt-1 dark:bg-gray-700 dark:text-white" />
                        </div>
                        <button onClick={handleManualUpdate} className="w-full bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700">
                            <Save size={16} /> {t.saveRate}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Currencies;
