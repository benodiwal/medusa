import React from 'react';

interface SimpleMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Simple markdown renderer for basic formatting:
 * - Headers (#, ##, ###)
 * - Code blocks (```)
 * - Inline code (`)
 * - Bold (**text**)
 * - Blockquotes (>)
 * - Horizontal rules (---)
 */
export function SimpleMarkdown({ content, className = '' }: SimpleMarkdownProps) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code blocks
    if (trimmed.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={key++} className="bg-muted/50 border border-border/30 rounded-lg p-3 my-2 overflow-x-auto">
          <code className="text-xs font-mono text-foreground/80">{codeLines.join('\n')}</code>
        </pre>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***') {
      elements.push(<hr key={key++} className="border-border/30 my-4" />);
      i++;
      continue;
    }

    // Headers
    if (trimmed.startsWith('#')) {
      const level = trimmed.match(/^#+/)?.[0].length || 1;
      const text = trimmed.replace(/^#+\s*/, '');
      const headerClasses: Record<number, string> = {
        1: 'text-base font-semibold mb-2 mt-3',
        2: 'text-sm font-semibold mb-1.5 mt-2',
        3: 'text-sm font-medium mb-1 mt-2',
      };
      elements.push(
        <div key={key++} className={headerClasses[level] || headerClasses[3]}>
          <InlineFormat text={text} />
        </div>
      );
      i++;
      continue;
    }

    // Blockquotes
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed.replace(/^>\s*/, '');
      elements.push(
        <blockquote key={key++} className="border-l-2 border-primary/50 pl-3 my-2 text-muted-foreground italic text-sm">
          <InlineFormat text={quoteText} />
        </blockquote>
      );
      i++;
      continue;
    }

    // Empty lines
    if (trimmed === '') {
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={key++} className="text-sm text-foreground/90 my-1">
        <InlineFormat text={trimmed} />
      </p>
    );
    i++;
  }

  return <div className={className}>{elements}</div>;
}

function InlineFormat({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let partKey = 0;

  while (remaining.length > 0) {
    // Bold
    let match = remaining.match(/^\*\*(.+?)\*\*/);
    if (match) {
      parts.push(<strong key={partKey++} className="font-semibold">{match[1]}</strong>);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Inline code
    match = remaining.match(/^`([^`]+)`/);
    if (match) {
      parts.push(
        <code key={partKey++} className="px-1 py-0.5 rounded bg-muted text-xs font-mono">
          {match[1]}
        </code>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Find next special character
    const nextSpecial = remaining.slice(1).search(/[\*`]/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else {
      parts.push(remaining.slice(0, nextSpecial + 1));
      remaining = remaining.slice(nextSpecial + 1);
    }
  }

  return <>{parts}</>;
}
