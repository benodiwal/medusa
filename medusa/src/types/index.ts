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
  annotations?: Annotation[];
}

export interface ObsidianVault {
  name: string;
  path: string;
}

// Shareable plan types for URL-based sharing
export interface ShareablePlan {
  title: string;
  content: string;
  createdAt: number;
  sharedBy?: string;
  sharedAt?: number;
  annotations: ShareableAnnotation[];
  version: number;
}

export interface ShareableAnnotation extends Annotation {
  authorName: string;
  authorColor?: string;
}

export interface AuthorIdentity {
  name: string;
  color: string;
}

// Task Management types for Medusa 2.0
export enum TaskStatus {
  Backlog = 'Backlog',
  InProgress = 'InProgress',
  Review = 'Review',
  Done = 'Done',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  project_path: string;
  branch?: string;
  worktree_path?: string;

  // Link to plan (when in Planning status)
  plan_id?: string;

  // Execution tracking
  agent_pid?: number;
  session_id?: string;  // Claude Code session ID for resuming
  started_at?: number;
  completed_at?: number;

  // Results
  files_changed?: string[];
  diff_summary?: string;

  // Metadata
  created_at: number;
  updated_at: number;
}

// Commit information for task branch
export interface TaskCommit {
  hash: string;
  short_hash: string;
  message: string;
  author: string;
  date: string;
}

