'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShareablePlan,
  ShareableAnnotation,
  Block,
  Annotation,
  decompressPlan,
  generateShareUrl,
  mergeAnnotations,
  getRandomColor,
  AuthorIdentity,
} from '../../lib/share';
import { parseMarkdownToBlocks } from '../../lib/parser';
import { SharedPlanViewer, SharedViewerHandle } from '../../components/share/SharedPlanViewer';
import { SharedAnnotationSidebar } from '../../components/share/SharedAnnotationSidebar';
import { AuthorNameDialog } from '../../components/share/AuthorNameDialog';
import { BiArrowBack, BiShare, BiCheck, BiGroup, BiMessageDetail, BiX } from 'react-icons/bi';

const AUTHOR_STORAGE_KEY = 'medusa_author_identity';

export default function SharePage() {
  const router = useRouter();

  const [sharedPlan, setSharedPlan] = useState<ShareablePlan | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [localAnnotations, setLocalAnnotations] = useState<Annotation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [pendingAnnotation, setPendingAnnotation] = useState<Annotation | null>(null);
  const [identity, setIdentityState] = useState<AuthorIdentity | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const viewerRef = useRef<SharedViewerHandle>(null);

  // Load identity from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTHOR_STORAGE_KEY);
      if (stored) {
        setIdentityState(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load author identity:', e);
    }
    setIsLoaded(true);
  }, []);

  const setIdentity = (newIdentity: AuthorIdentity | null) => {
    setIdentityState(newIdentity);
    if (newIdentity) {
      localStorage.setItem(AUTHOR_STORAGE_KEY, JSON.stringify(newIdentity));
    } else {
      localStorage.removeItem(AUTHOR_STORAGE_KEY);
    }
  };

  // Decode plan from URL hash on mount
  useEffect(() => {
    if (!isLoaded) return;

    const hash = window.location.hash.slice(1);
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
  }, [isLoaded]);

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

  const allAnnotations: ShareableAnnotation[] = [
    ...(sharedPlan?.annotations || []),
    ...localAnnotations.map(ann => ({
      ...ann,
      authorName: identity?.name || 'You',
      authorColor: identity?.color,
    } as ShareableAnnotation)),
  ];

  const readOnlyIds = sharedPlan?.annotations.map(a => a.id) || [];

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#6B5B47] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#6B5B47]">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f3f1e8] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#6B5B47]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[#16110a] mb-2">Unable to Load Plan</h2>
          <p className="text-sm text-[#6B5B47] mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-[#6B5B47] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!sharedPlan) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#6B5B47] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#6B5B47]">Loading shared plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#faf9f7] flex flex-col lg:flex-row">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#faf9f7] border-b border-[#e5e2db] px-3 sm:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Left side */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                onClick={() => router.push('/')}
                className="p-1.5 sm:p-2 text-[#6B5B47] hover:text-[#16110a] hover:bg-[#f3f1e8] rounded-lg transition-colors shrink-0"
                title="Back to home"
              >
                <BiArrowBack className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 min-w-0">
                <img src="/medusa-logo.png" alt="Medusa" className="w-6 h-6 sm:w-7 sm:h-7 object-contain shrink-0" />
                <h1 className="text-sm sm:text-base font-semibold text-[#16110a] truncate">{sharedPlan.title}</h1>
              </div>

              {sharedPlan.sharedBy && (
                <span className="hidden sm:flex px-2 py-0.5 text-xs text-[#6B5B47] bg-[#f3f1e8] rounded items-center gap-1 shrink-0">
                  <BiGroup className="w-3 h-3" />
                  Shared by {sharedPlan.sharedBy}
                </span>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {identity ? (
                <button
                  onClick={() => setShowNameDialog(true)}
                  className="hidden sm:flex px-2 py-0.5 text-xs rounded items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer bg-[#f3f1e8] text-[#6B5B47] hover:text-[#16110a]"
                  title="Click to change your name"
                >
                  <span className="w-2 h-2 rounded-full bg-[#6B5B47]" />
                  {identity.name}
                </button>
              ) : (
                <button
                  onClick={() => setShowNameDialog(true)}
                  className="hidden sm:block px-2 py-1 text-xs text-[#6B5B47] hover:text-[#16110a] transition-colors"
                >
                  Set your name
                </button>
              )}

              <button
                onClick={handleGenerateShareUrl}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  copied
                    ? 'bg-green-500/10 text-green-600'
                    : 'bg-[#6B5B47] text-white hover:opacity-90'
                }`}
              >
                {copied ? (
                  <>
                    <BiCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">Link Copied!</span>
                    <span className="sm:hidden">Copied!</span>
                  </>
                ) : (
                  <>
                    <BiShare className="w-4 h-4" />
                    <span className="hidden sm:inline">{localAnnotations.length > 0 ? 'Copy Share Link' : 'Copy Share Link'}</span>
                    <span className="sm:hidden">Share</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mobile: Shared by info */}
          {sharedPlan.sharedBy && (
            <div className="sm:hidden mt-1.5 flex items-center gap-1 text-xs text-[#6B5B47]">
              <BiGroup className="w-3 h-3" />
              Shared by {sharedPlan.sharedBy}
            </div>
          )}
        </header>

        {/* Plan content */}
        <main className="flex-1 overflow-y-auto">
          <div className="flex justify-center py-4 sm:py-8 px-3 sm:px-4">
            <SharedPlanViewer
              ref={viewerRef}
              blocks={blocks}
              markdown={sharedPlan.content}
              annotations={allAnnotations}
              onAddAnnotation={handleAddAnnotation}
              onSelectAnnotation={(id) => {
                setSelectedAnnotationId(id);
                // On mobile, show sidebar when annotation is selected
                if (id && window.innerWidth < 1024) {
                  setShowMobileSidebar(true);
                }
              }}
              selectedAnnotationId={selectedAnnotationId}
              readOnlyAnnotationIds={readOnlyIds}
            />
          </div>
        </main>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <SharedAnnotationSidebar
          annotations={allAnnotations}
          blocks={blocks}
          onSelect={setSelectedAnnotationId}
          selectedId={selectedAnnotationId}
          currentAuthor={identity?.name}
          onDeleteLocal={handleDeleteLocalAnnotation}
        />
      </div>

      {/* Mobile Floating Button */}
      <button
        onClick={() => setShowMobileSidebar(true)}
        className="lg:hidden fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-[#6B5B47] text-white rounded-full shadow-lg hover:opacity-90 transition-opacity"
      >
        <BiMessageDetail className="w-5 h-5" />
        {allAnnotations.length > 0 && (
          <span className="text-sm font-medium">{allAnnotations.length}</span>
        )}
      </button>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowMobileSidebar(false)}
          />

          {/* Bottom Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] flex flex-col animate-slideUp">
            {/* Handle */}
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 bg-[#e5e2db] rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-2 border-b border-[#e5e2db]">
              <div>
                <h2 className="font-medium text-[#16110a]">Annotations</h2>
                <p className="text-xs text-[#6B5B47]">{allAnnotations.length} total</p>
              </div>
              <div className="flex items-center gap-2">
                {identity ? (
                  <button
                    onClick={() => setShowNameDialog(true)}
                    className="px-2 py-0.5 text-xs rounded flex items-center gap-1.5 bg-[#f3f1e8] text-[#6B5B47]"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#6B5B47]" />
                    {identity.name}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowNameDialog(true)}
                    className="px-2 py-1 text-xs text-[#6B5B47] bg-[#f3f1e8] rounded"
                  >
                    Set name
                  </button>
                )}
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="p-2 text-[#6B5B47] hover:text-[#16110a] transition-colors"
                >
                  <BiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <SharedAnnotationSidebar
                annotations={allAnnotations}
                blocks={blocks}
                onSelect={(id) => {
                  setSelectedAnnotationId(id);
                  setShowMobileSidebar(false);
                }}
                selectedId={selectedAnnotationId}
                currentAuthor={identity?.name}
                onDeleteLocal={handleDeleteLocalAnnotation}
                isMobile
              />
            </div>
          </div>
        </div>
      )}

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

      {/* Slide up animation */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
