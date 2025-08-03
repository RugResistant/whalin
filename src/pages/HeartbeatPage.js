import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/HeartbeatPage.tsx
import { useHeartbeat } from '../hooks/useData';
import { format } from 'date-fns';
function HeartbeatPage() {
    const { data, isLoading, error } = useHeartbeat();
    if (isLoading) {
        return _jsx("div", { className: "loading loading-spinner text-primary mt-8" });
    }
    if (error || !data) {
        return _jsx("div", { className: "alert alert-error mt-8", children: "Error loading heartbeat data" });
    }
    return (_jsxs("div", { className: "max-w-5xl mx-auto py-8 space-y-6 px-4", children: [_jsx("h1", { className: "text-3xl font-bold", children: "\uD83D\uDCE1 Bot Heartbeat Overview" }), _jsxs("div", { className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: [_jsx(StatCard, { title: "Last Heartbeat", value: format(new Date(data.last_heartbeat), 'PPP p') }), _jsx(StatCard, { title: "Current Balance (SOL)", value: Number(data.current_balance_sol).toFixed(2) }), _jsx(StatCard, { title: "Tracked Tokens", value: data.num_tracked_tokens })] }), _jsxs("div", { className: "mt-6 text-sm opacity-60", children: ["Instance ID: ", _jsx("code", { children: data.instance_id })] })] }));
}
function StatCard({ title, value }) {
    return (_jsxs("div", { className: "card bg-base-200 shadow-md rounded-xl p-4", children: [_jsx("div", { className: "text-sm text-base-content/70 mb-1", children: title }), _jsx("div", { className: "text-xl font-semibold", children: value })] }));
}
export default HeartbeatPage;
