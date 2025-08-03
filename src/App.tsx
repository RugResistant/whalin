// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import HeartbeatPage from './pages/HeartbeatPage';
import TrackedTokensPage from './pages/TrackedTokensPage';
import TradesPage from './pages/TradesPage';
import LogsPage from './pages/LogsPage';
import EverBoughtPage from './pages/EverBoughtPage';
import BotConfigPage from './pages/BotConfigPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-base-100 text-base-content px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Solana Bot Dashboard</h1>
            <nav className="tabs tabs-boxed">
              <NavLink to="/heartbeat" className={({ isActive }) => isActive ? 'tab tab-active' : 'tab'}>Heartbeat</NavLink>
              <NavLink to="/tracked" className={({ isActive }) => isActive ? 'tab tab-active' : 'tab'}>Tracked</NavLink>
              <NavLink to="/trades" className={({ isActive }) => isActive ? 'tab tab-active' : 'tab'}>Trades</NavLink>
              <NavLink to="/logs" className={({ isActive }) => isActive ? 'tab tab-active' : 'tab'}>Logs</NavLink>
              <NavLink to="/bought" className={({ isActive }) => isActive ? 'tab tab-active' : 'tab'}>Ever Bought</NavLink>
              <NavLink to="/config" className={({ isActive }) => isActive ? 'tab tab-active' : 'tab'}>Config</NavLink>
            </nav>
          </header>

          <Routes>
            <Route path="/" element={<HeartbeatPage />} />
            <Route path="/heartbeat" element={<HeartbeatPage />} />
            <Route path="/tracked" element={<TrackedTokensPage />} />
            <Route path="/trades" element={<TradesPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/bought" element={<EverBoughtPage />} />
            <Route path="/config" element={<BotConfigPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;