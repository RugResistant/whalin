import { useParams, useNavigate } from 'react-router-dom';
import { useTokenInsights } from '../hooks/useTokenInsights';
import { Card, CardContent } from '../components/ui/card';
import { format } from 'date-fns';
import { useState } from 'react';
import { ClipboardCopy, CheckCircle2 } from 'lucide-react';

function TokenInsightsPage() {
  const { tokenMint = '' } = useParams<{ tokenMint?: string }>();
  const { data, isLoading, error } = useTokenInsights(tokenMint);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(tokenMint);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isLoading) return <div className="loading loading-spinner text-primary" />;
  if (error || !data) return <div className="alert alert-error">Failed to load insights</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {/* Token identity */}
          <div className="flex flex-col">
            <h1
              className="text-2xl sm:text-3xl font-bold text-primary cursor-pointer hover:underline"
              onClick={() => navigate(`/insights/${tokenMint}`)}
            >
              {data.name || 'Unknown Token'}
            </h1>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="bg-base-200 px-2 py-0.5 rounded text-xs font-mono">{tokenMint.slice(0, 6)}...{tokenMint.slice(-4)}</span>
              <button
                className="btn btn-xs btn-ghost text-xs"
                onClick={handleCopy}
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <ClipboardCopy className="w-4 h-4 opacity-70" />
                )}
              </button>
            </div>
          </div>
        </div>

        <span className="badge badge-info text-sm px-3 py-1">{data.symbol || '–'}</span>
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
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
        </CardContent>
      </Card>

      {/* Logs */}
      {Array.isArray(data.logs) && data.logs.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">🧠 Recent Logs</h2>
            <div className="space-y-3">
              {data.logs.map((log: any, i: number) => (
                <div
                  key={i}
                  className="bg-base-200 p-4 rounded-lg border border-base-300 shadow-sm text-sm"
                >
                  <div className="font-semibold text-accent mb-1">{log.type}</div>
                  <div className="text-xs text-muted-foreground mb-2">
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
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value ?? '–'}</div>
    </div>
  );
}

export default TokenInsightsPage;
