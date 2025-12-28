import { useMemo, Fragment } from 'react';
import { CodeBlock } from './CodeBlock';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

interface ParsedBlock {
  type: 'text' | 'code';
  content: string;
  language?: string;
  filename?: string;
}

// Parse markdown content into blocks
const parseMarkdown = (content: string): ParsedBlock[] => {
  const blocks: ParsedBlock[] = [];

  // Regex to match fenced code blocks with optional language and filename
  // Matches: ```language filename.ext or ```language or ```
  const codeBlockRegex = /```(\w+)?(?:\s+([^\n]+))?\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before this code block
    if (match.index > lastIndex) {
      const textContent = content.slice(lastIndex, match.index);
      if (textContent.trim()) {
        blocks.push({ type: 'text', content: textContent });
      }
    }

    // Add the code block
    blocks.push({
      type: 'code',
      language: match[1] || 'text',
      filename: match[2] || undefined,
      content: match[3].trim()
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last code block
  if (lastIndex < content.length) {
    const textContent = content.slice(lastIndex);
    if (textContent.trim()) {
      blocks.push({ type: 'text', content: textContent });
    }
  }

  // If no code blocks found, return entire content as text
  if (blocks.length === 0 && content.trim()) {
    blocks.push({ type: 'text', content });
  }

  return blocks;
};

// Render inline markdown elements
const renderInlineMarkdown = (text: string): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  let key = 0;

  // Process the text in one pass
  let remaining = text;

  while (remaining.length > 0) {
    // Check for inline code
    const inlineCodeMatch = remaining.match(/^`([^`]+)`/);
    if (inlineCodeMatch) {
      elements.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 bg-zinc-800 text-zinc-200 rounded text-sm font-mono"
        >
          {inlineCodeMatch[1]}
        </code>
      );
      remaining = remaining.slice(inlineCodeMatch[0].length);
      continue;
    }

    // Check for bold
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      elements.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Check for italic
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      elements.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Check for links
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      elements.push(
        <a
          key={key++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Find the next special character or end of string
    const nextSpecial = remaining.search(/[`*\[]/);
    if (nextSpecial === -1) {
      // No more special characters, add the rest as plain text
      elements.push(<Fragment key={key++}>{remaining}</Fragment>);
      break;
    } else if (nextSpecial === 0) {
      // Special character at start but didn't match any pattern, treat as plain text
      elements.push(<Fragment key={key++}>{remaining[0]}</Fragment>);
      remaining = remaining.slice(1);
    } else {
      // Add text before the special character
      elements.push(<Fragment key={key++}>{remaining.slice(0, nextSpecial)}</Fragment>);
      remaining = remaining.slice(nextSpecial);
    }
  }

  return elements;
};

// Render a text block with inline formatting
const TextBlock = ({ content }: { content: string }) => {
  const lines = content.split('\n');

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        // Check for headers
        const h1Match = line.match(/^# (.+)$/);
        if (h1Match) {
          return <h1 key={index} className="text-xl font-bold text-zinc-100">{h1Match[1]}</h1>;
        }

        const h2Match = line.match(/^## (.+)$/);
        if (h2Match) {
          return <h2 key={index} className="text-lg font-bold text-zinc-100">{h2Match[1]}</h2>;
        }

        const h3Match = line.match(/^### (.+)$/);
        if (h3Match) {
          return <h3 key={index} className="text-base font-bold text-zinc-100">{h3Match[1]}</h3>;
        }

        // Check for bullet points
        const bulletMatch = line.match(/^[-*] (.+)$/);
        if (bulletMatch) {
          return (
            <div key={index} className="flex gap-2">
              <span className="text-zinc-500">•</span>
              <span>{renderInlineMarkdown(bulletMatch[1])}</span>
            </div>
          );
        }

        // Check for numbered lists
        const numberedMatch = line.match(/^(\d+)\. (.+)$/);
        if (numberedMatch) {
          return (
            <div key={index} className="flex gap-2">
              <span className="text-zinc-500 min-w-[1.5em]">{numberedMatch[1]}.</span>
              <span>{renderInlineMarkdown(numberedMatch[2])}</span>
            </div>
          );
        }

        // Empty line
        if (!line.trim()) {
          return <div key={index} className="h-2" />;
        }

        // Regular paragraph
        return (
          <p key={index}>
            {renderInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
};

export const MarkdownRenderer = ({ content, className }: MarkdownRendererProps) => {
  const blocks = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div className={cn('space-y-4', className)}>
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          return (
            <CodeBlock
              key={index}
              code={block.content}
              language={block.language}
              filename={block.filename}
            />
          );
        }

        return (
          <TextBlock key={index} content={block.content} />
        );
      })}
    </div>
  );
};
