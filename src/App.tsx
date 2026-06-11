import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { LandingPage } from './pages/LandingPage';
import { MapPage } from './pages/MapPage';
import { RoutePlanningPage } from './pages/RoutePlanningPage';
import { AccessibilityDashboard } from './pages/AccessibilityDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { LoginPage, RegisterPage } from './pages/AuthPage';
import { AboutPage } from './pages/AboutPage';
import { VoiceAssistant } from './components/voice/VoiceAssistant';
import { useAuthStore } from './stores/authStore';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-kigali-green" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<'en' | 'rw'>('en');

  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();

    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === 'true');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }

    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage as 'en' | 'rw');
    }
  }, [initialize]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleLanguage = () => setLanguage(language === 'en' ? 'rw' : 'en');

  return (
    <BrowserRouter>
      <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/map"
            element={
              <>
                <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} language={language} toggleLanguage={toggleLanguage} />
                <MapPage />
              </>
            }
          />
          <Route
            path="/routes"
            element={
              <>
                <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} language={language} toggleLanguage={toggleLanguage} />
                <RoutePlanningPage />
              </>
            }
          />
          <Route
            path="/accessibility"
            element={
              <>
                <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} language={language} toggleLanguage={toggleLanguage} />
                <AccessibilityDashboard />
              </>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} language={language} toggleLanguage={toggleLanguage} />
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/about"
            element={
              <>
                <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} language={language} toggleLanguage={toggleLanguage} />
                <AboutPage />
              </>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <VoiceAssistant />
      </div>
    </BrowserRouter>
  );
}

export default App;
