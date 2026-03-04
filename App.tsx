import { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import SchedulePage from './components/SchedulePage';
import SignInPage from './components/SignInPage';
import TeacherHomePage from './components/TeacherHomePage';
import TeacherSchedulePage from './components/TeacherSchedulePage';
import HallMonitorPage from './components/HallMonitorPage';
import AdminPage from './components/AdminPage';
import HelpButton from './components/HelpButton';
import { Button } from './components/ui/button';
import { Home, LayoutDashboard, Calendar as CalendarIcon, LogOut, Moon, Sun } from 'lucide-react';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'schedule' | 'monitor'>('home');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userType, setUserType] = useState<'student' | 'teacher' | 'admin' | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load authentication from localStorage
  useEffect(() => {
    const storedEmail = localStorage.getItem('flowtrack-user-email');
    const storedType = localStorage.getItem('flowtrack-user-type');
    if (storedEmail && storedType) {
      setUserEmail(storedEmail);
      setUserType(storedType as 'student' | 'teacher' | 'admin');
    }
  }, []);

  // Load theme from localStorage and apply
  useEffect(() => {
    const storedTheme = localStorage.getItem('flowtrack-theme') as 'light' | 'dark' | null;
    if (storedTheme) {
      setTheme(storedTheme);
      if (storedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const handleSignIn = (email: string, type: 'student' | 'teacher' | 'admin') => {
    setUserEmail(email);
    setUserType(type);
    localStorage.setItem('flowtrack-user-email', email);
    localStorage.setItem('flowtrack-user-type', type);
  };

  const handleSignOut = () => {
    setUserEmail(null);
    setUserType(null);
    setCurrentPage('home');
    localStorage.removeItem('flowtrack-user-email');
    localStorage.removeItem('flowtrack-user-type');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('flowtrack-theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // If not signed in, show sign in page
  if (!userEmail || !userType) {
    return <SignInPage onSignIn={handleSignIn} />;
  }

  return (
    <div className="relative">
      {/* Navigation */}
      {userType === 'student' && (
        <>
          {currentPage === 'schedule' && (
            <>
              <div className="fixed top-2 left-2 md:top-4 md:left-4 z-50 flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => setCurrentPage('home')}
                  className="bg-purple-500 hover:bg-purple-600 text-white border-2 border-purple-600 shadow-lg"
                  size="lg"
                >
                  <Home className="w-5 h-5 sm:mr-2" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="border-2 border-purple-400 text-purple-700 hover:bg-purple-100 shadow-lg"
                  size="lg"
                >
                  <LogOut className="w-5 h-5 sm:mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
              <div className="fixed top-2 right-2 md:top-4 md:right-4 z-50">
                <Button
                  onClick={toggleTheme}
                  variant="outline"
                  className="border-2 border-purple-400 text-purple-700 hover:bg-purple-100 shadow-lg"
                  size="lg"
                >
                  {theme === 'light' ? <Moon className="w-5 h-5 sm:mr-2" /> : <Sun className="w-5 h-5 sm:mr-2" />}
                  <span className="hidden sm:inline">Theme</span>
                </Button>
              </div>
            </>
          )}
          {currentPage === 'home' && (
            <div className="fixed top-2 right-2 md:top-4 md:right-4 z-50 flex gap-2">
              <Button
                onClick={toggleTheme}
                variant="outline"
                className="border-2 border-purple-400 text-purple-700 hover:bg-purple-100 shadow-lg"
                size="lg"
              >
                {theme === 'light' ? <Moon className="w-5 h-5 sm:mr-2" /> : <Sun className="w-5 h-5 sm:mr-2" />}
                <span className="hidden sm:inline">Theme</span>
              </Button>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="border-2 border-purple-400 text-purple-700 hover:bg-purple-100 shadow-lg"
                size="lg"
              >
                <LogOut className="w-5 h-5 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          )}
        </>
      )}

      {userType === 'teacher' && (
        <div className="fixed top-2 left-2 md:top-4 md:left-4 z-50 flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => setCurrentPage('home')}
            className={`${
              currentPage === 'home'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-purple-700 hover:bg-purple-100'
            } border-2 border-purple-600 shadow-lg`}
            size="lg"
          >
            <Home className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Home</span>
          </Button>
          <Button
            onClick={() => setCurrentPage('monitor')}
            className={`${
              currentPage === 'monitor'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-purple-700 hover:bg-purple-100'
            } border-2 border-purple-600 shadow-lg`}
            size="lg"
          >
            <LayoutDashboard className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Monitor</span>
          </Button>
          <Button
            onClick={() => setCurrentPage('schedule')}
            className={`${
              currentPage === 'schedule'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-purple-700 hover:bg-purple-100'
            } border-2 border-purple-600 shadow-lg`}
            size="lg"
          >
            <CalendarIcon className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Calendar</span>
          </Button>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-2 border-purple-400 text-purple-700 hover:bg-purple-100 shadow-lg"
            size="lg"
          >
            <LogOut className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
          <Button
            onClick={toggleTheme}
            variant="outline"
            className="border-2 border-purple-400 text-purple-700 hover:bg-purple-100 shadow-lg"
            size="lg"
          >
            {theme === 'light' ? <Moon className="w-5 h-5 sm:mr-2" /> : <Sun className="w-5 h-5 sm:mr-2" />}
            <span className="hidden sm:inline">Toggle Theme</span>
          </Button>
        </div>
      )}

      {userType === 'admin' && (
        <div className="fixed top-2 left-2 md:top-4 md:left-4 z-50 flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => setCurrentPage('home')}
            className={`${
              currentPage === 'home'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-purple-700 hover:bg-purple-100'
            } border-2 border-purple-600 shadow-lg`}
            size="lg"
          >
            <Home className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Home</span>
          </Button>
          <Button
            onClick={() => setCurrentPage('monitor')}
            className={`${
              currentPage === 'monitor'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-purple-700 hover:bg-purple-100'
            } border-2 border-purple-600 shadow-lg`}
            size="lg"
          >
            <LayoutDashboard className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Monitor</span>
          </Button>
          <Button
            onClick={() => setCurrentPage('schedule')}
            className={`${
              currentPage === 'schedule'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-purple-700 hover:bg-purple-100'
            } border-2 border-purple-600 shadow-lg`}
            size="lg"
          >
            <CalendarIcon className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Calendar</span>
          </Button>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-2 border-purple-400 text-purple-700 hover:bg-purple-100 shadow-lg"
            size="lg"
          >
            <LogOut className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
          <Button
            onClick={toggleTheme}
            variant="outline"
            className="border-2 border-purple-400 text-purple-700 hover:bg-purple-100 shadow-lg"
            size="lg"
          >
            {theme === 'light' ? <Moon className="w-5 h-5 sm:mr-2" /> : <Sun className="w-5 h-5 sm:mr-2" />}
            <span className="hidden sm:inline">Toggle Theme</span>
          </Button>
        </div>
      )}

      {/* Page Content */}
      {userType === 'student' && (
        <>
          {currentPage === 'home' && <HomePage onNavigateToSchedule={() => setCurrentPage('schedule')} />}
          {currentPage === 'schedule' && <SchedulePage />}
        </>
      )}

      {userType === 'teacher' && (
        <>
          {currentPage === 'home' && <TeacherHomePage />}
          {currentPage === 'monitor' && <HallMonitorPage />}
          {currentPage === 'schedule' && <TeacherSchedulePage />}
        </>
      )}

      {userType === 'admin' && (
        <>
          {currentPage === 'home' && <AdminPage />}
          {currentPage === 'monitor' && <HallMonitorPage />}
          {currentPage === 'schedule' && <TeacherSchedulePage userRole="admin" />}
        </>
      )}

      {/* Help Button - Available for all authenticated users */}
      <HelpButton />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}