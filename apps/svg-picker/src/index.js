// index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import App from './App'; // Ensure App is imported

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <SDKProvider>
    <>
      <GlobalStyles />
      <App />
    </>
  </SDKProvider>
);
