import { useState, useEffect, useCallback } from 'react';
import { codeToHtml } from 'shiki';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export const CodeBlock = ({
  code,
  language = 'text',
  filename,
  showLineNumbers = false,
  className,
}: CodeBlockProps) => {
  const [html, setHtml] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const highlight = async () => {
      try {
        // Map common language aliases
        const langMap: Record<string, string> = {
          'js': 'javascript',
          'ts': 'typescript',
          'jsx': 'jsx',
          'tsx': 'tsx',
          'py': 'python',
          'rb': 'ruby',
          'sh': 'bash',
          'shell': 'bash',
          'yml': 'yaml',
          'md': 'markdown',
          'rs': 'rust',
          'go': 'go',
          'json': 'json',
          'html': 'html',
          'css': 'css',
          'sql': 'sql',
          'dockerfile': 'dockerfile',
          'diff': 'diff',
        };

        const normalizedLang = langMap[language.toLowerCase()] || language.toLowerCase();

        const result = await codeToHtml(code, {
          lang: normalizedLang,
          theme: 'github-dark',
        });
        setHtml(result);
      } catch (error) {
        // Fallback to plain text if language not supported
        const escaped = code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        setHtml(`<pre class="shiki"><code>${escaped}</code></pre>`);
      } finally {
        setIsLoading(false);
      }
    };

    highlight();
  }, [code, language]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [code]);

  return (
    <div className={cn('relative group rounded-lg overflow-hidden', className)}>
      {/* Header with language and filename */}
      {(language !== 'text' || filename) && (
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
          <div className="flex items-center gap-2">
            {filename && (
              <span className="text-xs text-zinc-300 font-mono">{filename}</span>
            )}
            {!filename && language !== 'text' && (
              <span className="text-xs text-zinc-400 font-mono">{language}</span>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Code content */}
      <div className="relative">
        {isLoading ? (
          <div className="p-4 bg-zinc-900 animate-pulse">
            <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
            <div className="h-4 bg-zinc-800 rounded w-1/2" />
          </div>
        ) : (
          <div
            className={cn(
              'overflow-x-auto text-sm',
              '[&_pre]:!bg-zinc-900 [&_pre]:!m-0 [&_pre]:!p-4',
              '[&_code]:!bg-transparent [&_code]:font-mono',
              showLineNumbers && '[&_pre]:pl-12'
            )}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}

        {/* Copy button (fallback if no header) */}
        {language === 'text' && !filename && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
};
