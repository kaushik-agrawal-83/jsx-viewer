import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AdapterProvider } from './lib/adapter-context.tsx';
import { WebIOAdapter } from './lib/web-adapter.ts';

const adapter = new WebIOAdapter();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdapterProvider adapter={adapter}>
      <App />
    </AdapterProvider>
  </StrictMode>,
);
