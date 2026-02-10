import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { translations } from '../i18n/translations';
import { 
  LayoutDashboard, Wallet, LogOut, PieChart, PiggyBank, Tags, 
  Settings, Globe, User, Moon, Sun, Languages, Menu, X 
} from 'lucide-react';
import clsx from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { logout, user } = useAuthStore();
  const { theme, toggleTheme, language, setLanguage } = useSettingsStore();
  const location = useLocation();
  const t = translations[language];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: t.dashboard, path: '/dashboard', icon: LayoutDashboard },
    { label: t.transactions, path: '/transactions', icon: Wallet },
    { label: t.budgets, path: '/budgets', icon: PiggyBank },
    { label: t.analytics, path: '/analytics', icon: PieChart },
    { label: t.categories, path: '/categories', icon: Tags },
    { label: t.currencies, path: '/currencies', icon: Globe },
    { label: t.settings, path: '/settings', icon: Settings },
  ];

  const avatarUrl = user?.avatar 
    ? `/uploads/${user.avatar}` 
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row transition-colors duration-200">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-gray-800 p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-700 sticky top-0 z-40">
        <Link to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
           <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" onError={(e) => {e.currentTarget.style.display = 'none'}} />
           {!(document.querySelector('img[src="/logo.png"]') as HTMLImageElement | null)?.complete && <Wallet className="h-6 w-6" />}
           {t.appName}
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={clsx(
          "fixed md:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 transform",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-6 hidden md:block">
          <Link to="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400 block flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" onError={(e) => {e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling?.classList.remove('hidden')}} />
            <Wallet className="hidden" />
            {t.appName}
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto pt-4 md:pt-0">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                location.pathname === item.path
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>
        
        {/* Toggles */}
        <div className="px-6 py-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
             <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                 {theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}
             </button>
             <button onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold text-xs flex items-center gap-1">
                 <Languages size={18} /> {language.toUpperCase()}
             </button>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3 mb-4 px-2">
             {avatarUrl ? (
                 <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border dark:border-gray-600" />
             ) : (
                 <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <User size={20} />
                 </div>
             )}
             <div className="overflow-hidden">
                 <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                 <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
             </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
          >
            <LogOut size={20} />
            {t.logout}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full p-4 md:p-8 overflow-auto text-gray-900 dark:text-gray-100">
        {children}
      </main>
    </div>
  );
};

export default Layout;