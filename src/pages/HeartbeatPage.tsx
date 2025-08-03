// src/pages/HeartbeatPage.tsx
import { useHeartbeat } from '../hooks/useData';
import { format } from 'date-fns';

function HeartbeatPage() {
  const { data, isLoading, error } = useHeartbeat();

  if (isLoading) {
    return <div className="loading loading-spinner text-primary mt-8"></div>;
  }

  if (error || !data) {
    return <div className="alert alert-error mt-8">Error loading heartbeat data</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6 px-4">
      <h1 className="text-3xl font-bold">📡 Bot Heartbeat Overview</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Last Heartbeat" value={format(new Date(data.last_heartbeat), 'PPP p')} />
        <StatCard title="Current Balance (SOL)" value={Number(data.current_balance_sol).toFixed(2)} />
        <StatCard title="Tracked Tokens" value={data.num_tracked_tokens} />
      </div>

      <div className="mt-6 text-sm opacity-60">
        Instance ID: <code>{data.instance_id}</code>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="card bg-base-200 shadow-md rounded-xl p-4">
      <div className="text-sm text-base-content/70 mb-1">{title}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

export default HeartbeatPage;
