import { Clock, ExternalLink, Trash2, Check, X, Eye } from 'lucide-react';
import { PlanItem, PlanStatus } from '../../types';

interface PlanCardProps {
  plan: PlanItem;
  onOpen?: () => void;
  onRemove: () => void;
  onPreview?: () => void;
  isActive?: boolean;
  isCompleted?: boolean;
}

export function PlanCard({ plan, onOpen, onRemove, onPreview, isActive, isCompleted }: PlanCardProps) {
  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getFirstLine = (content: string) => {
    const lines = content.split('\n').filter(l => l.trim());
    const firstContent = lines.find(l => !l.startsWith('#')) || lines[0] || 'Untitled Plan';
    return firstContent.replace(/^[#\-*>\s]+/, '').slice(0, 60) + (firstContent.length > 60 ? '...' : '');
  };

  const isApproved = plan.status === PlanStatus.Approved;

  return (
    <div
      className={`
        group relative bg-card border rounded-lg p-4 transition-colors
        ${isActive ? 'border-primary' : 'border-border'}
        ${isCompleted ? 'opacity-75' : ''}
        ${onOpen && !isCompleted ? 'cursor-pointer hover:border-primary/50' : ''}
      `}
      onClick={() => onOpen?.()}
    >
      {/* Status indicator for completed items */}
      {isCompleted && (
        <div className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center ${
          isApproved ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
        }`}>
          {isApproved ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
        </div>
      )}

      {/* Project name */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
          {plan.project_name}
        </span>
      </div>

      {/* Plan preview */}
      <p className="text-sm text-foreground mb-3 line-clamp-2">
        {getFirstLine(plan.content)}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{getTimeAgo(plan.created_at)}</span>
        </div>

        <div className={`flex items-center gap-1 transition-opacity ${
          isCompleted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          {!isCompleted && onOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
              title="Open"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          {isCompleted && onPreview && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
              title="View Details"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
            title="Remove"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Feedback preview for completed items */}
      {isCompleted && plan.feedback && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {plan.feedback}
          </p>
        </div>
      )}
    </div>
  );
}
