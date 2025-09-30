import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { store } from './store/store';
import './styles/app.css';
import './styles/enhanced-theme.css';
import './styles/stock-check.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      </QueryClientProvider>
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  document.getElementById('root')!.innerHTML = `
    <div style="padding: 20px; color: red; font-family: monospace;">
      <h1>Application Failed to Load</h1>
      <p>${error.toString()}</p>
      <p>Check the browser console for more details.</p>
    </div>
  `;
}