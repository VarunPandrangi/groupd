import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import './styles/index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            border: '1px solid var(--border-default)',
            borderRadius: '8px',
          },
          success: {
            iconTheme: {
              primary: '#34D399',
              secondary: '#0F1117',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#0F1117',
            },
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>
);
