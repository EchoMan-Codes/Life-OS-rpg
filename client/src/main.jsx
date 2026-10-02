import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from './lib/queryClient';
import { JeevanTransitionProvider } from './context/JeevanTransitionContext';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <JeevanTransitionProvider>
          <App />
        </JeevanTransitionProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
