import { useState } from 'react';
import { login, signup } from '../api/authApi';

export default function LoginPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [socialNotice, setSocialNotice] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const result = mode === 'login' ? await login(email, password) : await signup(email, password, displayName);
      onAuthenticated(result.token, result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSocialClick(provider) {
    setSocialNotice(`${provider} 로그인은 아직 연동 전이에요. 이메일로 가입해주세요!`);
  }

  return (
    <div className="login-page">
      <div className="bg-blobs">
        <span className="blob blob-sky" />
        <span className="blob blob-violet" />
        <span className="blob blob-peach" />
      </div>
      <div className="login-hero">
        <div className="login-logo">
          <span className="material-symbol">checkroom</span>
        </div>
        <span className="login-title">나의 옷장</span>
        <span className="login-subtitle">오늘의 스타일을 기록해보세요</span>
      </div>

      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-tab-row">
          <button
            type="button"
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            로그인
          </button>
          <button
            type="button"
            className={`login-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => setMode('signup')}
          >
            회원가입
          </button>
        </div>

        {mode === 'signup' && (
          <input
            className="memo-input"
            type="text"
            placeholder="닉네임 (선택)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        )}
        <input
          className="memo-input"
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="memo-input"
          type="password"
          placeholder="비밀번호 (6자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="error-text">{error}</p>}

        <button className="login-submit-btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>

        <div className="login-divider">
          <span>또는</span>
        </div>

        <button type="button" className="social-login-btn google" onClick={() => handleSocialClick('구글')}>
          구글로 로그인하기
        </button>
        <button type="button" className="social-login-btn kakao" onClick={() => handleSocialClick('카카오톡')}>
          카카오톡으로 로그인하기
        </button>

        {socialNotice && <p className="text-soft" style={{ textAlign: 'center', fontSize: 13 }}>{socialNotice}</p>}
      </form>
    </div>
  );
}
