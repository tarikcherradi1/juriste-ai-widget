import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const init = () => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
};

// On attend que le DOM soit prêt pour lancer React
if (document.readyState === 'complete') {
  init();
} else {
  window.addEventListener('load', init);
}
