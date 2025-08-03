import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/App.tsx
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import HeartbeatPage from './pages/HeartbeatPage';
import TrackedTokensPage from './pages/TrackedTokensPage';
import TradesPage from './pages/TradesPage';
import LogsPage from './pages/LogsPage';
import EverBoughtPage from './pages/EverBoughtPage';
import BotConfigPage from './pages/BotConfigPage';
function App() {
    return (_jsx(Router, { children: _jsx("div", { className: "min-h-screen bg-base-100 text-base-content px-4 py-6", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("header", { className: "flex justify-between items-center mb-6", children: [_jsx("h1", { className: "text-3xl font-bold", children: "Solana Bot Dashboard" }), _jsxs("nav", { className: "tabs tabs-boxed", children: [_jsx(NavLink, { to: "/heartbeat", className: ({ isActive }) => isActive ? 'tab tab-active' : 'tab', children: "Heartbeat" }), _jsx(NavLink, { to: "/tracked", className: ({ isActive }) => isActive ? 'tab tab-active' : 'tab', children: "Tracked" }), _jsx(NavLink, { to: "/trades", className: ({ isActive }) => isActive ? 'tab tab-active' : 'tab', children: "Trades" }), _jsx(NavLink, { to: "/logs", className: ({ isActive }) => isActive ? 'tab tab-active' : 'tab', children: "Logs" }), _jsx(NavLink, { to: "/bought", className: ({ isActive }) => isActive ? 'tab tab-active' : 'tab', children: "Ever Bought" }), _jsx(NavLink, { to: "/config", className: ({ isActive }) => isActive ? 'tab tab-active' : 'tab', children: "Config" })] })] }), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HeartbeatPage, {}) }), _jsx(Route, { path: "/heartbeat", element: _jsx(HeartbeatPage, {}) }), _jsx(Route, { path: "/tracked", element: _jsx(TrackedTokensPage, {}) }), _jsx(Route, { path: "/trades", element: _jsx(TradesPage, {}) }), _jsx(Route, { path: "/logs", element: _jsx(LogsPage, {}) }), _jsx(Route, { path: "/bought", element: _jsx(EverBoughtPage, {}) }), _jsx(Route, { path: "/config", element: _jsx(BotConfigPage, {}) })] })] }) }) }));
}
export default App;
