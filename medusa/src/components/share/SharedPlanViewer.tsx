import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import Highlighter from 'web-highlighter';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import { Block, Annotation, AnnotationType, ShareableAnnotation } from '../../types';
import { Toolbar } from '../plan/Toolbar';

interface SharedViewerProps {
  blocks: Block[];
  markdown: string;
  annotations: ShareableAnnotation[];
  onAddAnnotation: (ann: Annotation) => void;
  onSelectAnnotation: (id: string | null) => void;
  selectedAnnotationId: string | null;
  readOnlyAnnotationIds?: string[]; // IDs of annotations that can't be modified
}

export interface SharedViewerHandle {
  removeHighlight: (id: string) => void;
}

export const SharedPlanViewer = forwardRef<SharedViewerHandle, SharedViewerProps>(({
  blocks,
  markdown,
  annotations,
  onAddAnnotation,
  onSelectAnnotation,
  selectedAnnotationId: _selectedAnnotationId,
  readOnlyAnnotationIds = [],
}, ref) => {
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const highlighterRef = useRef<Highlighter | null>(null);
  const onAddAnnotationRef = useRef(onAddAnnotation);
  const pendingSourceRef = useRef<any>(null);
  const isRestoringRef = useRef(false);
  const [toolbarState, setToolbarState] = useState<{ element: HTMLElement; source: any } | null>(null);
  const [clickedAnnotation, setClickedAnnotation] = useState<{ id: string; element: HTMLElement; isReadOnly: boolean } | null>(null);

  useEffect(() => {
    onAddAnnotationRef.current = onAddAnnotation;
  }, [onAddAnnotation]);

  const handleCopyPlan = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const createAnnotationFromSource = (
    highlighter: Highlighter,
    source: any,
    type: AnnotationType,
    text?: string
  ) => {
    const doms = highlighter.getDoms(source.id);
    let blockId = '';
    let startOffset = 0;

    if (doms?.length > 0) {
      const el = doms[0] as HTMLElement;
      let parent = el.parentElement;
      while (parent && !parent.dataset.blockId) {
        parent = parent.parentElement;
      }
      if (parent?.dataset.blockId) {
        blockId = parent.dataset.blockId;
        const blockText = parent.textContent || '';
        const beforeText = blockText.split(source.text)[0];
        startOffset = beforeText?.length || 0;
      }
    }

    const newAnnotation: Annotation = {
      id: source.id,
      blockId,
      startOffset,
      endOffset: startOffset + source.text.length,
      type,
      text,
      originalText: source.text,
      createdAt: Date.now(),
      startMeta: source.startMeta,
      endMeta: source.endMeta,
    };

    if (type === AnnotationType.DELETION) {
      highlighter.addClass('deletion', source.id);
    } else if (type === AnnotationType.COMMENT) {
      highlighter.addClass('comment', source.id);
    } else if (type === AnnotationType.REPLACEMENT) {
      highlighter.addClass('replacement', source.id);
    }

    onAddAnnotationRef.current(newAnnotation);
  };

  useImperativeHandle(ref, () => ({
    removeHighlight: (id: string) => {
      highlighterRef.current?.remove(id);
    },
  }), []);

  // Initialize highlighter
  useEffect(() => {
    if (!containerRef.current) return;

    const highlighter = new Highlighter({
      $root: containerRef.current,
      exceptSelectors: ['.annotation-toolbar', 'button'],
      wrapTag: 'mark',
      style: { className: 'annotation-highlight' }
    });

    highlighterRef.current = highlighter;

    highlighter.on(Highlighter.event.CREATE, ({ sources }: { sources: any[] }) => {
      if (isRestoringRef.current) return;

      if (sources.length > 0) {
        const source = sources[0];
        const doms = highlighter.getDoms(source.id);
        if (doms?.length > 0) {
          if (pendingSourceRef.current) {
            highlighter.remove(pendingSourceRef.current.id);
            pendingSourceRef.current = null;
          }
          pendingSourceRef.current = source;
          setToolbarState({ element: doms[0] as HTMLElement, source });
        }
      }
    });

    highlighter.on(Highlighter.event.CLICK, ({ id }: { id: string }) => {
      const doms = highlighter.getDoms(id);
      if (doms?.length > 0) {
        const isReadOnly = readOnlyAnnotationIds.includes(id);
        setClickedAnnotation({ id, element: doms[0] as HTMLElement, isReadOnly });
        onSelectAnnotation(id);
      }
    });

    highlighter.run();

    return () => highlighter.dispose();
  }, [onSelectAnnotation, readOnlyAnnotationIds]);

  // Restore annotations with author colors
  useEffect(() => {
    const highlighter = highlighterRef.current;
    if (!highlighter) return;

    isRestoringRef.current = true;

    annotations.forEach(ann => {
      try {
        if (ann.type === AnnotationType.GLOBAL_COMMENT) return;

        const existingDoms = highlighter.getDoms(ann.id);

        if (!existingDoms || existingDoms.length === 0) {
          if (ann.startMeta && ann.endMeta) {
            highlighter.fromStore(ann.startMeta, ann.endMeta, ann.originalText, ann.id);
          }
        }

        const doms = highlighter.getDoms(ann.id);
        if (doms?.length > 0) {
          // Apply type-based styling
          if (ann.type === AnnotationType.DELETION) {
            highlighter.addClass('deletion', ann.id);
          } else if (ann.type === AnnotationType.COMMENT) {
            highlighter.addClass('comment', ann.id);
          } else if (ann.type === AnnotationType.REPLACEMENT) {
            highlighter.addClass('replacement', ann.id);
          }

          // Apply author color as border
          if (ann.authorColor) {
            doms.forEach(dom => {
              (dom as HTMLElement).style.borderBottom = `2px solid ${ann.authorColor}`;
            });
          }
        }
      } catch (e) {
        console.warn('Failed to restore annotation:', ann.id, e);
      }
    });

    isRestoringRef.current = false;
  }, [annotations, blocks]);

  const handleAnnotate = (type: AnnotationType, text?: string) => {
    const highlighter = highlighterRef.current;
    if (!toolbarState || !highlighter) return;

    createAnnotationFromSource(highlighter, toolbarState.source, type, text);
    pendingSourceRef.current = null;
    setToolbarState(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleToolbarClose = () => {
    if (toolbarState && highlighterRef.current) {
      highlighterRef.current.remove(toolbarState.source.id);
    }
    pendingSourceRef.current = null;
    setToolbarState(null);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div className="relative z-50 w-full max-w-3xl">
      <article
        ref={containerRef}
        className="w-full max-w-3xl bg-card border border-border/50 rounded-xl shadow-xl p-5 md:p-10 lg:p-14 relative"
      >
        <div className="absolute top-3 right-3 md:top-5 md:right-5">
          <button
            onClick={handleCopyPlan}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors"
            title={copied ? 'Copied!' : 'Copy plan'}
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {blocks.map(block => (
          <BlockRenderer key={block.id} block={block} />
        ))}

        <Toolbar
          highlightElement={toolbarState?.element ?? null}
          onAnnotate={handleAnnotate}
          onClose={handleToolbarClose}
        />

        {/* Info tooltip for read-only annotations */}
        {clickedAnnotation && clickedAnnotation.isReadOnly && (
          <ReadOnlyTooltip
            element={clickedAnnotation.element}
            onClose={() => setClickedAnnotation(null)}
          />
        )}
      </article>
    </div>
  );
});

// Simple block renderer
const BlockRenderer: React.FC<{ block: Block }> = ({ block }) => {
  switch (block.type) {
    case 'heading': {
      const level = block.level || 1;
      const styles: Record<number, string> = {
        1: 'text-2xl font-bold mb-4 mt-6 first:mt-0 tracking-tight',
        2: 'text-xl font-semibold mb-3 mt-8 text-foreground/90',
        3: 'text-base font-semibold mb-2 mt-6 text-foreground/80',
      };
      const className = styles[level] || 'text-base font-semibold mb-2 mt-4';
      return React.createElement(
        `h${level}`,
        { className, 'data-block-id': block.id },
        <InlineMarkdown text={block.content} />
      );
    }

    case 'blockquote':
      return (
        <blockquote
          className="border-l-2 border-primary/50 pl-4 my-4 text-muted-foreground italic"
          data-block-id={block.id}
        >
          <InlineMarkdown text={block.content} />
        </blockquote>
      );

    case 'list-item': {
      const indent = (block.level || 0) * 1.25;
      const isCheckbox = block.checked !== undefined;
      return (
        <div
          className="flex gap-3 my-1.5"
          data-block-id={block.id}
          style={{ marginLeft: `${indent}rem` }}
        >
          <span className="select-none shrink-0 flex items-center">
            {isCheckbox ? (
              block.checked ? (
                <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="9" />
                </svg>
              )
            ) : (
              <span className="text-primary/60">
                {(block.level || 0) === 0 ? '•' : (block.level || 0) === 1 ? '◦' : '▪'}
              </span>
            )}
          </span>
          <span className={`text-sm leading-relaxed ${isCheckbox && block.checked ? 'text-muted-foreground line-through' : 'text-foreground/90'}`}>
            <InlineMarkdown text={block.content} />
          </span>
        </div>
      );
    }

    case 'code':
      return <CodeBlock block={block} />;

    case 'hr':
      return <hr className="border-border/30 my-8" data-block-id={block.id} />;

    default:
      return (
        <p className="mb-4 leading-relaxed text-foreground/90 text-[15px]" data-block-id={block.id}>
          <InlineMarkdown text={block.content} />
        </p>
      );
  }
};

const InlineMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    let match = remaining.match(/^\*\*(.+?)\*\*/);
    if (match) {
      parts.push(<strong key={key++} className="font-semibold">{match[1]}</strong>);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    match = remaining.match(/^\*(.+?)\*/);
    if (match) {
      parts.push(<em key={key++}>{match[1]}</em>);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    match = remaining.match(/^`([^`]+)`/);
    if (match) {
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">
          {match[1]}
        </code>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    const nextSpecial = remaining.slice(1).search(/[\*`]/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else {
      parts.push(remaining.slice(0, nextSpecial + 1));
      remaining = remaining.slice(nextSpecial + 1);
    }
  }

  return <>{parts}</>;
};

