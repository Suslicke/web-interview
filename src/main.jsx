import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { initAnalytics } from './analytics.js';

// Apply saved theme BEFORE React renders — prevents flash of wrong theme.
(() => {
  try {
    const saved = localStorage.getItem('web-theme');
    const theme = saved === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  } catch {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();

initAnalytics();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
