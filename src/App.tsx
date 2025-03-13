import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Dashboard from './components/Dashboard';
import TradeForm from './components/TradeForm';
import TradeList from './components/TradeList';
import Settings from './components/Settings';
import Layout from './components/Layout';
import { TradeProvider, useTrades } from './context/TradeContext';

// Theme component that uses the context
const ThemedApp: React.FC = () => {
  const { appSettings } = useTrades();
  
  // Create theme based on dark mode setting
  const theme = useMemo(() => 
    createTheme({
      palette: {
        mode: appSettings.darkMode ? 'dark' : 'light',
        primary: {
          main: '#1976d2',
        },
        secondary: {
          main: '#dc004e',
        },
        background: {
          default: appSettings.darkMode ? '#121212' : '#f5f5f5',
          paper: appSettings.darkMode ? '#1e1e1e' : '#ffffff',
        },
      },
    }),
  [appSettings.darkMode]);
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-trade" element={<TradeForm />} />
            <Route path="/trades" element={<TradeList />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <TradeProvider>
      <ThemedApp />
    </TradeProvider>
  );
};

export default App;
