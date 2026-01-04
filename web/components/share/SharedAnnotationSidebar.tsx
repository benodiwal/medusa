'use client';

import { ShareableAnnotation, AnnotationType, Block } from '../../lib/share';
import { BiX } from 'react-icons/bi';

interface SharedSidebarProps {
  annotations: ShareableAnnotation[];
  blocks: Block[];
  onSelect: (id: string | null) => void;
  selectedId: string | null;
  currentAuthor?: string;
  onDeleteLocal: (id: string) => void;
}

export function SharedAnnotationSidebar({
  annotations,
  blocks,
  onSelect,
  selectedId,
  currentAuthor,
  onDeleteLocal,
}: SharedSidebarProps) {
  // Sort annotations by block position
  const sortedAnnotations = [...annotations].sort((a, b) => {
    const blockA = blocks.findIndex(blk => blk.id === a.blockId);
    const blockB = blocks.findIndex(blk => blk.id === b.blockId);
    if (blockA !== blockB) return blockA - blockB;
    return a.startOffset - b.startOffset;
  });

  // Group annotations by author
  const byAuthor = sortedAnnotations.reduce((acc, ann) => {
    const author = ann.authorName || 'Anonymous';
    if (!acc[author]) acc[author] = [];
    acc[author].push(ann);
    return acc;
  }, {} as Record<string, ShareableAnnotation[]>);

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

  const getTypeColor = (type: AnnotationType) => {
    switch (type) {
      case AnnotationType.DELETION: return 'text-red-600';
      case AnnotationType.INSERTION: return 'text-green-600';
      case AnnotationType.REPLACEMENT: return 'text-orange-600';
      case AnnotationType.COMMENT: return 'text-blue-600';
      case AnnotationType.GLOBAL_COMMENT: return 'text-purple-600';
      default: return 'text-[#6B5B47]';
    }
  };

  const canDelete = (ann: ShareableAnnotation) => {
    return ann.authorName === currentAuthor;
  };

  if (annotations.length === 0) {
    return (
      <div className="w-80 border-l border-[#e5e2db] bg-white h-full flex flex-col">
        <div className="p-4 border-b border-[#e5e2db]">
          <h2 className="font-medium text-[#16110a]">Annotations</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-[#6B5B47] text-center">
            No annotations yet.<br />
            Select text to add feedback.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-[#e5e2db] bg-white h-full flex flex-col">
      <div className="p-4 border-b border-[#e5e2db]">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-[#16110a]">Annotations</h2>
          <span className="text-xs bg-[#f3f1e8] text-[#6B5B47] px-2 py-0.5 rounded">
            {annotations.length}
          </span>
        </div>
        <p className="text-xs text-[#6B5B47] mt-1">
          {Object.keys(byAuthor).length} contributor{Object.keys(byAuthor).length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {Object.entries(byAuthor).map(([author, anns]) => (
          <div key={author}>
            {/* Author header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full shrink-0 bg-[#6B5B47]" />
              <span className="text-xs font-medium text-[#6B5B47] truncate">
                {author}
                {author === currentAuthor && ' (you)'}
              </span>
              <span className="text-xs text-[#9a8b7a]">
                ({anns.length})
              </span>
            </div>

            {/* Author's annotations */}
            <div className="space-y-2 ml-4">
              {anns.map((ann) => (
                <div
                  key={ann.id}
                  onClick={() => onSelect(ann.id)}
                  className={`
                    group relative p-3 rounded-lg border border-l-[3px] border-l-[#6B5B47] cursor-pointer transition-colors
                    ${selectedId === ann.id
                      ? 'bg-[#f3f1e8] border-[#6B5B47]'
                      : 'bg-white border-[#e5e2db] hover:border-[#c9c3b8]'
                    }
                  `}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[10px] font-medium uppercase tracking-wide ${getTypeColor(ann.type)}`}>
                      {getTypeLabel(ann.type)}
                    </span>
                    {canDelete(ann) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLocal(ann.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[#6B5B47] hover:text-red-600 transition-opacity p-1"
                        title="Remove annotation"
                      >
                        <BiX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {ann.originalText && ann.type !== AnnotationType.GLOBAL_COMMENT && (
                    <div className="text-xs text-[#6B5B47] bg-[#f3f1e8] p-2 rounded mb-2 font-mono line-clamp-2">
                      &ldquo;{ann.originalText}&rdquo;
                    </div>
                  )}

                  {ann.text && ann.type !== AnnotationType.DELETION && (
                    <div className="text-sm text-[#16110a] line-clamp-3">
                      {ann.type === AnnotationType.REPLACEMENT && (
                        <span className="text-[#6B5B47] mr-1">&rarr;</span>
                      )}
                      {ann.text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
