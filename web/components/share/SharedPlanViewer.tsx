'use client';

import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { Block, Annotation, AnnotationType, ShareableAnnotation } from '../../lib/share';
import { Toolbar } from './Toolbar';

// Dynamic imports for client-only modules
let Highlighter: any = null;
let hljs: any = null;

interface SharedViewerProps {
  blocks: Block[];
  markdown: string;
  annotations: ShareableAnnotation[];
  onAddAnnotation: (ann: Annotation) => void;
  onSelectAnnotation: (id: string | null) => void;
  selectedAnnotationId: string | null;
  readOnlyAnnotationIds?: string[];
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
  const highlighterRef = useRef<any>(null);
  const onAddAnnotationRef = useRef(onAddAnnotation);
  const pendingSourceRef = useRef<any>(null);
  const isRestoringRef = useRef(false);
  const [toolbarState, setToolbarState] = useState<{ element: HTMLElement; source: any } | null>(null);
  const [clickedAnnotation, setClickedAnnotation] = useState<{ id: string; element: HTMLElement; isReadOnly: boolean } | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load client-only modules
  useEffect(() => {
    const loadModules = async () => {
      const [highlighterModule, hljsModule] = await Promise.all([
        import('web-highlighter'),
        import('highlight.js'),
      ]);
      Highlighter = highlighterModule.default;
      hljs = hljsModule.default;
      setMounted(true);
    };
    loadModules();
  }, []);

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
    highlighter: any,
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
      // Try to remove via highlighter first
      highlighterRef.current?.remove(id);

