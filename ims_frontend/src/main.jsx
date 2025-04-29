import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import App from './App';
import Navbar from './components/Navbar';
import Admin_navbar from './components/Admin_navbar';

const WrappedApp = () => {
  const location = useLocation();
  const showNavbarRoutes = [
    '/attendance',
    '/request',
    '/m_attendence',

  ];
  const showAdminNavbarRoutes = [
    '/admin_dashboard',
    '/add_interndata',
    '/manage_intern',
    '/calendar',
    '/uploadexcel',
    '/payment',
    
  ];

  return (
    <>
      {showNavbarRoutes.includes(location.pathname) && <Navbar />}
      {showAdminNavbarRoutes.includes(location.pathname) && <Admin_navbar />}
      <App />
    </>
  );
};

const Root = () => (
  <Router>
    <WrappedApp />
  </Router>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
