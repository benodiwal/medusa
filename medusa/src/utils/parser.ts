import { Block } from '../types';

/**
 * Parse markdown content into structured blocks for annotation.
 * Each block represents a semantic unit (heading, paragraph, list item, etc.)
 */
export const parseMarkdownToBlocks = (markdown: string): Block[] => {
  const lines = markdown.split('\n');
  const blocks: Block[] = [];
  let currentId = 0;

  let buffer: string[] = [];
  let currentType: Block['type'] = 'paragraph';
  let currentLevel = 0;
  let bufferStartLine = 1;

  const flush = () => {
    if (buffer.length > 0) {
      const content = buffer.join('\n');
      blocks.push({
        id: `block-${currentId++}`,
        type: currentType,
        content: content,
        level: currentLevel,
        order: currentId,
        startLine: bufferStartLine
      });
      buffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const currentLineNum = i + 1;

    // Headings
    if (trimmed.startsWith('#')) {
      flush();
      const level = trimmed.match(/^#+/)?.[0].length || 1;
      blocks.push({
        id: `block-${currentId++}`,
        type: 'heading',
        content: trimmed.replace(/^#+\s*/, ''),
        level,
        order: currentId,
        startLine: currentLineNum
      });
      continue;
    }

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***') {
      flush();
      blocks.push({
        id: `block-${currentId++}`,
        type: 'hr',
        content: '',
        order: currentId,
        startLine: currentLineNum
      });
      continue;
    }

    // List Items
    if (trimmed.match(/^(\*|-|\d+\.)\s/)) {
      flush();
      const leadingWhitespace = line.match(/^(\s*)/)?.[1] || '';
      const spaceCount = leadingWhitespace.replace(/\t/g, '  ').length;
      const listLevel = Math.floor(spaceCount / 2);

      let content = trimmed.replace(/^(\*|-|\d+\.)\s/, '');

      // Check for checkbox syntax
      let checked: boolean | undefined = undefined;
      const checkboxMatch = content.match(/^\[([ xX])\]\s*/);
      if (checkboxMatch) {
        checked = checkboxMatch[1].toLowerCase() === 'x';
        content = content.replace(/^\[([ xX])\]\s*/, '');
      }

      blocks.push({
        id: `block-${currentId++}`,
        type: 'list-item',
        content,
        level: listLevel,
        checked,
        order: currentId,
        startLine: currentLineNum
      });
      continue;
    }

    // Blockquotes
    if (trimmed.startsWith('>')) {
      flush();
      blocks.push({
        id: `block-${currentId++}`,
        type: 'blockquote',
        content: trimmed.replace(/^>\s*/, ''),
        order: currentId,
        startLine: currentLineNum
      });
      continue;
    }

    // Code blocks
    if (trimmed.startsWith('```')) {
      flush();
      const codeStartLine = currentLineNum;
      const language = trimmed.slice(3).trim() || undefined;
      const codeContent: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeContent.push(lines[i]);
        i++;
      }
      blocks.push({
        id: `block-${currentId++}`,
        type: 'code',
        content: codeContent.join('\n'),
        language,
        order: currentId,
        startLine: codeStartLine
      });
      continue;
    }

    // Tables
    if (trimmed.startsWith('|') || (trimmed.includes('|') && trimmed.match(/^\|?.+\|.+\|?$/))) {
      flush();
      const tableStartLine = currentLineNum;
      const tableLines: string[] = [line];

      while (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.startsWith('|') || (nextLine.includes('|') && nextLine.match(/^\|?.+\|.+\|?$/))) {
          i++;
          tableLines.push(lines[i]);
        } else {
          break;
        }
      }

      blocks.push({
        id: `block-${currentId++}`,
        type: 'table',
        content: tableLines.join('\n'),
        order: currentId,
        startLine: tableStartLine
      });
      continue;
    }

    // Empty lines separate paragraphs
    if (trimmed === '') {
      flush();
      currentType = 'paragraph';
      continue;
    }

    // Accumulate paragraph text
    if (buffer.length === 0) {
      bufferStartLine = currentLineNum;
    }
    buffer.push(line);
  }

  flush();
  return blocks;
};

/**
 * Export annotations as structured feedback for Claude Code
 */
export const exportFeedback = (blocks: Block[], annotations: import('../types').Annotation[]): string => {
  if (annotations.length === 0) {
    return 'No changes requested.';
  }

  const sortedAnns = [...annotations].sort((a, b) => {
    const blockA = blocks.findIndex(blk => blk.id === a.blockId);
    const blockB = blocks.findIndex(blk => blk.id === b.blockId);
    if (blockA !== blockB) return blockA - blockB;
    return a.startOffset - b.startOffset;
  });

  let output = `# Plan Feedback\n\n`;
  output += `I've reviewed this plan and have ${annotations.length} piece${annotations.length > 1 ? 's' : ''} of feedback:\n\n`;

  sortedAnns.forEach((ann, index) => {
    output += `## ${index + 1}. `;

    switch (ann.type) {
      case 'DELETION':
        output += `Remove this\n`;
        output += `\`\`\`\n${ann.originalText}\n\`\`\`\n`;
        output += `> I don't want this in the plan.\n`;
        break;

      case 'INSERTION':
        output += `Add this\n`;
        output += `\`\`\`\n${ann.text}\n\`\`\`\n`;
        break;

      case 'REPLACEMENT':
        output += `Change this\n`;
        output += `**From:**\n\`\`\`\n${ann.originalText}\n\`\`\`\n`;
        output += `**To:**\n\`\`\`\n${ann.text}\n\`\`\`\n`;
        break;

      case 'COMMENT':
        output += `Feedback on: "${ann.originalText}"\n`;
        output += `> ${ann.text}\n`;
        break;

      case 'GLOBAL_COMMENT':
        output += `General feedback about the plan\n`;
        output += `> ${ann.text}\n`;
        break;
    }

    output += '\n';
  });

  output += `---\n`;
  return output;
};
