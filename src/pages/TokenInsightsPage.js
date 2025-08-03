import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/TokenInsightsPage.tsx
import { useParams } from 'react-router-dom';
import { useTokenInsights } from '../hooks/useTokenInsights';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, } from 'recharts';
import { format } from 'date-fns';
function TokenInsightsPage() {
    const { tokenMint } = useParams();
    const { data, isLoading, error } = useTokenInsights(tokenMint);
    if (isLoading)
        return _jsx("div", { className: "loading loading-spinner text-primary" });
    if (error || !data)
        return _jsx("div", { className: "alert alert-error", children: "Failed to load insights" });
    return (_jsxs("div", { className: "p-6 max-w-7xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h1", { className: "text-3xl font-bold", children: "Token Insights" }), _jsx("span", { className: "badge badge-info", children: data.symbol })] }), _jsx(Card, { children: _jsxs(CardContent, { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4", children: [_jsx(Stat, { label: "Name", value: data.name }), _jsx(Stat, { label: "Symbol", value: data.symbol }), _jsx(Stat, { label: "Market Cap", value: `$${data.marketCap?.toLocaleString()}` }), _jsx(Stat, { label: "Holders", value: data.holders }), _jsx(Stat, { label: "Price", value: `$${data.price}` }), _jsx(Stat, { label: "Volume (24h)", value: `$${data.volume}` }), _jsx(Stat, { label: "Launch Date", value: format(new Date(data.createdAt), 'PPP') })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4 space-y-4", children: [_jsx("h2", { className: "text-xl font-semibold", children: "OHLCV Chart" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: data.ohlcv, children: [_jsx(XAxis, { dataKey: "time", tickFormatter: (v) => format(new Date(v), 'p') }), _jsx(YAxis, { domain: ['auto', 'auto'] }), _jsx(Tooltip, {}), _jsx(Line, { type: "monotone", dataKey: "close", stroke: "#8884d8", dot: false })] }) })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4 space-y-4", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Swap Volume (24h)" }), _jsx(ResponsiveContainer, { width: "100%", height: 250, children: _jsxs(BarChart, { data: data.swapVolumes, children: [_jsx(XAxis, { dataKey: "time", tickFormatter: (v) => format(new Date(v), 'p') }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "volume", fill: "#22c55e" })] }) })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Recent Logs" }), _jsx("div", { className: "space-y-2", children: data.logs.map((log, i) => (_jsxs("div", { className: "bg-base-300 p-3 rounded-xl border border-base-200 text-sm space-y-1", children: [_jsx("div", { className: "font-semibold text-accent", children: log.type }), _jsx("div", { className: "text-xs opacity-70", children: format(new Date(log.created_at), 'PPP p') }), _jsx("pre", { className: "whitespace-pre-wrap break-all text-xs", children: log.message })] }, i))) })] }) })] }));
}
function Stat({ label, value }) {
    return (_jsxs("div", { children: [_jsx("div", { className: "text-sm opacity-70", children: label }), _jsx("div", { className: "text-lg font-semibold", children: value ?? '–' })] }));
}
export default TokenInsightsPage;
