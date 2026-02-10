import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { translations } from '../i18n/translations';
import { 
  CheckCircle2, 
  BarChart3, 
  ShieldCheck, 
  Wallet, 
  ArrowRight, 
  LayoutDashboard,
  Users,
  Briefcase,
  GraduationCap,
  Languages
} from 'lucide-react';

const LandingPage = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const { language, setLanguage } = useSettingsStore();
  const t = translations[language];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
              <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" onError={(e) => {e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling?.classList.remove('hidden')}} />
              <div className="bg-blue-600 p-1.5 rounded-lg hidden">
                <Wallet className="text-white h-6 w-6" />
              </div>
              <span className="text-xl font-bold text-gray-900">{t.appName}</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('home')} className="text-gray-600 hover:text-blue-600 text-sm font-medium">{t.home}</button>
              <button onClick={() => scrollToSection('audience')} className="text-gray-600 hover:text-blue-600 text-sm font-medium">{t.whoIsItFor}</button>
              <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-blue-600 text-sm font-medium">{t.features}</button>
              <button onClick={() => scrollToSection('preview')} className="text-gray-600 hover:text-blue-600 text-sm font-medium">{t.preview}</button>
            </div>

            <div className="flex items-center gap-4">
               <button 
                  onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')} 
                  className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600"
               >
                 <Languages size={18} /> {language.toUpperCase()}
               </button>

              {token ? (
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-blue-600 text-white px-5 py-2 rounded-full font-medium hover:bg-blue-700 transition flex items-center gap-2"
                >
                  {t.dashboard} <ArrowRight size={16} />
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                  {t.login}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
          {t.heroTitle} <span className="text-blue-600">{t.heroSubtitle}</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          {t.heroDesc}
        </p>
        <div className="flex justify-center gap-4">
          {token ? (
            <button onClick={() => navigate('/dashboard')} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-xl">
              {t.goToDashboard}
            </button>
          ) : (
            <button onClick={() => navigate('/register')} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-xl">
              {t.getStartedFree}
            </button>
          )}
          <button onClick={() => scrollToSection('preview')} className="bg-gray-100 text-gray-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition">
            {t.seeHowItWorks}
          </button>
        </div>
      </section>

      {/* Who is it for? */}
      <section id="audience" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">{t.targetAudienceTitle}</h2>
            <p className="mt-4 text-gray-600">{t.targetAudienceDesc}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Briefcase className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t.freelancers}</h3>
              <p className="text-gray-500">{t.freelancersDesc}</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Users className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t.families}</h3>
              <p className="text-gray-500">{t.familiesDesc}</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <GraduationCap className="text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t.students}</h3>
              <p className="text-gray-500">{t.studentsDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">{t.everythingYouNeed}</h2>
            <p className="mt-4 text-gray-600">{t.powerfulTools}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              { icon: LayoutDashboard, title: t.smartDashboard, desc: t.smartDashboardDesc },
              { icon: CheckCircle2, title: t.budgetTracking, desc: t.budgetTrackingDesc },
              { icon: BarChart3, title: t.visualAnalytics, desc: t.visualAnalyticsDesc },
              { icon: ShieldCheck, title: t.secure, desc: t.secureDesc },
              { icon: Wallet, title: t.multiCurrency, desc: t.multiCurrencyDesc },
              { icon: Users, title: t.easyExport, desc: t.easyExportDesc }
            ].map((feature, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <feature.icon className="text-blue-600 h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Preview */}
      <section id="preview" className="py-20 bg-gray-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8">{t.experienceInterface}</h2>
          <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
            {t.interfaceDesc}
          </p>
          
          <div className="relative mx-auto max-w-4xl bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-2 md:p-4">
            <div className="absolute top-0 left-0 w-full h-full bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div>
            {/* 
              Switches image based on language:
              - EN: /preview.png
              - RU: /preview-ru.png
            */}
            <img 
              src={language === 'ru' ? "/preview-ru.png" : "/preview.png"}
              alt="Dengovod Interface Preview" 
              className="w-full h-auto rounded-lg shadow-inner border border-gray-700 object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="bg-blue-600 p-1 rounded">
              <Wallet className="text-white h-4 w-4" />
            </div>
            <span className="font-bold text-gray-900">{t.appName}</span>
          </div>
          <div className="text-gray-500 text-sm">
            © {new Date().getFullYear()} {t.appName} Inc. {t.footerRights}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;