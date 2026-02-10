import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Trash2, Edit2, Filter, Search, Paperclip, X, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useSettingsStore } from '../store/settingsStore';
import { translations } from '../i18n/translations';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Filters
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const { register, handleSubmit, reset, setValue, watch } = useForm<any>({
    defaultValues: {
      type: 'expense',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      category_id: '',
      currency: 'RUB'
    }
  });

  // Watch type to filter categories in modal
  const transactionType = watch('type');

  const { language } = useSettingsStore();
  const t = translations[language];

  const fetchTransactions = async () => {
    try {
      const res = await api.get(`/transactions/?type=${filterType}&category_id=${filterCategory}&search=${searchTerm}&start_date=${startDate}&end_date=${endDate}`);
      setTransactions(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCategories = async () => {
    try {
        const res = await api.get('/categories/');
        setCategories(res.data);
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    fetchTransactions();
  }, [filterType, filterCategory, searchTerm, startDate, endDate]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm(t.confirmDelete)) {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
    }
  };

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    reset({
        amount: t.amount,
        description: t.description,
        date: t.date.split('T')[0],
        type: t.type,
        category_id: t.category_id,
        currency: t.currency
    });
    setShowModal(true);
  }

  const handleAddNew = () => {
      setEditingId(null);
      reset({
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        currency: 'RUB',
        amount: '',
        description: '',
        category_id: ''
      });
      setShowModal(true);
  }

  const onSubmit = async (data: any) => {
    try {
      if (editingId) {
          // Edit
          await api.put(`/transactions/${editingId}`, data);
      } else {
          // Create
          const formData = new FormData();
          formData.append('amount', data.amount);
          formData.append('description', data.description);
          formData.append('date', data.date);
          formData.append('type', data.type);
          formData.append('category_id', data.category_id);
          formData.append('currency', data.currency || 'RUB');
          if (data.file && data.file[0]) {
              formData.append('file', data.file[0]);
          }
          await api.post('/transactions/', formData);
      }
      setShowModal(false);
      reset();
      fetchTransactions();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.transactions}</h2>
            <p className="text-gray-500 dark:text-gray-400">{t.manageIncomeExpense}</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm"
        >
          <Plus size={18} /> {t.addNew}
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center flex-wrap">
        <div className="relative flex-1 w-full min-w-[200px]">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder={t.search} 
                className="pl-10 w-full p-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-lg focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        {/* Type Filter */}
        <select 
            className="p-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-lg border-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
        >
            <option value="all">{t.allTypes}</option>
            <option value="income">{t.income}</option>
            <option value="expense">{t.expense}</option>
        </select>
        
        {/* Category Filter */}
        <select 
            className="p-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-lg border-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none max-w-[200px]"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
        >
            <option value="">{t.allCategories}</option>
            {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
            ))}
        </select>

        <div className="flex gap-2 items-center text-gray-600 dark:text-gray-400">
            <span className="text-sm">{t.from}</span>
            <input type="date" className="p-2 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-lg" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <span className="text-sm">{t.to}</span>
            <input type="date" className="p-2 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-lg" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
              <tr>
                <th className="p-4 text-left font-semibold text-gray-600 dark:text-gray-300">{t.date}</th>
                <th className="p-4 text-left font-semibold text-gray-600 dark:text-gray-300">{t.type}</th>
                <th className="p-4 text-left font-semibold text-gray-600 dark:text-gray-300">{t.category}</th>
                <th className="p-4 text-left font-semibold text-gray-600 dark:text-gray-300">{t.description}</th>
                <th className="p-4 text-right font-semibold text-gray-600 dark:text-gray-300">{t.amount}</th>
                <th className="p-4 text-center font-semibold text-gray-600 dark:text-gray-300">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {transactions.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 group">
                  <td className="p-4 text-gray-600 dark:text-gray-300">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="p-4">
                     {t.type === 'income' ? 
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded text-xs font-bold uppercase">{translations[language].income}</span> : 
                        <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded text-xs font-bold uppercase">{translations[language].expense}</span>
                     }
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: t.category_color}}></div>
                        <span>{t.category_name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">
                     <div className="flex items-center gap-2">
                        {t.description}
                        {t.attachment && <Paperclip size={14} className="text-gray-400" />}
                     </div>
                  </td>
                  <td className={`p-4 text-right font-bold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    <div className="flex flex-col items-end">
                        <span>{t.type === 'income' ? '+' : '-'}{t.amount_in_base.toLocaleString()} {t.base_currency}</span>
                        {t.currency !== t.base_currency && (
                            <span className="text-xs text-gray-400 font-normal">
                                {translations[language].orig} {t.amount.toLocaleString()} {t.currency}
                            </span>
                        )}
                    </div>
                  </td>
                  <td className="p-4 text-center flex justify-center gap-2">
                    <button onClick={() => handleEdit(t)} className="text-gray-400 hover:text-blue-500 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30">
                        <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{editingId ? t.edit : t.addNew}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.type}</label>
                  <select {...register('type')} className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white">
                    <option value="expense">{t.expense}</option>
                    <option value="income">{t.income}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.amount}</label>
                  <input type="number" step="0.01" {...register('amount', { required: true })} className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" placeholder="0.00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.currency}</label>
                    <select {...register('currency')} className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white">
                        <option value="RUB">RUB</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="CNY">CNY</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.category}</label>
                    <select {...register('category_id', { required: true })} className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white">
                    <option value="">{t.selectCategory}</option>
                    {categories
                        .filter(c => c.type === (transactionType || 'expense'))
                        .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.description}</label>
                <input type="text" {...register('description')} className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.date}</label>
                  <input type="date" {...register('date')} className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
              </div>

              {!editingId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.attachment}</label>
                    <input type="file" {...register('file')} className="w-full text-sm text-gray-500" />
                  </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg">{t.cancel}</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex justify-center items-center gap-2">
                    <Save size={18} /> {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;