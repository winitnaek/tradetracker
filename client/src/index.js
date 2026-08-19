import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/app.css';
import './styles/trades.css';
import './styles/phase4.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

const application = <BrowserRouter><ThemeProvider><AuthProvider><App /></AuthProvider></ThemeProvider></BrowserRouter>;
const configuredApplication = process.env.GOOGLE_CLIENT_ID && !process.env.HIDE_GOOGLE_AUTH
  ? <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID}>{application}</GoogleOAuthProvider>
  : application;

createRoot(document.getElementById('root')).render(<React.StrictMode>{configuredApplication}</React.StrictMode>);
