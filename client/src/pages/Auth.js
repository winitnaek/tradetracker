import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Auth({ register = false }) {
  const { login, register: signUp, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      await (register ? signUp(form) : login(form));
      navigate('/');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleGoogleSuccess(response) {
    setError('');
    try {
      await googleLogin(response.credential);
      navigate('/');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return <div className={'auth-page'}>
    <section className={'auth-brand'}><div className={'brand'}><span className={'brand-mark'}><i className={'bi bi-graph-up-arrow'} /></span>TradeTracker</div><h1>Track your trades. Measure your progress.</h1><p>Record trades in seconds, track realized profit, and stay focused on your daily goal.</p><div className={'auth-stat'}><strong>Your Goal. Your Pace.</strong><span>Set a daily profit target that works for you — and adjust it anytime.</span></div></section>
    <section className={'auth-form'}><div className={'auth-card'}>
      <h2>{register ? 'Create your account' : 'Welcome back'}</h2><p>{register ? 'Start your personal trading journal.' : 'Sign in to continue to TradeTracker.'}</p>
      {error && <div className={'alert alert-danger'}>{error}</div>}
      {!process.env.HIDE_GOOGLE_AUTH && (process.env.GOOGLE_CLIENT_ID
        ? <div className={'google-login-wrap'}><GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google Sign-In was cancelled or could not be completed.')} width={'400'} /></div>
        : <div className={'alert alert-warning'}>Google Sign-In is not configured.</div>)}
      {!process.env.HIDE_GOOGLE_AUTH&&process.env.GOOGLE_CLIENT_ID&&<div className={'divider'}><span>or continue with email</span></div>}
      <form onSubmit={submit}>
        {register && <label>Display name<input required value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} placeholder={'Your name'} /></label>}
        <label>Email address<input required type={'email'} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder={'you@example.com'} /></label>
        <label>Password<input required minLength={8} type={'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={'At least 8 characters'} /></label>
        <button className={'btn btn-primary w-100'}>{register ? 'Create Account' : 'Sign In'}</button>
      </form>
      <p className={'auth-switch'}>{register ? 'Already have an account?' : 'New to TradeTracker?'} <Link to={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create an account'}</Link></p>
    </div></section>
  </div>;
}
