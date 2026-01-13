import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, XCircle, Clock } from 'lucide-react';
import { PlanViewer, AnnotationSidebar } from '../plan';
import { parseMarkdownToBlocks } from '../../utils/parser';
import { Block, Annotation } from '../../types';

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

interface HistoryPreviewModalProps {
  item: HistoryItem;
  onClose: () => void;
}

export function HistoryPreviewModal({ item, onClose }: HistoryPreviewModalProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  // Parse content to blocks
  useEffect(() => {
    setBlocks(parseMarkdownToBlocks(item.content));
  }, [item.content]);

  // Restore annotations from history item
  useEffect(() => {
    if (item.annotations && Array.isArray(item.annotations)) {
      setAnnotations(item.annotations as Annotation[]);
    }
  }, [item.annotations]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  // No-op handlers for read-only mode
  const handleAnnotationsChange = useCallback(() => {}, []);
  const handleDeleteAnnotation = useCallback(() => {}, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full h-full max-w-7xl max-h-[95vh] m-4 bg-background rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">{item.project_name}</h2>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              item.status === 'approved'
                ? 'bg-green-500/10 text-green-600'
                : 'bg-red-500/10 text-red-600'
            }`}>
              {getStatusIcon(item.status)}
              <span>{getStatusLabel(item.status)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            title="Close (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Plan Viewer */}
          <main className="flex-1 overflow-auto p-6 flex justify-center">
            <PlanViewer
              blocks={blocks}
              markdown={item.content}
              annotations={annotations}
              onAddAnnotation={handleAnnotationsChange}
              onRemoveAnnotation={handleDeleteAnnotation}
              onSelectAnnotation={setSelectedAnnotationId}
              selectedAnnotationId={selectedAnnotationId}
              readOnly={true}
            />
          </main>

          {/* Annotation Sidebar */}
          {annotations.length > 0 && (
            <aside className="w-72 border-l border-border overflow-auto shrink-0">
              <AnnotationSidebar
                annotations={annotations}
                blocks={blocks}
                onSelect={setSelectedAnnotationId}
                onDelete={handleDeleteAnnotation}
                selectedId={selectedAnnotationId}
              />
            </aside>
          )}
        </div>

        {/* Footer */}
        <footer className="px-6 py-3 border-t border-border bg-muted/30 shrink-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Created: {formatDate(item.created_at)}</span>
              <span>Completed: {formatDate(item.completed_at)}</span>
              {item.source && (
                <span className="text-muted-foreground/70">
                  Source: {item.source.split('/').pop()}
                </span>
              )}
            </div>
            {annotations.length > 0 && (
              <span>{annotations.length} annotation{annotations.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
