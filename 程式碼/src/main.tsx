import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AdminPage } from './admin/AdminPage.tsx';
import { PixelArtStudio } from './PixelArtStudio.tsx';
import './admin/admin.css';
import { GameConfigProvider } from './config/GameConfigContext.tsx';

const route = window.location.pathname.replace(/\/$/, '');
const RootPage = route.endsWith('/admin') ? AdminPage : route.endsWith('/pixel-studio') ? PixelArtStudio : App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameConfigProvider><RootPage /></GameConfigProvider>
  </StrictMode>,
);
