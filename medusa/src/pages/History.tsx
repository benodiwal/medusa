import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { ArrowLeft, Search, Clock, CheckCircle, XCircle, Loader2, X, Trash2, Eye } from 'lucide-react';
import { HistoryPreviewModal } from '../components/history';
import { ask } from '@tauri-apps/plugin-dialog';

interface HistoryItem {
  id: string;
  content: string;
  project_name: string;
  source?: string;
  status: string;
  feedback?: string;
  annotations?: unknown[];
  created_at: number;
  completed_at: number;
}

export default function History() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [previewItem, setPreviewItem] = useState<HistoryItem | null>(null);
  const [historyCount, setHistoryCount] = useState(0);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const items = await invoke<HistoryItem[]>('get_history', { limit: 50, offset: 0 });
      setHistory(items);
      const count = await invoke<number>('get_history_count');
      setHistoryCount(count);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadHistory();
      return;
    }

    setSearching(true);
    try {
      const results = await invoke<HistoryItem[]>('search_history', { query: searchQuery, limit: 50 });
      setHistory(results);
    } catch (error) {
      console.error('Failed to search history:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleClearOldHistory = async () => {
    const confirmed = await ask('Clear history older than 30 days?', {
      title: 'Confirm Clear History',
      kind: 'warning',
    });
    if (!confirmed) return;

    try {
      const deleted = await invoke<number>('clear_old_history', { days: 30 });
      alert(`Cleared ${deleted} old items`);
      loadHistory();
    } catch (error) {
      console.error('Failed to clear old history:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title="Back to Board"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <img
                src="/medusa-logo.png"
                alt="Medusa"
                className="w-7 h-7 object-contain"
              />
              <h1 className="text-base font-semibold text-foreground">History</h1>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {historyCount} plans
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search history..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 py-1.5 text-sm bg-muted/50 border border-border rounded-lg w-64 focus:outline-none focus:border-muted-foreground"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); loadHistory(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={searching}
                className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </button>
            </form>

            <button
              onClick={handleClearOldHistory}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title="Clear old history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No history yet</h2>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No plans match your search.' : 'Plans will appear here after you approve or reject them.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-card border border-border rounded-lg hover:border-muted-foreground/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(item.status)}
                      <span className="font-medium text-foreground truncate">
                        {item.project_name}
                      </span>
                      {item.source && (
                        <span className="text-xs text-muted-foreground truncate">
                          {item.source.split('/').pop()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.content.slice(0, 200)}...
                    </p>
                  </div>
                  <div className="flex items-start gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.completed_at)}
                      </p>
                      <p className="text-xs capitalize text-muted-foreground mt-1">
                        {item.status}
                      </p>
                    </div>
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      title="View plan"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Preview Modal */}
      {previewItem && (
        <HistoryPreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  );
}
