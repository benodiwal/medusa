import { useState, useEffect } from 'react';
import { X, FolderOpen } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';

interface CreateTaskModalProps {
  onClose: () => void;
  onCreate: (title: string, description: string, projectPath: string) => void;
}

export function CreateTaskModal({ onClose, onCreate }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectPath, setProjectPath] = useState('');

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSelectFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Select Project Folder',
    });
    if (selected && typeof selected === 'string') {
      setProjectPath(selected);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && projectPath.trim()) {
      onCreate(title.trim(), description.trim(), projectPath.trim());
    }
  };

  const isValid = title.trim() && projectPath.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-background rounded-xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Create Task</h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            title="Close (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-foreground">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Add user authentication"
              className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:border-primary"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what needs to be done..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Project Path */}
          <div className="space-y-2">
            <label htmlFor="projectPath" className="text-sm font-medium text-foreground">
              Project Folder <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                id="projectPath"
                type="text"
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                placeholder="/path/to/project"
                className="flex-1 px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleSelectFolder}
                className="px-3 py-2 text-sm bg-muted border border-border rounded-lg hover:bg-muted/80 transition-colors"
                title="Browse"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
            </div>
            {projectPath && (
              <p className="text-xs text-muted-foreground truncate">
                {projectPath}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
