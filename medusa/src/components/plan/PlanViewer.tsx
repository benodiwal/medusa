import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Highlighter from 'web-highlighter';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import { Block, Annotation, AnnotationType } from '../../types';
import { Toolbar } from './Toolbar';

interface ViewerProps {
  blocks: Block[];
  markdown: string;
  annotations: Annotation[];
  onAddAnnotation: (ann: Annotation) => void;
  onSelectAnnotation: (id: string | null) => void;
  onRemoveAnnotation: (id: string) => void;
  selectedAnnotationId: string | null;
}

export interface ViewerHandle {
  removeHighlight: (id: string) => void;
  clearAllHighlights: () => void;
}

export const PlanViewer = forwardRef<ViewerHandle, ViewerProps>(({
  blocks,
  markdown,
  annotations,
  onAddAnnotation,
  onSelectAnnotation,
  onRemoveAnnotation,
  selectedAnnotationId: _selectedAnnotationId,
}, ref) => {
  const [copied, setCopied] = useState(false);
  const [showGlobalCommentInput, setShowGlobalCommentInput] = useState(false);
  const [globalCommentValue, setGlobalCommentValue] = useState('');
  const globalCommentInputRef = useRef<HTMLInputElement>(null);

  const handleCopyPlan = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const handleAddGlobalComment = () => {
    if (!globalCommentValue.trim()) return;

    const newAnnotation: Annotation = {
      id: `global-${Date.now()}`,
      blockId: '',
      startOffset: 0,
      endOffset: 0,
      type: AnnotationType.GLOBAL_COMMENT,
      text: globalCommentValue.trim(),
      originalText: '',
      createdAt: Date.now(),
    };

    onAddAnnotation(newAnnotation);
    setGlobalCommentValue('');
    setShowGlobalCommentInput(false);
  };

  useEffect(() => {
    if (showGlobalCommentInput) {
      globalCommentInputRef.current?.focus();
    }
  }, [showGlobalCommentInput]);

  const containerRef = useRef<HTMLDivElement>(null);
  const highlighterRef = useRef<Highlighter | null>(null);
  const onAddAnnotationRef = useRef(onAddAnnotation);
  const onRemoveAnnotationRef = useRef(onRemoveAnnotation);
  const pendingSourceRef = useRef<any>(null);
  const isRestoringRef = useRef(false);
  const [toolbarState, setToolbarState] = useState<{ element: HTMLElement; source: any } | null>(null);
  const [clickedAnnotation, setClickedAnnotation] = useState<{ id: string; element: HTMLElement } | null>(null);
  const [hoveredCodeBlock, setHoveredCodeBlock] = useState<{ block: Block; element: HTMLElement } | null>(null);
  const [isCodeBlockToolbarExiting, setIsCodeBlockToolbarExiting] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onAddAnnotationRef.current = onAddAnnotation;
  }, [onAddAnnotation]);

  useEffect(() => {
    onRemoveAnnotationRef.current = onRemoveAnnotation;
  }, [onRemoveAnnotation]);

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

      const manualHighlights = containerRef.current?.querySelectorAll(`[data-bind-id="${id}"]`);
      manualHighlights?.forEach(el => {
        const parent = el.parentNode;
        while (el.firstChild) {
          parent?.insertBefore(el.firstChild, el);
        }
        el.remove();
      });
    },

    clearAllHighlights: () => {
      const manualHighlights = containerRef.current?.querySelectorAll('[data-bind-id]');
      manualHighlights?.forEach(el => {
        const parent = el.parentNode;
        while (el.firstChild) {
          parent?.insertBefore(el.firstChild, el);
        }
        el.remove();
      });

      const webHighlights = containerRef.current?.querySelectorAll('.annotation-highlight');
      webHighlights?.forEach(el => {
        const parent = el.parentNode;
        while (el.firstChild) {
          parent?.insertBefore(el.firstChild, el);
        }
        el.remove();
      });
    },
  }), []);

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
      // Skip showing toolbar when restoring persisted annotations
      if (isRestoringRef.current) return;

      if (sources.length > 0) {
        const source = sources[0];
        const doms = highlighter.getDoms(source.id);
        if (doms?.length > 0) {
          // Clean up previous pending highlight if exists
          if (pendingSourceRef.current) {
            highlighter.remove(pendingSourceRef.current.id);
            pendingSourceRef.current = null;
          }

          // Always show the annotation toolbar
          pendingSourceRef.current = source;
          setToolbarState({ element: doms[0] as HTMLElement, source });
        }
      }
    });

    highlighter.on(Highlighter.event.CLICK, ({ id }: { id: string }) => {
      // When clicking an existing annotation, show remove option
      const doms = highlighter.getDoms(id);
      if (doms?.length > 0) {
        setClickedAnnotation({ id, element: doms[0] as HTMLElement });
        onSelectAnnotation(id);
      }
    });

    highlighter.run();

    return () => highlighter.dispose();
  }, [onSelectAnnotation]);

  // Restore highlights from persisted annotations
  useEffect(() => {
    const highlighter = highlighterRef.current;
    if (!highlighter) return;

    // Set flag to prevent toolbar from showing during restoration
    isRestoringRef.current = true;

    annotations.forEach(ann => {
      try {
        // Skip global comments - they don't have text highlights
        if (ann.type === AnnotationType.GLOBAL_COMMENT) return;

        // Check if highlight already exists in DOM
        const existingDoms = highlighter.getDoms(ann.id);

        if (!existingDoms || existingDoms.length === 0) {
          // Highlight doesn't exist - try to recreate from stored metadata
          if (ann.startMeta && ann.endMeta) {
            // Use web-highlighter's fromStore to recreate the highlight
            const source = {
              id: ann.id,
              text: ann.originalText,
              startMeta: ann.startMeta,
              endMeta: ann.endMeta,
            };
            highlighter.fromStore(source.startMeta, source.endMeta, source.text, source.id);
          }
        }

        // Add the appropriate CSS class
        const doms = highlighter.getDoms(ann.id);
        if (doms?.length > 0) {
          if (ann.type === AnnotationType.DELETION) {
            highlighter.addClass('deletion', ann.id);
          } else if (ann.type === AnnotationType.COMMENT) {
            highlighter.addClass('comment', ann.id);
          } else if (ann.type === AnnotationType.REPLACEMENT) {
            highlighter.addClass('replacement', ann.id);
          }
        }
      } catch (e) {
        console.warn('Failed to restore annotation highlight:', ann.id, e);
      }
    });

    // Reset flag after restoration is complete
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

  const handleRemoveAnnotation = () => {
    if (!clickedAnnotation) return;

    // Remove highlight from DOM
    highlighterRef.current?.remove(clickedAnnotation.id);

    // Also check for manually created highlights
    const manualHighlights = containerRef.current?.querySelectorAll(`[data-bind-id="${clickedAnnotation.id}"]`);
    manualHighlights?.forEach(el => {
      const parent = el.parentNode;
      while (el.firstChild) {
        parent?.insertBefore(el.firstChild, el);
      }
      el.remove();
    });

    // Call the remove callback
    onRemoveAnnotationRef.current(clickedAnnotation.id);
    setClickedAnnotation(null);
  };

  const handleRemoveToolbarClose = () => {
    setClickedAnnotation(null);
  };

  const handleCodeBlockAnnotate = (type: AnnotationType, text?: string) => {
    const highlighter = highlighterRef.current;
    if (!hoveredCodeBlock || !highlighter) return;

    const codeEl = hoveredCodeBlock.element.querySelector('code');
    if (!codeEl) return;

    const range = document.createRange();
    range.selectNodeContents(codeEl);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    const id = `codeblock-${Date.now()}`;
    const codeText = codeEl.textContent || '';

    const wrapper = document.createElement('mark');
    wrapper.className = 'annotation-highlight';
    wrapper.dataset.bindId = id;

    range.surroundContents(wrapper);

    if (type === AnnotationType.DELETION) {
      wrapper.classList.add('deletion');
    } else if (type === AnnotationType.COMMENT) {
      wrapper.classList.add('comment');
    }

    const newAnnotation: Annotation = {
      id,
      blockId: hoveredCodeBlock.block.id,
      startOffset: 0,
      endOffset: codeText.length,
      type,
      text,
      originalText: codeText,
      createdAt: Date.now(),
    };

    onAddAnnotationRef.current(newAnnotation);

    selection?.removeAllRanges();
    setHoveredCodeBlock(null);
  };

  const handleCodeBlockToolbarClose = () => {
    setHoveredCodeBlock(null);
  };

  return (
    <div className="relative z-50 w-full max-w-3xl">
      <article
        ref={containerRef}
        className="w-full max-w-3xl bg-card border border-border/50 rounded-xl shadow-xl p-5 md:p-10 lg:p-14 relative"
      >
        <div className="absolute top-3 right-3 md:top-5 md:right-5 flex items-center gap-2">
          {showGlobalCommentInput ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddGlobalComment();
              }}
              className="flex items-center gap-1.5 bg-muted/80 rounded-md p-1"
            >
              <input
                ref={globalCommentInputRef}
                type="text"
                className="bg-transparent border-none outline-none text-xs w-40 md:w-56 px-2 placeholder:text-muted-foreground"
                placeholder="Add a global comment..."
                value={globalCommentValue}
                onChange={(e) => setGlobalCommentValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowGlobalCommentInput(false);
                    setGlobalCommentValue('');
                  }
                }}
              />
              <button
                type="submit"
                disabled={!globalCommentValue.trim()}
                className="px-2 py-1 text-xs font-medium rounded bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 transition-all"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowGlobalCommentInput(false);
                  setGlobalCommentValue('');
                }}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowGlobalCommentInput(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors"
              title="Add global comment"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
              <span className="hidden md:inline">Global comment</span>
            </button>
          )}

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
                <span className="hidden md:inline">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="hidden md:inline">Copy plan</span>
              </>
            )}
          </button>
        </div>

        {blocks.map(block => (
          block.type === 'code' ? (
            <CodeBlock
              key={block.id}
              block={block}
              onHover={(element) => {
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                  hoverTimeoutRef.current = null;
                }
                setIsCodeBlockToolbarExiting(false);
                if (!toolbarState) {
                  setHoveredCodeBlock({ block, element });
                }
              }}
              onLeave={() => {
                hoverTimeoutRef.current = setTimeout(() => {
                  setIsCodeBlockToolbarExiting(true);
                  setTimeout(() => {
                    setHoveredCodeBlock(null);
                    setIsCodeBlockToolbarExiting(false);
                  }, 150);
                }, 100);
              }}
              isHovered={hoveredCodeBlock?.block.id === block.id}
            />
          ) : (
            <BlockRenderer key={block.id} block={block} />
          )
        ))}

        <Toolbar
          highlightElement={toolbarState?.element ?? null}
          onAnnotate={handleAnnotate}
          onClose={handleToolbarClose}
        />

        {hoveredCodeBlock && !toolbarState && (
          <CodeBlockToolbar
            element={hoveredCodeBlock.element}
            onAnnotate={handleCodeBlockAnnotate}
            onClose={handleCodeBlockToolbarClose}
            isExiting={isCodeBlockToolbarExiting}
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
              }
              setIsCodeBlockToolbarExiting(false);
            }}
            onMouseLeave={() => {
              hoverTimeoutRef.current = setTimeout(() => {
                setIsCodeBlockToolbarExiting(true);
                setTimeout(() => {
                  setHoveredCodeBlock(null);
                  setIsCodeBlockToolbarExiting(false);
                }, 150);
              }, 100);
            }}
          />
        )}

        {/* Remove annotation toolbar - shows when clicking existing annotation */}
        {clickedAnnotation && !toolbarState && (
          <RemoveAnnotationToolbar
            element={clickedAnnotation.element}
            onRemove={handleRemoveAnnotation}
            onClose={handleRemoveToolbarClose}
          />
        )}
      </article>
    </div>
  );
});

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

    match = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (match) {
      parts.push(
        <a
          key={key++}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:text-primary/80"
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

const parseTableContent = (content: string): { headers: string[]; rows: string[][] } => {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    return line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(cell => cell.trim());
  };

  const headers = parseRow(lines[0]);
  const rows: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^[\|\-:\s]+$/.test(line)) continue;
    rows.push(parseRow(line));
  }

  return { headers, rows };
};

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

    case 'table': {
      const { headers, rows } = parseTableContent(block.content);
      return (
        <div className="my-4 overflow-x-auto" data-block-id={block.id}>
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                {headers.map((header, i) => (
                  <th
                    key={i}
                    className="px-3 py-2 text-left font-semibold text-foreground/90 bg-muted/30"
                  >
                    <InlineMarkdown text={header} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-b border-border/50 hover:bg-muted/20">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-3 py-2 text-foreground/80">
                      <InlineMarkdown text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'hr':
      return <hr className="border-border/30 my-8" data-block-id={block.id} />;

    default:
      return (
        <p
          className="mb-4 leading-relaxed text-foreground/90 text-[15px]"
          data-block-id={block.id}
        >
          <InlineMarkdown text={block.content} />
        </p>
      );
  }
};

interface CodeBlockProps {
  block: Block;
  onHover?: (element: HTMLElement) => void;
  onLeave?: () => void;
  isHovered?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ block, onHover, onLeave, isHovered: _isHovered }) => {
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.removeAttribute('data-highlighted');
      codeRef.current.className = `hljs font-mono${block.language ? ` language-${block.language}` : ''}`;
      hljs.highlightElement(codeRef.current);
    }
  }, [block.content, block.language]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(block.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [block.content]);

  const handleMouseEnter = () => {
    if (containerRef.current && onHover) {
      onHover(containerRef.current);
    }
  };

  const codeClassName = `hljs font-mono${block.language ? ` language-${block.language}` : ''}`;

  return (
    <div
      ref={containerRef}
      className="relative group my-5"
      data-block-id={block.id}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
    >
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title={copied ? 'Copied!' : 'Copy code'}
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
        <code ref={codeRef} className={codeClassName}>{block.content}</code>
      </pre>
    </div>
  );
};

