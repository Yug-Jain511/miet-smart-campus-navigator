import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

declare const __APP_SHA__: string;

// DEV-only boot marker: proves which bundle a tab is running so a stale
// tab can never again be mistaken for current code.
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.info(`[miet-nav] dev bundle, commit ${__APP_SHA__}`);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
