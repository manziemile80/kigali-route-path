import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Map, Route, BarChart3, Settings, Info, User, LogOut, Sun, Moon, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  language: 'en' | 'rw';
  toggleLanguage: () => void;
}

export function Header({ darkMode, toggleDarkMode, language, toggleLanguage }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user, signOut } = useAuthStore();

  const navLinks = [
    { path: '/', label: { en: 'Home', rw: 'Ahabanza' }, icon: Map },
    { path: '/map', label: { en: 'Map', rw: 'Ikibazo' }, icon: Map },
    { path: '/routes', label: { en: 'Route Planning', rw: 'Gahunda yUmuhanda' }, icon: Route },
    { path: '/accessibility', label: { en: 'Accessibility', rw: 'Uburwego' }, icon: BarChart3 },
    { path: '/admin', label: { en: 'Admin', rw: 'Ubuyobozi' }, icon: Settings, adminOnly: true },
    { path: '/about', label: { en: 'About', rw: 'Abo turibo' }, icon: Info },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const filteredLinks = navLinks.filter(
    (link) => !link.adminOnly || (isAuthenticated && user?.role === 'admin')
  );

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 shadow-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-kigali-green to-kigali-blue flex items-center justify-center">
              <Map className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {language === 'en' ? 'Kigali GIS' : 'GIS ya Kigali'}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'en' ? 'Smart Route Planning' : 'Gahunda yUmuhanda'}
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {filteredLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-kigali-green/10 text-kigali-green'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <link.icon className="w-4 h-4" />
                <span>{language === 'en' ? link.label.en : link.label.rw}</span>
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={language === 'en' ? 'Switch to Kinyarwanda' : 'Switch to English'}
            >
              <Globe className="w-5 h-5" />
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>{user?.full_name || user?.email}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg bg-kigali-green text-white text-sm font-medium hover:bg-kigali-green/90 transition-colors"
              >
                {language === 'en' ? 'Sign In' : 'Kwinjira'}
              </Link>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <nav className="px-4 py-3 space-y-1">
            {filteredLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-kigali-green/10 text-kigali-green'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <link.icon className="w-5 h-5" />
                <span>{language === 'en' ? link.label.en : link.label.rw}</span>
              </Link>
            ))}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-3 mt-3 flex items-center space-x-2">
              <button
                onClick={toggleLanguage}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Globe className="w-5 h-5" />
              </button>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              {isAuthenticated ? (
                <button
                  onClick={handleSignOut}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800"
                >
                  <LogOut className="w-5 h-5" />
                  <span>{language === 'en' ? 'Sign Out' : 'Gusohoka'}</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex-1 block text-center px-4 py-2 rounded-lg bg-kigali-green text-white text-sm font-medium"
                >
                  {language === 'en' ? 'Sign In' : 'Kwinjira'}
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
