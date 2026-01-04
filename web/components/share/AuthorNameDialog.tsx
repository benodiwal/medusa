'use client';

import { useState, useEffect, useRef } from 'react';
import { BiX } from 'react-icons/bi';

interface AuthorNameDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  currentName?: string;
}

export function AuthorNameDialog({ open, onClose, onSubmit, currentName }: AuthorNameDialogProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(currentName || '');
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [open, currentName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      setName('');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-[#e5e2db] rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e5e2db]">
          <div>
            <h2 className="text-lg font-semibold text-[#16110a]">
              {currentName ? 'Change your name' : "What's your name?"}
            </h2>
            <p className="text-sm text-[#6B5B47] mt-1">
              Your name will appear next to your annotations when you share this plan.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#f3f1e8] rounded-full transition-colors text-[#6B5B47] hover:text-[#16110a]"
          >
            <BiX className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            className="w-full px-3 py-2 bg-[#faf9f7] border border-[#e5e2db] rounded-lg text-sm text-[#16110a] placeholder:text-[#9a8b7a] focus:outline-none focus:border-[#6B5B47]"
          />

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-[#6B5B47] hover:text-[#16110a] rounded-lg hover:bg-[#f3f1e8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-2 text-sm font-medium bg-[#6B5B47] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
