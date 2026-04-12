import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const LoginSignupPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // --- Validation Helpers ---
  const isValidEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  const getPasswordStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 2) return { label: 'Weak', color: '#ef4444', percent: 33 };
    if (score <= 4) return { label: 'Medium', color: '#f59e0b', percent: 66 };
    return { label: 'Strong', color: '#22c55e', percent: 100 };
  };

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  // Real-time validation
  const validateField = (field, value) => {
    const errors = { ...fieldErrors };

    switch (field) {
      case 'name':
        if (!value || value.trim().length < 2) errors.name = 'Name must be at least 2 characters.';
        else if (value.trim().length > 50) errors.name = 'Name cannot exceed 50 characters.';
        else if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) errors.name = 'Name can only contain letters, spaces, hyphens.';
        else delete errors.name;
        break;
      case 'email':
        if (!value || !isValidEmail(value.trim())) errors.email = 'Please enter a valid email address.';
        else delete errors.email;
        break;
      case 'password':
        if (!value || value.length < 8) errors.password = 'Password must be at least 8 characters.';
        else if (!/[A-Z]/.test(value)) errors.password = 'Must include at least one uppercase letter.';
        else if (!/[0-9]/.test(value)) errors.password = 'Must include at least one number.';
        else delete errors.password;
        break;
      default:
        break;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const values = { name, email, password };
    validateField(field, values[field]);
  };

  const isFormValid = useMemo(() => {
    if (isLogin) {
      return email && password && isValidEmail(email);
    }
    return name.trim().length >= 2 && isValidEmail(email) && password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  }, [isLogin, name, email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Run all validations
    setTouched({ name: true, email: true, password: true });
    const emailValid = validateField('email', email);
    const passValid = validateField('password', password);
    if (!isLogin) validateField('name', name);
    
    if (!isFormValid) return;

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Welcome back! 🎉');
      } else {
        await register(name, email, password);
        toast.success('Account created successfully! 🚀');
      }
      navigate('/dashboard');
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        setFieldErrors(serverErrors);
      } else {
        toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    setFieldErrors({});
    setTouched({});
    setName('');
    setEmail('');
    setPassword('');
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '11px 14px',
    borderRadius: '8px',
    background: 'var(--bg)',
    border: `1px solid ${touched[field] && fieldErrors[field] ? 'rgba(239,68,68,0.5)' : 'var(--card-border)'}`,
    color: 'var(--text)',
    fontSize: '0.9rem',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
  });

  const errorStyle = {
    color: '#ef4444',
    fontSize: '0.75rem',
    marginTop: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '400px', marginTop: '70px', paddingBottom: '80px' }}>
      <div className="card" style={{ padding: '40px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--accent), #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px auto', fontSize: '1.3rem', color: '#fff'
          }}>
            {isLogin ? '👋' : '🚀'}
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '6px' }}>
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {isLogin ? 'Sign in to continue your journey.' : 'Start tracking your learning progress.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Name field (signup only) */}
          {!isLogin && (
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => { setName(e.target.value); if (touched.name) validateField('name', e.target.value); }}
                onBlur={() => handleBlur('name')}
                style={inputStyle('name')}
                id="register-name"
              />
              {touched.name && fieldErrors.name && (
                <div style={errorStyle}>
                  <span>⚠</span> {fieldErrors.name}
                </div>
              )}
            </div>
          )}

          {/* Email field */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (touched.email) validateField('email', e.target.value); }}
              onBlur={() => handleBlur('email')}
              style={inputStyle('email')}
              id="login-email"
            />
            {touched.email && fieldErrors.email && (
              <div style={errorStyle}>
                <span>⚠</span> {fieldErrors.email}
              </div>
            )}
          </div>

          {/* Password field */}
          <div style={{ marginBottom: isLogin ? '28px' : '10px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (touched.password) validateField('password', e.target.value); }}
                onBlur={() => handleBlur('password')}
                style={{ ...inputStyle('password'), paddingRight: '44px' }}
                id="login-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', fontSize: '0.8rem', padding: '4px',
                }}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {touched.password && fieldErrors.password && (
              <div style={errorStyle}>
                <span>⚠</span> {fieldErrors.password}
              </div>
            )}
          </div>

          {/* Password Strength Indicator (signup only) */}
          {!isLogin && password.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Password Strength
                </span>
                <span style={{ fontSize: '0.7rem', color: passwordStrength.color, fontWeight: '700' }}>
                  {passwordStrength.label}
                </span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  width: `${passwordStrength.percent}%`,
                  height: '100%',
                  background: passwordStrength.color,
                  borderRadius: '2px',
                  transition: 'width 0.3s ease, background-color 0.3s ease',
                }} />
              </div>
              {password.length > 0 && password.length < 8 && (
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Use at least 8 characters with uppercase letters and numbers.
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              justifyContent: 'center',
              opacity: isFormValid && !loading ? 1 : 0.6,
              cursor: isFormValid && !loading ? 'pointer' : 'not-allowed',
            }}
            disabled={!isFormValid || loading}
            id="auth-submit-btn"
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                Processing...
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Mode Toggle */}
        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span
            onClick={handleModeSwitch}
            style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: '600' }}
            id="auth-mode-toggle"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginSignupPage;
