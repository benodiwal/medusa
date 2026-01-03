import React from 'react';
import { Annotation, AnnotationType, Block } from '../../types';

interface SidebarProps {
  annotations: Annotation[];
  blocks: Block[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  selectedId: string | null;
}

export const AnnotationSidebar: React.FC<SidebarProps> = ({
  annotations,
  blocks,
  onSelect,
  onDelete,
  selectedId
}) => {
  const sortedAnnotations = [...annotations].sort((a, b) => {
    const blockA = blocks.findIndex(blk => blk.id === a.blockId);
    const blockB = blocks.findIndex(blk => blk.id === b.blockId);
    if (blockA !== blockB) return blockA - blockB;
    return a.startOffset - b.startOffset;
  });

  const getTypeLabel = (type: AnnotationType) => {
    switch (type) {
      case AnnotationType.DELETION: return 'Remove';
      case AnnotationType.INSERTION: return 'Add';
      case AnnotationType.REPLACEMENT: return 'Replace';
      case AnnotationType.COMMENT: return 'Comment';
      case AnnotationType.GLOBAL_COMMENT: return 'Global';
      default: return type;
    }
  };

  return (
    <div className="w-72 border-l border-border bg-card h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-foreground">Annotations</h2>
          {annotations.length > 0 && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
              {annotations.length}
            </span>
          )}
        </div>
      </div>

      {/* Annotations list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sortedAnnotations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-muted-foreground">No annotations yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Select text to add comments or mark for removal
            </p>
          </div>
        ) : (
          sortedAnnotations.map((ann) => (
            <div
              key={ann.id}
              onClick={() => onSelect(ann.id)}
              className={`
                group relative p-3 rounded-lg border cursor-pointer transition-colors
                ${selectedId === ann.id
                  ? 'bg-accent/10 border-accent'
                  : 'bg-background border-border hover:border-muted-foreground/30'
                }
              `}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {getTypeLabel(ann.type)}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(ann.id); }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-1"
                  title="Remove"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Original text */}
              {ann.originalText && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded mb-2 font-mono truncate">
                  "{ann.originalText}"
                </div>
              )}

              {/* Comment/Replacement text */}
              {(ann.text && ann.type !== AnnotationType.DELETION) && (
                <div className={`text-sm text-foreground pl-2 border-l-2 ${
                  ann.type === AnnotationType.REPLACEMENT
                    ? 'border-orange-500'
                    : 'border-primary'
                }`}>
                  {ann.type === AnnotationType.REPLACEMENT && (
                    <span className="text-orange-500 text-xs font-medium mr-1">→</span>
                  )}
                  {ann.text}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
