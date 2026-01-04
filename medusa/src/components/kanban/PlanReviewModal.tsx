import { useState, useRef, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { X, BookMarked, Check, GitCompare, FileText } from 'lucide-react';
import { PlanItem, Block, Annotation, ObsidianVault } from '../../types';
import { PlanViewer, ViewerHandle, AnnotationSidebar, DecisionBar, DiffViewer } from '../plan';
import { ShareButton, AuthorNameDialog } from '../share';
import { parseMarkdownToBlocks, exportFeedback } from '../../utils/parser';
import { useAuthor, getRandomColor } from '../../contexts/AuthorContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PlanReviewModalProps {
  plan: PlanItem;
  onClose: () => void;
  onComplete: () => void;
}

export function PlanReviewModal({ plan, onClose, onComplete }: PlanReviewModalProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [obsidianVaults, setObsidianVaults] = useState<ObsidianVault[]>([]);
  const [savedToObsidian, setSavedToObsidian] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const viewerRef = useRef<ViewerHandle>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { identity, setIdentity } = useAuthor();

  const hasPreviousContent = !!plan.previous_content;

  // Show name dialog on first open if no identity set
  useEffect(() => {
    if (!identity) {
      setShowNameDialog(true);
    }
  }, []);

  useEffect(() => {
    setBlocks(parseMarkdownToBlocks(plan.content));
  }, [plan.content]);

  // Load persisted annotations when modal opens
  useEffect(() => {
    if (plan.annotations && plan.annotations.length > 0) {
      setAnnotations(plan.annotations);
    }
  }, [plan.id, plan.annotations]);

  // Keep a ref to latest annotations for cleanup
  const annotationsRef = useRef<Annotation[]>(annotations);
  annotationsRef.current = annotations;

  // Save annotations to backend
  const saveAnnotationsToBackend = useCallback(async (anns: Annotation[]) => {
    try {
      await invoke('save_annotations', { id: plan.id, annotations: anns });
    } catch (error) {
      console.error('Failed to save annotations:', error);
    }
  }, [plan.id]);

  // Debounced save when annotations change
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveAnnotationsToBackend(annotations);
    }, 500); // Save 500ms after last change

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [annotations, saveAnnotationsToBackend]);

  // Save immediately when modal unmounts to prevent data loss
  useEffect(() => {
    return () => {
      invoke('save_annotations', { id: plan.id, annotations: annotationsRef.current });
    };
  }, [plan.id]);

  // Load Obsidian vaults
  useEffect(() => {
    const loadVaults = async () => {
      try {
        const vaults = await invoke<ObsidianVault[]>('get_obsidian_vaults');
        setObsidianVaults(vaults);
      } catch (error) {
        console.error('Failed to load Obsidian vaults:', error);
      }
    };
    loadVaults();
  }, []);

  const handleSaveToObsidian = async (vault: ObsidianVault) => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];

      // Extract title from plan content (first heading or first line)
      const lines = plan.content.split('\n').filter(l => l.trim());
      let title = 'untitled';
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#')) {
          // Extract heading text, remove # symbols
          title = trimmed.replace(/^#+\s*/, '').trim();
          break;
        } else if (trimmed.length > 0) {
          // Use first non-empty line
          title = trimmed;
          break;
        }
      }

      // Sanitize title for filename (remove special chars, limit length)
      const sanitizedTitle = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50);

      const filename = `medusa-${sanitizedTitle}-${timestamp}.md`;
      await invoke('save_to_obsidian', {
        vaultPath: vault.path,
        filename,
        content: plan.content,
      });
      setSavedToObsidian(true);
      setTimeout(() => setSavedToObsidian(false), 2000);

      // Open the file in Obsidian
      await invoke('open_in_obsidian', {
        vaultName: vault.name,
        filename,
      });
    } catch (error) {
      console.error('Failed to save to Obsidian:', error);
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
      const feedbackText = annotations.length > 0 ? exportFeedback(blocks, annotations) : undefined;

      await invoke('approve_plan', {
        request: {
          id: plan.id,
          feedback: feedbackText,
        }
      });

      // Save to local history
      await invoke('add_to_history', {
        id: plan.id,
        content: plan.content,
        projectName: plan.project_name,
        source: plan.source,
        status: 'approved',
        feedback: feedbackText,
        annotations: annotations.length > 0 ? annotations : null,
        createdAt: plan.created_at,
      });

      onComplete();
      onClose();
    } catch (error) {
      console.error('Failed to approve:', error);
      throw error;
    }
  };

  const handleDeny = async (feedback: string) => {
    try {
      const feedbackText = feedback || 'Changes requested';

      await invoke('deny_plan', {
        request: {
          id: plan.id,
          feedback: feedbackText,
        }
      });

      // Save to local history as rejected
      await invoke('add_to_history', {
        id: plan.id,
        content: plan.content,
        projectName: plan.project_name,
        source: plan.source,
        status: 'rejected',
        feedback: feedbackText,
        annotations: annotations.length > 0 ? annotations : null,
        createdAt: plan.created_at,
      });

      onComplete();
      onClose();
    } catch (error) {
      console.error('Failed to deny:', error);
      throw error;
    }
  };

  const getFeedback = useCallback(() => {
    return exportFeedback(blocks, annotations);
  }, [blocks, annotations]);

  const handleSetAuthorName = (name: string) => {
    const newIdentity = { name, color: identity?.color || getRandomColor() };
    setIdentity(newIdentity);
    setShowNameDialog(false);
  };

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex">
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background border-b border-border px-6 py-3">
          <div className="flex items-center justify-between">
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

              {/* Project name and source */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{plan.project_name}</span>
                {plan.source && (
                  <span className="px-2 py-0.5 text-xs text-muted-foreground bg-muted rounded truncate max-w-[180px]" title={plan.source}>
                    {plan.source.split('/').pop()}
                  </span>
                )}
              </div>

              {/* Hook mode indicator */}
              {plan.response_file && (
                <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                  </span>
                  Claude Code
                </span>
              )}

              {/* Author identity badge */}
              {identity && (
                <>
                  <div className="h-5 w-px bg-border" />
                  <button
                    onClick={() => setShowNameDialog(true)}
                    className="px-2 py-0.5 text-xs rounded flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer bg-muted text-muted-foreground hover:text-foreground"
                    title="Click to change your name"
                  >
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {identity.name}
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Diff View Toggle */}
              {hasPreviousContent && (
                <button
                  onClick={() => setShowDiff(!showDiff)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    showDiff
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  title={showDiff ? 'Show current plan' : 'Show changes from previous version'}
                >
                  {showDiff ? (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Plan</span>
                    </>
                  ) : (
                    <>
                      <GitCompare className="w-4 h-4" />
                      <span>Diff</span>
                    </>
                  )}
                </button>
              )}

              {/* Obsidian Save Button */}
              {obsidianVaults.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`p-2 rounded-lg transition-colors ${
                        savedToObsidian
                          ? 'text-green-500 bg-green-500/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      title="Save to Obsidian"
                    >
                      {savedToObsidian ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <BookMarked className="w-5 h-5" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                    {obsidianVaults.map((vault) => (
                      <DropdownMenuItem
                        key={vault.path}
                        onClick={() => handleSaveToObsidian(vault)}
                        className="cursor-pointer text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground"
                      >
                        {vault.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Share Button */}
              <ShareButton
                content={plan.content}
                title={plan.project_name}
                annotations={annotations}
              />

              <button
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Plan content */}
        <main className="flex-1 overflow-y-auto pb-24">
          <div className="flex justify-center py-8 px-4">
            {showDiff && plan.previous_content ? (
              <DiffViewer
                oldContent={plan.previous_content}
                newContent={plan.content}
              />
            ) : (
              <PlanViewer
                ref={viewerRef}
                blocks={blocks}
                markdown={plan.content}
                annotations={annotations}
                onAddAnnotation={handleAddAnnotation}
                onSelectAnnotation={handleSelectAnnotation}
                onRemoveAnnotation={handleDeleteAnnotation}
                selectedAnnotationId={selectedAnnotationId}
              />
            )}
          </div>
        </main>
      </div>

      {/* Sidebar - hide when showing diff */}
      {!showDiff && (
        <AnnotationSidebar
          annotations={annotations}
          blocks={blocks}
          onSelect={handleSelectAnnotation}
          onDelete={handleDeleteAnnotation}
          selectedId={selectedAnnotationId}
        />
      )}

      {/* Decision bar */}
      <DecisionBar
        onApprove={handleApprove}
        onDeny={handleDeny}
        annotationCount={annotations.length}
        getFeedback={getFeedback}
      />

      {/* Author name dialog */}
      <AuthorNameDialog
        open={showNameDialog}
        onClose={() => setShowNameDialog(false)}
        onSubmit={handleSetAuthorName}
        currentName={identity?.name}
      />
    </div>
  );
}
