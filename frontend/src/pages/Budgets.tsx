import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Trash2, AlertCircle, Archive, Edit2 } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { translations } from '../i18n/translations';

const Budgets = () => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ category_id: '', limit: '', period: 'month' });

  const { language } = useSettingsStore();
  const t = translations[language];

  const fetchData = async () => {
    const [bRes, cRes] = await Promise.all([
        api.get(`/budgets/?archived=${showArchived}`),
        api.get('/categories/')
    ]);
    setBudgets(bRes.data);
    setCategories(cRes.data.filter((c:any) => c.type === 'expense'));
  };

  useEffect(() => { fetchData(); }, [showArchived]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        if (editingId) {
             await api.put(`/budgets/${editingId}`, {
                 limit: parseFloat(formData.limit),
                 period: formData.period
             });
        } else {
             await api.post('/budgets/', { 
                 category_id: formData.category_id, 
                 limit: parseFloat(formData.limit),
                 period: formData.period
             });
        }
        setShowModal(false);
        setEditingId(null);
        setFormData({ category_id: '', limit: '', period: 'month' });
        fetchData();
    } catch (e) { alert("Error saving budget"); }
  };

  const handleDelete = async (id: number) => {
    if(confirm(t.confirmDelete)) {
        await api.delete(`/budgets/${id}`);
        fetchData();
    }
  }

  const handleEdit = (b: any) => {
      setEditingId(b.id);
      setFormData({ category_id: String(b.category_id), limit: String(b.limit), period: b.period });
      setShowModal(true);
  }

  const handleArchive = async (id: number, currentStatus: boolean) => {
      await api.put(`/budgets/${id}`, { archived: !currentStatus });
      fetchData();
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.budgets}</h2>
                <p className="text-gray-500 dark:text-gray-400">{t.trackLimits}</p>
            </div>
            <div className="flex gap-2">
                 <button onClick={() => setShowArchived(!showArchived)} className={`px-4 py-2 rounded-lg flex items-center gap-2 border transition ${showArchived ? 'bg-gray-200 dark:bg-gray-700 dark:text-white' : 'bg-white dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'}`}>
                    <Archive size={18} /> {showArchived ? t.hideArchived : t.showArchived}
                </button>
                <button onClick={() => { setEditingId(null); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                    <Plus size={18} /> {t.setBudget}
                </button>
            </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map(b => (
                <div key={b.id} className={`bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden ${b.archived ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{b.category_name}</h3>
                            <span className="text-xs text-gray-400 uppercase bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                {b.period === 'month' ? t.monthly : t.yearly}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleEdit(b)} className="text-gray-300 hover:text-blue-500"><Edit2 size={16} /></button>
                            <button onClick={() => handleArchive(b.id, b.archived)} className="text-gray-300 hover:text-blue-500"><Archive size={16} /></button>
                            <button onClick={() => handleDelete(b.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                    </div>
                    
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500 dark:text-gray-400">{t.spent}: <b className="text-gray-800 dark:text-gray-200">{b.spent}</b></span>
                        <span className="text-gray-500 dark:text-gray-400">{t.limit}: <b className="text-gray-800 dark:text-gray-200">{b.limit}</b></span>
                    </div>
                    
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-2">
                        <div 
                            className={`h-3 rounded-full transition-all duration-500 ${b.percentage > 90 ? 'bg-red-500' : b.percentage > 75 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                            style={{width: `${Math.min(b.percentage, 100)}%`}}
                        ></div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        {b.percentage >= 100 ? (
                            <span className="text-red-600 font-bold flex items-center gap-1"><AlertCircle size={12}/> {t.overBudget}</span>
                        ) : (
                            <span className="text-gray-400">{b.remaining} {t.remaining}</span>
                        )}
                    </div>
                </div>
            ))}
            {budgets.length === 0 && <p className="text-gray-500 dark:text-gray-400 col-span-3 text-center py-10">{t.noBudgets}</p>}
       </div>

       {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-sm border border-gray-100 dark:border-gray-700 shadow-2xl">
                <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">{editingId ? t.editBudget : t.setCategoryBudget}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!editingId && (
                        <select 
                            className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white" 
                            required 
                            onChange={e => setFormData({...formData, category_id: e.target.value})}
                        >
                            <option value="">{t.category}</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    )}
                    <input 
                        type="number" 
                        placeholder={t.limit} 
                        className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" 
                        value={formData.limit}
                        required 
                        onChange={e => setFormData({...formData, limit: e.target.value})} 
                    />
                    <select 
                        className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                        value={formData.period}
                        onChange={e => setFormData({...formData, period: e.target.value})}
                    >
                        <option value="month">{t.monthly}</option>
                        <option value="year">{t.yearly}</option>
                    </select>
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">{t.cancel}</button>
                        <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t.save}</button>
                    </div>
                </form>
            </div>
        </div>
       )}
    </div>
  );
};

export default Budgets;