      // Also remove manually created marks (for restored annotations)
      const mark = containerRef.current?.querySelector(`mark[data-highlight-id="${id}"]`);
      if (mark) {
        const parent = mark.parentNode;
        while (mark.firstChild) {
          parent?.insertBefore(mark.firstChild, mark);
        }
        mark.remove();
      }
    },
  }), []);

  // Initialize highlighter
  useEffect(() => {
    if (!containerRef.current || !mounted) return;

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
  }, [onSelectAnnotation, readOnlyAnnotationIds, mounted]);

  // Restore annotations using web-highlighter's fromStore method (same as desktop)
  useEffect(() => {
    const highlighter = highlighterRef.current;
    const container = containerRef.current;
    if (!highlighter || !mounted || !container) return;

    isRestoringRef.current = true;

    annotations.forEach(ann => {
      try {
        if (ann.type === AnnotationType.GLOBAL_COMMENT) return;

        // Check if highlight already exists
        const existingDoms = highlighter.getDoms(ann.id);
        if (existingDoms && existingDoms.length > 0) {
          // Already highlighted, just ensure correct class
          if (ann.type === AnnotationType.DELETION) {
            highlighter.addClass('deletion', ann.id);
          } else if (ann.type === AnnotationType.COMMENT) {
            highlighter.addClass('comment', ann.id);
          } else if (ann.type === AnnotationType.REPLACEMENT) {
            highlighter.addClass('replacement', ann.id);
          }
          return;
        }

        // Try web-highlighter's fromStore first if metadata exists
        let highlightCreated = false;
        if (ann.startMeta && ann.endMeta && ann.originalText) {
          try {
            highlighter.fromStore(ann.startMeta, ann.endMeta, ann.originalText, ann.id);
            const doms = highlighter.getDoms(ann.id);
            if (doms?.length > 0) {
              highlightCreated = true;
              if (ann.type === AnnotationType.DELETION) {
                highlighter.addClass('deletion', ann.id);
              } else if (ann.type === AnnotationType.COMMENT) {
                highlighter.addClass('comment', ann.id);
              } else if (ann.type === AnnotationType.REPLACEMENT) {
                highlighter.addClass('replacement', ann.id);
              }
            }
          } catch {
            // fromStore failed, will fall back to text search
          }
        }

        // Fall back to text search if fromStore didn't work or metadata missing
        if (!highlightCreated && ann.originalText) {
          // Text search fallback: find text across DOM nodes
          const textToFind = ann.originalText;
          const searchRoot = container;

          // Collect all text nodes and build accumulated string
          const walker = document.createTreeWalker(searchRoot, NodeFilter.SHOW_TEXT, null);
          const textNodes: { node: Node; start: number; text: string }[] = [];
          let accumulated = '';

          let node: Node | null;
          while ((node = walker.nextNode())) {
            textNodes.push({
              node,
              start: accumulated.length,
              text: node.textContent || ''
            });
            accumulated += node.textContent || '';
          }

          // Find text in accumulated string
          const index = accumulated.indexOf(textToFind);

          if (index !== -1) {
            const endIndex = index + textToFind.length;

            // Find start and end nodes/offsets
            let startNode: Node | null = null;
            let startOffset = 0;
            let endNode: Node | null = null;
            let endOffset = 0;

            for (const tn of textNodes) {
              const nodeEnd = tn.start + tn.text.length;

              if (!startNode && index >= tn.start && index < nodeEnd) {
                startNode = tn.node;
                startOffset = index - tn.start;
              }

              if (endIndex > tn.start && endIndex <= nodeEnd) {
                endNode = tn.node;
                endOffset = endIndex - tn.start;
                break;
              }
            }

            if (startNode && endNode) {
              try {
                const range = document.createRange();
                range.setStart(startNode, startOffset);
                range.setEnd(endNode, endOffset);

                // Use fromRange if available to get proper metadata
                if (typeof highlighter.fromRange === 'function') {
                  const tempSource = highlighter.fromRange(range);
                  if (tempSource) {
                    highlighter.remove(tempSource.id);
                    highlighter.fromStore(tempSource.startMeta, tempSource.endMeta, textToFind, ann.id);

                    if (ann.type === AnnotationType.DELETION) {
                      highlighter.addClass('deletion', ann.id);
                    } else if (ann.type === AnnotationType.COMMENT) {
                      highlighter.addClass('comment', ann.id);
                    } else if (ann.type === AnnotationType.REPLACEMENT) {
                      highlighter.addClass('replacement', ann.id);
                    }
                  }
                } else if (startNode === endNode) {
                  // Manual fallback for same-node ranges
                  const mark = document.createElement('mark');
                  mark.className = 'annotation-highlight';
                  mark.dataset.highlightId = ann.id;

                  if (ann.type === AnnotationType.DELETION) {
                    mark.classList.add('deletion');
                  } else if (ann.type === AnnotationType.COMMENT) {
                    mark.classList.add('comment');
                  } else if (ann.type === AnnotationType.REPLACEMENT) {
                    mark.classList.add('replacement');
                  }

                  range.surroundContents(mark);
                }

                window.getSelection()?.removeAllRanges();
              } catch {
                // Highlight creation failed silently
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to restore annotation highlight:', ann.id, e);
      }
    });

    isRestoringRef.current = false;
  }, [annotations, blocks, mounted]);

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
        className="w-full max-w-3xl bg-white border border-[#e5e2db] rounded-xl shadow-lg p-5 md:p-10 lg:p-14 relative"
      >
        <div className="absolute top-3 right-3 md:top-5 md:right-5">
          <button
            onClick={handleCopyPlan}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#6B5B47] hover:text-[#16110a] bg-[#f3f1e8] hover:bg-[#e5e2db] rounded-md transition-colors"
            title={copied ? 'Copied!' : 'Copy plan'}
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
        {mounted && clickedAnnotation && clickedAnnotation.isReadOnly && (
          <ReadOnlyTooltip
            element={clickedAnnotation.element}
            onClose={() => setClickedAnnotation(null)}
          />
        )}
      </article>
    </div>
  );
});

SharedPlanViewer.displayName = 'SharedPlanViewer';

// Simple block renderer
const BlockRenderer: React.FC<{ block: Block }> = ({ block }) => {
  switch (block.type) {
    case 'heading': {
      const level = block.level || 1;
      const styles: Record<number, string> = {
        1: 'text-2xl font-bold mb-4 mt-6 first:mt-0 tracking-tight text-[#16110a]',
        2: 'text-xl font-semibold mb-3 mt-8 text-[#16110a]',
        3: 'text-base font-semibold mb-2 mt-6 text-[#16110a]',
      };
      const className = styles[level] || 'text-base font-semibold mb-2 mt-4 text-[#16110a]';
      return React.createElement(
        `h${level}`,
        { className, 'data-block-id': block.id },
        <InlineMarkdown text={block.content} />
      );
    }

    case 'blockquote':
      return (
        <blockquote
          className="border-l-2 border-[#6B5B47]/50 pl-4 my-4 text-[#6B5B47] italic"
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
                <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-[#c9c3b8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="9" />
                </svg>
              )
            ) : (
              <span className="text-[#6B5B47]/60">
                {(block.level || 0) === 0 ? '•' : (block.level || 0) === 1 ? '◦' : '▪'}
              </span>
            )}
          </span>
          <span className={`text-sm leading-relaxed ${isCheckbox && block.checked ? 'text-[#9a8b7a] line-through' : 'text-[#16110a]/90'}`}>
            <InlineMarkdown text={block.content} />
          </span>
        </div>
      );
    }

    case 'code':
      return <CodeBlock block={block} />;

    case 'hr':
      return <hr className="border-[#e5e2db] my-8" data-block-id={block.id} />;

    default:
      return (
        <p className="mb-4 leading-relaxed text-[#16110a]/90 text-[15px]" data-block-id={block.id}>
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
      parts.push(<strong key={key++} className="font-semibold text-[#16110a]">{match[1]}</strong>);
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
        <code key={key++} className="px-1.5 py-0.5 rounded bg-[#f3f1e8] text-sm font-mono text-[#16110a]">
          {match[1]}
        </code>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Link support - same as desktop
    match = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (match) {
      parts.push(
        <a
          key={key++}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#D2691E] underline underline-offset-2 hover:text-[#D2691E]/80"
        >
          {match[1]}
        </a>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    const nextSpecial = remaining.slice(1).search(/[\*`\[]/);
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
    if (codeRef.current && hljs) {
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
        className="absolute top-2 right-2 p-1.5 rounded-md bg-[#f3f1e8]/80 hover:bg-[#e5e2db] text-[#6B5B47] hover:text-[#16110a] opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        {copied ? (
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
      <pre className="rounded-lg text-[13px] overflow-hidden border border-[#e5e2db]">
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
      className="fixed z-[100] px-3 py-1.5 bg-[#f3f1e8] text-[#6B5B47] text-xs rounded-lg shadow-lg transform -translate-x-1/2 border border-[#e5e2db]"
      style={{ top: position.top, left: position.left }}
    >
      This annotation was added by another reviewer
    </div>,
    document.body
  );
};

