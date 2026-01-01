import React, { useState, useEffect, useCallback } from 'react';

interface DecisionBarProps {
  onApprove: () => Promise<void>;
  onDeny: (feedback: string) => Promise<void>;
  annotationCount: number;
  getFeedback: () => string;
}

export const DecisionBar: React.FC<DecisionBarProps> = ({
  onApprove,
  onDeny,
  annotationCount,
  getFeedback
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<'approved' | 'denied' | null>(null);

  const handleApprove = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onApprove();
      setSubmitted('approved');
    } catch (error) {
      console.error('Failed to approve:', error);
      setIsSubmitting(false);
    }
  }, [onApprove, isSubmitting]);

  const handleDeny = useCallback(async () => {
    if (isSubmitting) return;
    const feedback = getFeedback();
    setIsSubmitting(true);
    try {
      await onDeny(feedback);
      setSubmitted('denied');
    } catch (error) {
      console.error('Failed to deny:', error);
      setIsSubmitting(false);
    }
  }, [onDeny, getFeedback, isSubmitting]);

  // Keyboard shortcuts: Cmd/Ctrl + Enter to approve, Cmd/Ctrl + Shift + Enter to request changes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          handleDeny();
        } else {
          handleApprove();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleApprove, handleDeny]);

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md px-8">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
            submitted === 'approved'
              ? 'bg-green-500/10 text-green-500'
              : 'bg-primary/10 text-primary'
          }`}>
            {submitted === 'approved' ? (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              {submitted === 'approved' ? 'Plan Approved' : 'Feedback Sent'}
            </h2>
            <p className="text-muted-foreground">
              {submitted === 'approved'
                ? 'Claude will proceed with the implementation.'
                : 'Claude will revise the plan based on your annotations.'}
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Return to your <span className="text-foreground font-medium">Claude Code terminal</span> to continue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border z-50">
      <div className="max-w-3xl mx-auto flex items-center gap-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {annotationCount > 0 ? (
            <span>{annotationCount} annotation{annotationCount !== 1 ? 's' : ''} to send as feedback</span>
          ) : (
            <span>Review the plan, then approve or request changes</span>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDeny}
            disabled={isSubmitting}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
              ${isSubmitting
                ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80'
              }
            `}
          >
            {isSubmitting ? 'Sending...' : (
              <>
                Request Changes
                <kbd className="hidden sm:inline-flex px-2 py-1 text-xs font-medium bg-background/80 text-muted-foreground rounded border border-border">
                  ⌘⇧↵
                </kbd>
              </>
            )}
          </button>

          <button
            onClick={handleApprove}
            disabled={isSubmitting}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
              ${isSubmitting
                ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground'
                : 'bg-green-600 text-white hover:bg-green-700'
              }
            `}
          >
            {isSubmitting ? 'Approving...' : (
              <>
                Approve Plan
                <kbd className="hidden sm:inline-flex px-2 py-1 text-xs font-medium bg-green-700/80 text-green-100 rounded border border-green-500/50">
                  ⌘↵
                </kbd>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
