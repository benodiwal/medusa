export enum AnnotationType {
  DELETION = 'DELETION',
  INSERTION = 'INSERTION',
  REPLACEMENT = 'REPLACEMENT',
  COMMENT = 'COMMENT',
  GLOBAL_COMMENT = 'GLOBAL_COMMENT',
}

export type EditorMode = 'selection' | 'redline';

export interface Annotation {
  id: string;
  blockId: string;
  startOffset: number;
  endOffset: number;
  type: AnnotationType;
  text?: string;
  originalText: string;
  createdAt: number;
  author?: string;
  // web-highlighter metadata for cross-element selections
  startMeta?: {
    parentTagName: string;
    parentIndex: number;
    textOffset: number;
  };
  endMeta?: {
    parentTagName: string;
    parentIndex: number;
    textOffset: number;
  };
}

export interface Block {
  id: string;
  type: 'paragraph' | 'heading' | 'blockquote' | 'list-item' | 'code' | 'hr' | 'table';
  content: string;
  level?: number;
  language?: string;
  checked?: boolean;
  order: number;
  startLine: number;
}

export interface Plan {
  id: string;
  content: string;
  blocks: Block[];
  annotations: Annotation[];
  createdAt: number;
  updatedAt: number;
  source?: string; // file path or session id
}

export interface PlanResponse {
  content: string;
  source?: string;
}

export interface ApproveRequest {
  feedback?: string;
  annotations: Annotation[];
}

export interface DenyRequest {
  reason: string;
  annotations: Annotation[];
}

// Kanban types
export enum PlanStatus {
  Pending = 'Pending',
  InReview = 'InReview',
  Approved = 'Approved',
  Denied = 'Denied',
  ChangesRequested = 'ChangesRequested',
}

export interface PlanItem {
  id: string;
  content: string;
  source?: string;
  project_name: string;
  session_id?: string;
  response_file?: string;
  status: PlanStatus;
  feedback?: string;
  created_at: number;
  previous_content?: string;
}

export interface ObsidianVault {
  name: string;
  path: string;
}

