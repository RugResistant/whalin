import { useParams } from 'react-router-dom';
import { useTokenInsights } from '../hooks/useTokenInsights';
import { Card, CardContent } from '../components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { format } from 'date-fns';

function TokenInsightsPage() {
  const { tokenMint = '' } = useParams<{ tokenMint?: string }>();
  const { data, isLoading, error } = useTokenInsights(tokenMint);

  if (isLoading) return <div className="loading loading-spinner text-primary" />;
  if (error || !data) return <div className="alert alert-error">Failed to load insights</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">📊 Token Insights</h1>
        <span className="badge badge-info text-lg">{data.symbol || '–'}</span>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4">
          <Stat label="🔤 Name" value={data.name} />
          <Stat label="🔠 Symbol" value={data.symbol} />
          <Stat
            label="💰 Market Cap"
            value={
              typeof data.marketCap === 'number'
                ? `$${data.marketCap.toLocaleString()}`
                : '–'
            }
          />
          <Stat
            label="👥 Holders"
            value={
              typeof data.holders === 'number'
                ? data.holders.toLocaleString()
                : '–'
            }
          />
          <Stat
            label="💵 Price"
            value={
              typeof data.price === 'number'
                ? `$${data.price.toFixed(12)}`
                : '–'
            }
          />
          <Stat
            label="📈 Volume (24h)"
            value={
              typeof data.volume === 'number'
                ? `$${data.volume.toLocaleString()}`
                : '–'
            }
          />
          <Stat
            label="🚀 Launch Date"
            value={
              data.createdAt
                ? format(new Date(data.createdAt), 'PPP')
                : '–'
            }
          />
        </CardContent>
      </Card>

      {Array.isArray(data.ohlcv) && data.ohlcv.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="text-xl font-semibold">📉 OHLCV Chart</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.ohlcv}>
                <XAxis dataKey="time" tickFormatter={(v) => format(new Date(v), 'p')} />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip />
                <Line type="monotone" dataKey="close" stroke="#8884d8" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {Array.isArray(data.swapVolumes) && data.swapVolumes.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="text-xl font-semibold">💱 Swap Volume (24h)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.swapVolumes}>
                <XAxis dataKey="time" tickFormatter={(v) => format(new Date(v), 'p')} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="volume" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {Array.isArray(data.logs) && data.logs.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-4">🧠 Recent Logs</h2>
            <div className="space-y-2">
              {data.logs.map((log: any, i: number) => (
                <div
                  key={i}
                  className="bg-base-300 p-3 rounded-xl border border-base-200 text-sm space-y-1"
                >
                  <div className="font-semibold text-accent">{log.type}</div>
                  <div className="text-xs opacity-70">
                    {log.created_at
                      ? format(new Date(log.created_at), 'PPP p')
                      : '–'}
                  </div>
                  <pre className="whitespace-pre-wrap break-all text-xs">
                    {log.message}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-lg font-semibold">{value ?? '–'}</div>
    </div>
  );
}

export default TokenInsightsPage;
