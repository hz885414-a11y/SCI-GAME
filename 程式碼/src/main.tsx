import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AdminPage } from './admin/AdminPage.tsx';
import { PixelfxShowcase } from './PixelfxShowcase.tsx';
import { PixelArtStudio } from './PixelArtStudio.tsx';
import './admin/admin.css';
import { GameConfigProvider } from './config/GameConfigContext.tsx';

const route = window.location.pathname.replace(/\/$/, '');
const preview = new URLSearchParams(window.location.search).get('view');
const RootPage = route.endsWith('/admin') || preview === 'admin' ? AdminPage : route.endsWith('/effects') || preview === 'effects' ? PixelfxShowcase : (route.endsWith('/pixel-studio') || preview === 'pixel-studio') ? PixelArtStudio : App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameConfigProvider><RootPage /></GameConfigProvider>
  </StrictMode>,
);