const CodeBlock: React.FC<{ block: Block }> = ({ block }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.removeAttribute('data-highlighted');
      codeRef.current.className = `hljs font-mono${block.language ? ` language-${block.language}` : ''}`;
      hljs.highlightElement(codeRef.current);
    }
  }, [block.content, block.language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(block.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative group my-5" data-block-id={block.id}>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        {copied ? (
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
      <pre className="rounded-lg text-[13px] overflow-x-auto bg-muted/50 border border-border/30">
        <code ref={codeRef} className={`hljs font-mono${block.language ? ` language-${block.language}` : ''}`}>
          {block.content}
        </code>
      </pre>
    </div>
  );
};

const ReadOnlyTooltip: React.FC<{ element: HTMLElement; onClose: () => void }> = ({ element, onClose }) => {
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    const rect = element.getBoundingClientRect();
    setPosition({
      top: rect.top - 40,
      left: rect.left + rect.width / 2,
    });

    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [element, onClose]);

  return createPortal(
    <div
      className="fixed z-[100] px-3 py-1.5 bg-muted text-muted-foreground text-xs rounded-lg shadow-lg transform -translate-x-1/2"
      style={{ top: position.top, left: position.left }}
    >
      This annotation was added by another reviewer
    </div>,
    document.body
  );
};
