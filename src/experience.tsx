import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/geist-mono';
import '../tokens.css';
import './experience.css';
import CinematicLanding from './CinematicLanding';
import { legacyAppHref } from './navigation';

const legacyDestination = legacyAppHref(location.hash, location.search);
if (legacyDestination) location.replace(legacyDestination);
else
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <CinematicLanding />
    </React.StrictMode>,
  );
