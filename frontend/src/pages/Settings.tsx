import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { Save, Download, Upload, User, Settings as SettingsIcon, Bell, Lock, FileText, Image } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useSettingsStore } from '../store/settingsStore';
import { translations } from '../i18n/translations';

const Settings = () => {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const { register, handleSubmit, setValue, reset, watch } = useForm();
  const { language } = useSettingsStore();
  const t = translations[language];
  
  // States for export
  const [exportStart, setExportStart] = useState('');
  const [exportEnd, setExportEnd] = useState('');

  // States for password form
  const [passError, setPassError] = useState('');
  
  useEffect(() => {
    if (user) {
        setValue('name', user.name);
        setValue('base_currency', user.currency || 'RUB');
    }
  }, [user]);

  const onProfileUpdate = async (data: any) => {
    try {
        setPassError('');
        const res = await api.put('/settings/profile', data);
        updateUser({
            name: res.data.user.name,
            currency: res.data.user.currency
        });
        alert(t.saveChanges + "!");
        // Clear password fields on success
        setValue('old_password', '');
        setValue('new_password', '');
    } catch (e: any) { 
        setPassError(e.response?.data?.msg || "Failed to update"); 
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, endpoint: string, updateKey: string) => {
      if (!e.target.files?.[0]) return;
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      try {
          const res = await api.post(`/settings/${endpoint}`, formData);
          updateUser({ [updateKey]: res.data[updateKey] });
      } catch(e) { alert("Upload failed"); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.[0]) return;
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      try {
          const res = await api.post('/settings/import', formData);
          alert(res.data.msg);
      } catch(e: any) { alert(e.response?.data?.msg || "Import failed"); }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
      try {
          const endpoint = format === 'csv' ? '/settings/export' : '/settings/export_pdf';
          const params = `?start_date=${exportStart}&end_date=${exportEnd}&lang=${language}`;
          const response = await api.get(endpoint + params, { responseType: 'blob' });
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          const ext = format === 'csv' ? 'csv' : 'pdf';
          link.setAttribute('download', `finance_report.${ext}`);
          document.body.appendChild(link);
          link.click();
      } catch(e) { alert("Export failed"); }
  }

  const avatarUrl = user?.avatar ? `/uploads/${user.avatar}` : null;

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.settings}</h2>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[500px] flex flex-col md:flex-row">
            {/* Sidebar Tabs */}
            <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-700 p-4 space-y-2">
                <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'profile' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <User size={18}/> {t.profileSecurity}
                </button>
                <button onClick={() => setActiveTab('financial')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'financial' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <SettingsIcon size={18}/> {t.financialPrefs}
                </button>
                <button onClick={() => setActiveTab('data')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'data' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <FileText size={18}/> {t.dataExport}
                </button>
                 <button onClick={() => setActiveTab('notifications')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'notifications' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <Bell size={18}/> {t.notifications}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-8 text-gray-900 dark:text-gray-200">
                {activeTab === 'profile' && (
                    <div className="max-w-md space-y-8">
                        <div>
                            <h3 className="text-lg font-bold mb-4">{t.changeAvatar}</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border dark:border-gray-600">
                                    {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 text-gray-400"/>}
                                </div>
                                <div>
                                    <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={(e) => handleFile(e, 'avatar', 'avatar')} />
                                    <label htmlFor="avatar-upload" className="cursor-pointer bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-600">
                                        {t.changeAvatar}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit(onProfileUpdate)} className="space-y-6">
                            <h3 className="text-lg font-bold">{t.displayName}</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.displayName}</label>
                                <input {...register('name')} className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                            </div>
                            
                            <div className="border-t dark:border-gray-700 pt-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Lock size={18}/> {t.changePassword}</h3>
                                {passError && <p className="text-red-500 text-sm mb-2">{passError}</p>}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.currentPassword}</label>
                                        <input type="password" {...register('old_password')} className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.newPassword}</label>
                                        <input type="password" {...register('new_password')} className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                                    </div>
                                </div>
                            </div>

                            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                                <Save size={18} /> {t.saveChanges}
                            </button>
                        </form>
                    </div>
                )}
                
                {activeTab === 'financial' && (
                    <div className="max-w-md space-y-6">
                         <form onSubmit={handleSubmit(onProfileUpdate)} className="space-y-6">
                             <h3 className="text-lg font-bold">{t.baseCurrency}</h3>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.baseCurrency}</label>
                                <select {...register('base_currency')} className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white">
                                    <option value="RUB">RUB - Russian Ruble</option>
                                    <option value="USD">USD - US Dollar</option>
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="GBP">GBP - British Pound</option>
                                    <option value="CNY">CNY - Chinese Yuan</option>
                                </select>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.currencyNote}</p>
                             </div>
                             <button className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                                <Save size={18} /> {t.updatePref}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'data' && (
                     <div className="max-w-md space-y-8">
                        <div>
                            <h3 className="text-lg font-bold mb-4">{t.exportReports}</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-600 dark:text-gray-400">{t.startDate}</label>
                                        <input type="date" value={exportStart} onChange={e => setExportStart(e.target.value)} className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg mt-1 dark:bg-gray-700 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600 dark:text-gray-400">{t.endDate}</label>
                                        <input type="date" value={exportEnd} onChange={e => setExportEnd(e.target.value)} className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg mt-1 dark:bg-gray-700 dark:text-white" />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => handleExport('csv')} className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                        <Download size={18} /> CSV
                                    </button>
                                    <button onClick={() => handleExport('pdf')} className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition">
                                        <FileText size={18} /> PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="border-t dark:border-gray-700 pt-6">
                            <h3 className="text-lg font-bold mb-4">{t.importData}</h3>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition relative">
                                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{t.clickUpload}</p>
                                <p className="text-xs text-gray-400 mt-1">{t.csvFormat}</p>
                                <input type="file" onChange={handleImport} className="absolute inset-0 opacity-0 cursor-pointer" accept=".csv" />
                            </div>
                        </div>
                     </div>
                )}
                
                {activeTab === 'notifications' && (
                    <div className="max-w-md">
                         <h3 className="text-lg font-bold mb-4">{t.notifications}</h3>
                         <div className="space-y-4">
                             <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                 <span>{t.budgetAlerts}</span>
                                 <input type="checkbox" className="w-5 h-5" defaultChecked />
                             </div>
                             <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                 <span>{t.monthlyEmail}</span>
                                 <input type="checkbox" className="w-5 h-5" />
                             </div>
                         </div>
                         <p className="text-xs text-gray-400 mt-4">{t.emailNote}</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default Settings;