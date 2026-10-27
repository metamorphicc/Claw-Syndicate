import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/geist-mono';
import './styles.css';
import './exchange.css';
import './motion.css';
import App from './App';
import { MotionShell } from './Motion';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MotionShell>
      <App />
    </MotionShell>
  </React.StrictMode>,
);
