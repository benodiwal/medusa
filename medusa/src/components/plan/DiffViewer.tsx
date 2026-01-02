import { useMemo } from 'react';
import * as Diff from 'diff';

interface DiffViewerProps {
  oldContent: string;
  newContent: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ oldContent, newContent }) => {
  const diffResult = useMemo(() => {
    return Diff.diffLines(oldContent, newContent);
  }, [oldContent, newContent]);

  // Calculate stats
  const stats = useMemo(() => {
    let additions = 0;
    let deletions = 0;
    diffResult.forEach(part => {
      if (part.added) {
        additions += part.count || 0;
      } else if (part.removed) {
        deletions += part.count || 0;
      }
    });
    return { additions, deletions };
  }, [diffResult]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Stats header */}
      <div className="flex items-center gap-4 mb-4 px-4 py-2 bg-muted/50 rounded-lg">
        <span className="text-sm text-muted-foreground">Changes:</span>
        <span className="text-sm font-medium text-green-600">+{stats.additions} additions</span>
        <span className="text-sm font-medium text-red-500">-{stats.deletions} deletions</span>
      </div>

      {/* Diff content */}
      <div className="border border-border rounded-lg overflow-hidden font-mono text-sm">
        {diffResult.map((part, index) => {
          const lines = part.value.split('\n');
          // Remove last empty line from split
          if (lines[lines.length - 1] === '') {
            lines.pop();
          }

          return lines.map((line, lineIndex) => {
            const key = `${index}-${lineIndex}`;

            if (part.added) {
              return (
                <div
                  key={key}
                  className="flex bg-green-500/10 border-l-4 border-green-500"
                >
                  <span className="w-12 flex-shrink-0 px-2 py-0.5 text-right text-muted-foreground bg-green-500/5 select-none">
                    +
                  </span>
                  <span className="flex-1 px-3 py-0.5 text-green-700 dark:text-green-400 whitespace-pre-wrap break-all">
                    {line || ' '}
                  </span>
                </div>
              );
            }

            if (part.removed) {
              return (
                <div
                  key={key}
                  className="flex bg-red-500/10 border-l-4 border-red-500"
                >
                  <span className="w-12 flex-shrink-0 px-2 py-0.5 text-right text-muted-foreground bg-red-500/5 select-none">
                    -
                  </span>
                  <span className="flex-1 px-3 py-0.5 text-red-700 dark:text-red-400 whitespace-pre-wrap break-all line-through opacity-70">
                    {line || ' '}
                  </span>
                </div>
              );
            }

            // Unchanged
            return (
              <div
                key={key}
                className="flex"
              >
                <span className="w-12 flex-shrink-0 px-2 py-0.5 text-right text-muted-foreground/50 bg-muted/30 select-none">

                </span>
                <span className="flex-1 px-3 py-0.5 text-muted-foreground whitespace-pre-wrap break-all">
                  {line || ' '}
                </span>
              </div>
            );
          });
        })}
      </div>
    </div>
  );
};
