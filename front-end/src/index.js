import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleOAuthProvider clientId="GOOGLE_CLIENT_ID=861836186110-2c3ffe6p8mscb4mjn60bjvkucp6hicpm.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);