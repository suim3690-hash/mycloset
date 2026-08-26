import { useEffect, useState } from 'react';
import BottomNav from './components/BottomNav';
import CalendarPage from './components/CalendarPage';
import AnalysisPage from './components/AnalysisPage';
import MagazinePage from './components/MagazinePage';
import CommunityPage from './components/CommunityPage';
import ProfilePage from './components/ProfilePage';
import TimeCapsuleReveal from './components/TimeCapsuleReveal';
import LoginPage from './components/LoginPage';
import { fetchMe } from './api/authApi';
import './App.css';

const TOKEN_KEY = 'mycloset_auth_token';

export default function App() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (!token) {
      setCheckingSession(false);
      return;
    }
    fetchMe(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setCheckingSession(false));
  }, [token]);

  function handleAuthenticated(newToken, newUser) {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setActiveTab('calendar');
  }

  useEffect(() => {
    function handleClick(e) {
      const btn = e.target.closest('button');
      if (!btn || btn.disabled) return;
      btn.classList.remove('neon-flash');
      void btn.offsetWidth;
      btn.classList.add('neon-flash');
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  if (checkingSession) {
    return <div className="page-center">불러오는 중...</div>;
  }

  if (!token || !user) {
    return <LoginPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="app-shell">
      <div className="bg-blobs">
        <span className="blob blob-sky" />
        <span className="blob blob-violet" />
        <span className="blob blob-peach" />
      </div>
      <div className="app-body">
        {activeTab === 'calendar' && <CalendarPage />}
        {activeTab === 'insight' && <AnalysisPage token={token} />}
        {activeTab === 'magazine' && <MagazinePage />}
        {activeTab === 'community' && (
          <CommunityPage user={user} token={token} onOpenProfile={() => setActiveTab('profile')} />
        )}
        {activeTab === 'profile' && (
          <ProfilePage user={user} token={token} onProfileUpdated={setUser} onLogout={handleLogout} />
        )}
      </div>
      <BottomNav active={activeTab} onChange={setActiveTab} />
      <TimeCapsuleReveal />
    </div>
  );
}
