import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { Annotation } from '../../types';
import { createShareablePlan, generateShareUrl, isUrlLengthSafe } from '../../utils/shareCompression';
import { AuthorNameDialog } from './AuthorNameDialog';
import { useAuthor, getRandomColor } from '../../contexts/AuthorContext';

interface ShareButtonProps {
  content: string;
  title: string;
  annotations: Annotation[];
}

export function ShareButton({ content, title, annotations }: ShareButtonProps) {
  const { identity, setIdentity } = useAuthor();
  const [copied, setCopied] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const handleShare = () => {
    // If there are annotations and no identity, prompt for name
    if (!identity && annotations.length > 0) {
      setShowNameDialog(true);
      return;
    }

    generateAndCopyUrl(identity?.name, identity?.color);
  };

  const generateAndCopyUrl = (authorName?: string, authorColor?: string) => {
    const plan = createShareablePlan(
      content,
      title,
      annotations,
      authorName,
      authorColor
    );

    // Check URL length
    if (!isUrlLengthSafe(plan)) {
      setWarning('Plan is large - URL may not work in all browsers');
      setTimeout(() => setWarning(null), 3000);
    }

    const url = generateShareUrl(plan);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSetName = (name: string) => {
    const color = getRandomColor();
    setIdentity({ name, color });
    setShowNameDialog(false);
    generateAndCopyUrl(name, color);
  };

  return (
    <>
      <button
        onClick={handleShare}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          copied
            ? 'text-green-500 bg-green-500/10'
            : warning
            ? 'text-amber-500 bg-amber-500/10'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
        title={warning || (copied ? 'Link copied!' : 'Share plan with annotations')}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </>
        )}
      </button>

      <AuthorNameDialog
        open={showNameDialog}
        onClose={() => setShowNameDialog(false)}
        onSubmit={handleSetName}
      />
    </>
  );
}
