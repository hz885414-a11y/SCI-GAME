import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AdminPage } from './admin/AdminPage.tsx';
import './admin/admin.css';
import { GameConfigProvider } from './config/GameConfigContext.tsx';

const RootPage = window.location.pathname.replace(/\/$/, '').endsWith('/admin') ? AdminPage : App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameConfigProvider><RootPage /></GameConfigProvider>
  </StrictMode>,
);
