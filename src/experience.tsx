import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/geist-mono';
import '../tokens.css';
import './experience.css';
import CinematicLanding from './CinematicLanding';
import { legacyAppHref } from './navigation';

const redirectLegacyBookmark = () => {
  const destination = legacyAppHref(location.hash, location.search);
  if (!destination) return false;
  location.replace(destination);
  return true;
};

window.addEventListener('hashchange', redirectLegacyBookmark);
if (import.meta.hot)
  import.meta.hot.dispose(() => window.removeEventListener('hashchange', redirectLegacyBookmark));

if (!redirectLegacyBookmark())
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <CinematicLanding />
    </React.StrictMode>,
  );
