import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Settings } from 'lucide-react';
import { PlanViewer, ViewerHandle, AnnotationSidebar, DecisionBar } from '../components/plan';
import { Block, Annotation } from '../types';
import { parseMarkdownToBlocks, exportFeedback } from '../utils/parser';

interface PlanResponse {
  content: string;
  source?: string;
  hook_mode?: boolean;
}


export default function PlanReview() {
  const [markdown, setMarkdown] = useState<string>('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<string | undefined>();
  const [isHookMode, setIsHookMode] = useState(false);

  const viewerRef = useRef<ViewerHandle>(null);
  const navigate = useNavigate();

  // Load plan on mount
  useEffect(() => {
    const loadPlan = async () => {
      try {
        // Try to get plan from Tauri backend first
        const response = await invoke<PlanResponse>('get_plan');
        if (response.content) {
          setMarkdown(response.content);
          setBlocks(parseMarkdownToBlocks(response.content));
          setSource(response.source);
          setIsHookMode(response.hook_mode || false);
        }
        // If no content, leave markdown empty to show empty state
      } catch (error) {
        console.log('No plan available:', error);
        // Leave markdown empty to show empty state
      } finally {
        setIsLoading(false);
      }
    };

    loadPlan();
  }, []);

  const handleOpenFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }]
      });

      if (selected) {
        // Read file content via Tauri
        const content = await invoke<string>('read_file', { path: selected });
        setMarkdown(content);
        setBlocks(parseMarkdownToBlocks(content));
        setSource(selected as string);
        setAnnotations([]);
        viewerRef.current?.clearAllHighlights();
      }
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const handleAddAnnotation = useCallback((ann: Annotation) => {
    setAnnotations(prev => [...prev, ann]);
  }, []);

  const handleSelectAnnotation = useCallback((id: string | null) => {
    setSelectedAnnotationId(id);
  }, []);

  const handleDeleteAnnotation = useCallback((id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    viewerRef.current?.removeHighlight(id);
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(null);
    }
  }, [selectedAnnotationId]);

  const handleApprove = async () => {
    try {
      await invoke('approve_plan', {
        request: {
          feedback: annotations.length > 0 ? exportFeedback(blocks, annotations) : undefined,
          annotations
        }
      });
    } catch (error) {
      console.error('Failed to approve:', error);
      throw error;
    }
  };

  const handleDeny = async (feedback: string) => {
    try {
      await invoke('deny_plan', {
        request: {
          feedback: feedback || 'Changes requested'
        }
      });
    } catch (error) {
      console.error('Failed to deny:', error);
      throw error;
    }
  };

  const getFeedback = useCallback(() => {
    return exportFeedback(blocks, annotations);
  }, [blocks, annotations]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading plan...</p>
        </div>
      </div>
    );
  }

  if (!markdown) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-8 max-w-md px-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <img
              src="/medusa-logo.png"
              alt="Medusa"
              className="w-20 h-20 object-contain"
            />
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-foreground">Medusa</h1>
              <p className="text-sm text-muted-foreground">Plan Review for Claude Code</p>
            </div>
          </div>

          {/* Status card */}
          <div className="bg-card border border-border rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </div>
              <h2 className="text-base font-medium text-foreground">Waiting for Plan</h2>
            </div>
            <p className="text-muted-foreground text-sm">
              When Claude Code enters plan mode, Medusa will automatically open to let you review and annotate the plan.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Manual open */}
          <div className="space-y-3">
            <button
              onClick={handleOpenFile}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Open Markdown File
            </button>
            <p className="text-muted-foreground text-xs">
              Supports .md, .markdown, and .txt files
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background border-b border-border px-6 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <img
                  src="/medusa-logo.png"
                  alt="Medusa"
                  className="w-7 h-7 object-contain"
                />
                <h1 className="text-base font-semibold text-foreground">Medusa</h1>
              </div>

              {/* Divider */}
              <div className="h-5 w-px bg-border" />

              {/* Page title and source */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Plan Review</span>
                {source && (
                  <span className="px-2 py-0.5 text-xs text-muted-foreground bg-muted rounded truncate max-w-[180px]" title={source}>
                    {source.split('/').pop()}
                  </span>
                )}
              </div>

              {/* Hook mode indicator */}
              {isHookMode && (
                <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                  </span>
                  Claude Code
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleOpenFile}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                title="Open file"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
                </svg>
              </button>

              {/* Settings button */}
              <button
                onClick={() => navigate('/settings')}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Plan content */}
        <main className="flex-1 overflow-y-auto pb-24">
          <div className="flex justify-center py-8 px-4">
            <PlanViewer
              ref={viewerRef}
              blocks={blocks}
              markdown={markdown}
              annotations={annotations}
              onAddAnnotation={handleAddAnnotation}
              onSelectAnnotation={handleSelectAnnotation}
              onRemoveAnnotation={handleDeleteAnnotation}
              selectedAnnotationId={selectedAnnotationId}
            />
          </div>
        </main>
      </div>

      {/* Sidebar */}
      <AnnotationSidebar
        annotations={annotations}
        blocks={blocks}
        onSelect={handleSelectAnnotation}
        onDelete={handleDeleteAnnotation}
        selectedId={selectedAnnotationId}
      />

      {/* Decision bar */}
      <DecisionBar
        onApprove={handleApprove}
        onDeny={handleDeny}
        annotationCount={annotations.length}
        getFeedback={getFeedback}
      />
    </div>
  );
}
