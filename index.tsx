import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const renderApp = () => {
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

if (document.readyState === 'complete') {
  renderApp();
} else {
  window.addEventListener('load', renderApp);
}
