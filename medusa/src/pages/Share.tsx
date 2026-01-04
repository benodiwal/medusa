import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Share2, Check, Users } from 'lucide-react';
import { ShareablePlan, ShareableAnnotation, Block, Annotation } from '../types';
import { decompressPlan, generateShareUrl, mergeAnnotations } from '../utils/shareCompression';
import { parseMarkdownToBlocks } from '../utils/parser';
import { SharedPlanViewer, SharedViewerHandle } from '../components/share/SharedPlanViewer';
import { SharedAnnotationSidebar } from '../components/share/SharedAnnotationSidebar';
import { AuthorNameDialog } from '../components/share/AuthorNameDialog';
import { useAuthor, getRandomColor } from '../contexts/AuthorContext';

export default function Share() {
  const navigate = useNavigate();
  const location = useLocation();
  const { identity, setIdentity } = useAuthor();

  const [sharedPlan, setSharedPlan] = useState<ShareablePlan | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [localAnnotations, setLocalAnnotations] = useState<Annotation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [pendingAnnotation, setPendingAnnotation] = useState<Annotation | null>(null);

  const viewerRef = useRef<SharedViewerHandle>(null);

  // Decode plan from URL hash on mount
  useEffect(() => {
    const hash = location.hash.slice(1); // Remove the '#'
    if (!hash) {
      setError('No plan data found in URL');
      return;
    }

    const plan = decompressPlan(hash);
    if (!plan) {
      setError('Failed to decode plan data. The link may be corrupted.');
      return;
    }

    setSharedPlan(plan);
    setBlocks(parseMarkdownToBlocks(plan.content));
  }, [location.hash]);

  // Handle adding annotation - prompt for name if needed
  const handleAddAnnotation = useCallback((ann: Annotation) => {
    if (!identity) {
      setPendingAnnotation(ann);
      setShowNameDialog(true);
      return;
    }

    const annotationWithAuthor: Annotation = {
      ...ann,
      author: identity.name,
    };
    setLocalAnnotations(prev => [...prev, annotationWithAuthor]);
  }, [identity]);

  const handleSetAuthorName = (name: string) => {
    const newIdentity = { name, color: getRandomColor() };
    setIdentity(newIdentity);
    setShowNameDialog(false);

    // If there was a pending annotation, add it now
    if (pendingAnnotation) {
      const annotationWithAuthor: Annotation = {
        ...pendingAnnotation,
        author: name,
      };
      setLocalAnnotations(prev => [...prev, annotationWithAuthor]);
      setPendingAnnotation(null);
    }
  };

  const handleGenerateShareUrl = () => {
    if (!sharedPlan) return;

    if (!identity && localAnnotations.length > 0) {
      setShowNameDialog(true);
      return;
    }

    // Merge existing annotations with new local ones
    const mergedAnnotations = mergeAnnotations(
      sharedPlan.annotations,
      localAnnotations,
      identity?.name || 'Anonymous',
      identity?.color || getRandomColor()
    );

    const updatedPlan: ShareablePlan = {
      ...sharedPlan,
      annotations: mergedAnnotations,
      version: sharedPlan.version + 1,
      sharedBy: identity?.name || sharedPlan.sharedBy,
      sharedAt: Date.now(),
    };

    const url = generateShareUrl(updatedPlan);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteLocalAnnotation = (id: string) => {
    setLocalAnnotations(prev => prev.filter(a => a.id !== id));
    viewerRef.current?.removeHighlight(id);
  };

  // Combine shared annotations with local ones for display
  const allAnnotations: ShareableAnnotation[] = [
    ...(sharedPlan?.annotations || []),
    ...localAnnotations.map(ann => ({
      ...ann,
      authorName: identity?.name || 'You',
      authorColor: identity?.color,
    } as ShareableAnnotation)),
  ];

  // IDs of annotations that are read-only (from the shared plan)
  const readOnlyIds = sharedPlan?.annotations.map(a => a.id) || [];

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Unable to Load Plan</h2>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!sharedPlan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading shared plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex">
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background border-b border-border px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                title="Back to home"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <img src="/medusa-logo.png" alt="Medusa" className="w-7 h-7 object-contain" />
                <h1 className="text-base font-semibold text-foreground">{sharedPlan.title}</h1>
              </div>

              {/* Shared by indicator */}
              {sharedPlan.sharedBy && (
                <span className="px-2 py-0.5 text-xs text-muted-foreground bg-muted rounded flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Shared by {sharedPlan.sharedBy}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Your identity */}
              {identity ? (
                <button
                  onClick={() => setShowNameDialog(true)}
                  className="px-2 py-0.5 text-xs rounded flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ backgroundColor: `${identity.color}20`, color: identity.color }}
                  title="Click to change your name"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: identity.color }} />
                  {identity.name}
                </button>
              ) : (
                <button
                  onClick={() => setShowNameDialog(true)}
                  className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Set your name
                </button>
              )}

              {/* Share button */}
              <button
                onClick={handleGenerateShareUrl}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  copied
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-primary text-primary-foreground hover:opacity-90'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    {localAnnotations.length > 0 ? 'Share with Your Annotations' : 'Copy Share Link'}
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Plan content */}
        <main className="flex-1 overflow-y-auto">
          <div className="flex justify-center py-8 px-4">
            <SharedPlanViewer
              ref={viewerRef}
              blocks={blocks}
              markdown={sharedPlan.content}
              annotations={allAnnotations}
              onAddAnnotation={handleAddAnnotation}
              onSelectAnnotation={setSelectedAnnotationId}
              selectedAnnotationId={selectedAnnotationId}
              readOnlyAnnotationIds={readOnlyIds}
            />
          </div>
        </main>
      </div>

      {/* Sidebar with author attribution */}
      <SharedAnnotationSidebar
        annotations={allAnnotations}
        blocks={blocks}
        onSelect={setSelectedAnnotationId}
        selectedId={selectedAnnotationId}
        currentAuthor={identity?.name}
        onDeleteLocal={handleDeleteLocalAnnotation}
      />

      {/* Author name dialog */}
      <AuthorNameDialog
        open={showNameDialog}
        onClose={() => {
          setShowNameDialog(false);
          setPendingAnnotation(null);
        }}
        onSubmit={handleSetAuthorName}
        currentName={identity?.name}
      />
    </div>
  );
}
