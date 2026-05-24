'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const FALLBACK_URL = 'https://savora-app.up.railway.app/app/login';
const DEEP_LINK = 'savora://home';

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

type Status = 'verifying' | 'form' | 'loading' | 'success' | 'error' | 'invalid';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  const [status, setStatus] = useState<Status>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    if (!token_hash || type !== 'recovery') {
      setStatus('invalid');
      return;
    }

    const verify = async () => {
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'recovery',
      });

      if (error) {
        setStatus('error');
        setErrorMessage(error.message || 'The reset link is invalid or has expired.');
      } else {
        setStatus('form');
      }
    };

    verify();
  }, [searchParams, supabase]);

  useEffect(() => {
    if (status === 'success') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        openSavoraApp();
      }
    }
  }, [status, countdown]);

  const openSavoraApp = () => {
    const isAndroid = /Android/.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

    if (isAndroid) {
      let appOpened = false;
      const onVisibilityChange = () => { if (document.hidden) appOpened = true; };
      const onBlur = () => { appOpened = true; };
      document.addEventListener('visibilitychange', onVisibilityChange);
      window.addEventListener('blur', onBlur);
      window.location.href = DEEP_LINK;
      setTimeout(() => {
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('blur', onBlur);
        if (!appOpened && !document.hidden) window.location.href = FALLBACK_URL;
      }, 2000);
    } else if (isIOS) {
      window.location.href = DEEP_LINK;
      setTimeout(() => { window.location.href = FALLBACK_URL; }, 2000);
    } else {
      window.location.href = FALLBACK_URL;
    }
  };

  const handleSubmit = async () => {
    if (!password || !confirmPassword) {
      setErrorMessage('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setErrorMessage('');
    setStatus('loading');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus('form');
      setErrorMessage(error.message || 'Failed to update password. Please try again.');
    } else {
      await supabase.auth.signOut();
      setStatus('success');
    }
  };

  const passwordStrength = (() => {
    if (!password) return null;
    if (password.length < 8) return { label: 'Too short', color: '#ef4444', width: '25%' };
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const score = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    if (score === 0) return { label: 'Weak', color: '#f97316', width: '40%' };
    if (score === 1) return { label: 'Fair', color: '#eab308', width: '65%' };
    return { label: 'Strong', color: '#22c55e', width: '100%' };
  })();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5',
      padding: '20px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}>

        {/* Header bar */}
        <div style={{
          height: '4px',
          background: 'linear-gradient(135deg, #F57C00 0%, #FF9800 100%)',
        }} />

        <div style={{ padding: '40px' }}>

          {/* ── VERIFYING ── */}
          {status === 'verifying' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64,
                border: '3px solid #f0f0f0',
                borderTop: '3px solid #F57C00',
                borderRadius: '50%',
                margin: '0 auto 24px',
                animation: 'spin 0.8s linear infinite',
              }} />
              <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>
                Verifying Link...
              </h2>
              <p style={{ margin: 0, color: '#6a6a6a', fontSize: 15 }}>
                Please wait a moment.
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ── INVALID LINK ── */}
          {status === 'invalid' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#fee2e2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <svg width="28" height="28" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>
                Invalid Link
              </h2>
              <p style={{ margin: '0 0 24px', color: '#6a6a6a', fontSize: 15 }}>
                The reset link was not found or has an incorrect format.
              </p>
              <button onClick={() => router.push(FALLBACK_URL)} style={btnStyle('#F57C00')}>
                Back to Login
              </button>
            </div>
          )}

          {/* ── TOKEN ERROR ── */}
          {status === 'error' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#fee2e2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <svg width="28" height="28" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                </svg>
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>
                Link Expired
              </h2>
              <p style={{ margin: '0 0 8px', color: '#6a6a6a', fontSize: 15 }}>
                {errorMessage}
              </p>
              <p style={{ margin: '0 0 24px', color: '#9a9a9a', fontSize: 13 }}>
                Please request a new password reset link from the Savora app.
              </p>
              <button onClick={() => router.push(FALLBACK_URL)} style={btnStyle('#F57C00')}>
                Back to Login
              </button>
            </div>
          )}

          {/* ── FORM ── */}
          {(status === 'form' || status === 'loading') && (
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 700, color: '#1a1a1a' }}>
                Reset Password
              </h2>
              <p style={{ margin: '0 0 28px', color: '#6a6a6a', fontSize: 15 }}>
                Create a new password for your Savora account.
              </p>

              {errorMessage && (
                <div style={{
                  background: '#fff3e0',
                  borderLeft: '4px solid #F57C00',
                  borderRadius: 6,
                  padding: '12px 16px',
                  marginBottom: 20,
                  fontSize: 14,
                  color: '#6a6a6a',
                }}>
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Password field */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a4a4a', marginBottom: 6 }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    disabled={status === 'loading'}
                    style={inputStyle}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={eyeBtnStyle}
                    tabIndex={-1}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                {passwordStrength && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ height: 4, background: '#e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: passwordStrength.width,
                        background: passwordStrength.color,
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                      }} />
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: passwordStrength.color }}>
                      Password strength: {passwordStrength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password field */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a4a4a', marginBottom: 6 }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    disabled={status === 'loading'}
                    style={{
                      ...inputStyle,
                      borderColor: confirmPassword && confirmPassword !== password ? '#ef4444' : '#e0e0e0',
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    style={eyeBtnStyle}
                    tabIndex={-1}
                  >
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#ef4444' }}>
                    Passwords do not match
                  </p>
                )}
                {confirmPassword && confirmPassword === password && password.length >= 8 && (
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#22c55e' }}>
                    ✓ Passwords match
                  </p>
                )}
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={status === 'loading'}
                style={{
                  ...btnStyle('#F57C00'),
                  opacity: status === 'loading' ? 0.7 : 1,
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {status === 'loading' ? (
                  <>
                    <div style={{
                      width: 16, height: 16,
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTop: '2px solid #fff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    Saving...
                  </>
                ) : 'Save New Password'}
              </button>

              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {status === 'success' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#dcfce7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <svg width="28" height="28" fill="none" stroke="#22c55e" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>
                Password Updated!
              </h2>
              <p style={{ margin: '0 0 8px', color: '#6a6a6a', fontSize: 15 }}>
                Your Savora account password has been updated.
              </p>
              <p style={{ margin: '0 0 24px', color: '#9a9a9a', fontSize: 13 }}>
                Opening the app in <strong style={{ color: '#F57C00' }}>{countdown}</strong> second{countdown !== 1 ? 's' : ''}...
              </p>

              {/* Security notice */}
              <div style={{
                background: '#f9f9f9',
                borderRadius: 6,
                padding: '14px 16px',
                marginBottom: 20,
                textAlign: 'left',
              }}>
                <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: '#4a4a4a' }}>
                  🔒 Security Tips:
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#6a6a6a', lineHeight: 1.6 }}>
                  Never share your password with anyone. Use a unique password that differs from your other accounts.
                </p>
              </div>

              <button onClick={openSavoraApp} style={btnStyle('#F57C00')}>
                Open App Now
              </button>
              <p style={{ margin: '12px 0 0', fontSize: 12, color: '#9a9a9a' }}>
                If the app is not installed, you will be redirected to the web page.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid #e0e0e0',
          padding: '16px 40px',
          textAlign: 'center',
        }}>
          <p style={{ margin: 0, fontSize: 12, color: '#9a9a9a' }}>
            © 2026 Savora — This email was sent automatically, please do not reply.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── helpers ──

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 44px 12px 14px',
  fontSize: 15,
  border: '1px solid #e0e0e0',
  borderRadius: 8,
  outline: 'none',
  boxSizing: 'border-box',
  color: '#1a1a1a',
  background: '#fff',
  transition: 'border-color 0.2s',
};

const eyeBtnStyle: React.CSSProperties = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#9a9a9a',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
};

function btnStyle(color: string): React.CSSProperties {
  return {
    display: 'block',
    width: '100%',
    padding: '14px 0',
    background: `linear-gradient(135deg, ${color} 0%, #FF9800 100%)`,
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    boxShadow: `0 4px 12px rgba(245,124,0,0.3)`,
    textAlign: 'center',
  };
}

// ── export ──

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#f5f5f5',
      }}>
        <div style={{
          width: 56, height: 56,
          border: '3px solid #f0f0f0',
          borderTop: '3px solid #F57C00',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}