const CodeBlockToolbar: React.FC<{
  element: HTMLElement;
  onAnnotate: (type: AnnotationType, text?: string) => void;
  onClose: () => void;
  isExiting: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}> = ({ element, onAnnotate, onClose, isExiting, onMouseEnter, onMouseLeave }) => {
  const [step, setStep] = useState<'menu' | 'input'>('menu');
  const [inputValue, setInputValue] = useState('');
  const [position, setPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (step === 'input') inputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    const updatePosition = () => {
      const rect = element.getBoundingClientRect();
      setPosition({
        top: rect.top - 40,
        right: window.innerWidth - rect.right,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [element]);

  const { top, right } = position;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAnnotate(AnnotationType.COMMENT, inputValue);
    }
  };

  return createPortal(
    <div
      className="annotation-toolbar fixed z-[100] bg-popover border border-border rounded-lg shadow-2xl"
      style={{
        top,
        right,
        animation: isExiting ? 'code-toolbar-out 0.15s ease-in forwards' : 'code-toolbar-in 0.2s ease-out',
      }}
      onMouseDown={e => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <style>{`
        @keyframes code-toolbar-in {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes code-toolbar-out {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(8px);
          }
        }
      `}</style>
      {step === 'menu' ? (
        <div className="flex items-center p-1 gap-0.5">
          <button
            onClick={() => onAnnotate(AnnotationType.DELETION)}
            title="Delete"
            className="p-1.5 rounded-md transition-colors text-destructive hover:bg-destructive/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            onClick={() => setStep('input')}
            title="Comment"
            className="p-1.5 rounded-md transition-colors text-accent hover:bg-accent/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </button>
          <div className="w-px h-5 bg-border mx-0.5" />
          <button
            onClick={onClose}
            title="Cancel"
            className="p-1.5 rounded-md transition-colors text-muted-foreground hover:bg-muted"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-start gap-1.5 p-1.5 pl-3">
          <textarea
            ref={inputRef}
            rows={1}
            className="bg-transparent text-sm min-w-44 max-w-80 max-h-32 placeholder:text-muted-foreground resize-none px-2 py-1.5 focus:outline-none focus:bg-muted/30"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
            placeholder="Add a comment..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') setStep('menu');
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && inputValue.trim()) {
                e.preventDefault();
                onAnnotate(AnnotationType.COMMENT, inputValue);
              }
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="px-[15px] py-1 text-xs font-medium rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity self-stretch"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setStep('menu')}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </form>
      )}
    </div>,
    document.body
  );
};

// Toolbar for removing an existing annotation
const RemoveAnnotationToolbar: React.FC<{
  element: HTMLElement;
  onRemove: () => void;
  onClose: () => void;
}> = ({ element, onRemove, onClose }) => {
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    const updatePosition = () => {
      const rect = element.getBoundingClientRect();
      setPosition({
        top: rect.top - 48,
        left: rect.left + rect.width / 2,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [element]);

  const { top, left } = position;

  return createPortal(
    <div
      className="annotation-toolbar fixed z-[100] bg-popover border border-border rounded-lg shadow-2xl transform -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-150"
      style={{ top, left }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center p-1 gap-0.5">
        <button
          onClick={onRemove}
          title="Remove annotation"
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors text-destructive hover:bg-destructive/10 text-xs font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Remove
        </button>
        <div className="w-px h-5 bg-border mx-0.5" />
        <button
          onClick={onClose}
          title="Cancel"
          className="p-1.5 rounded-md transition-colors text-muted-foreground hover:bg-muted"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
};
