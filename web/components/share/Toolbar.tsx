'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnnotationType } from '../../lib/share';

interface ToolbarProps {
  highlightElement: HTMLElement | null;
  onAnnotate: (type: AnnotationType, text?: string) => void;
  onClose: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  highlightElement,
  onAnnotate,
  onClose,
}) => {
  const [step, setStep] = useState<'menu' | 'input'>('menu');
  const [activeType, setActiveType] = useState<AnnotationType | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (step === 'input') inputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    setStep('menu');
    setActiveType(null);
    setInputValue('');
  }, [highlightElement]);

  useEffect(() => {
    if (!highlightElement) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const rect = highlightElement.getBoundingClientRect();
      const toolbarTop = rect.top - 48;

      if (step === 'menu' && (rect.bottom < 0 || rect.top > window.innerHeight)) {
        onClose();
        return;
      }

      setPosition({
        top: toolbarTop,
        left: rect.left + rect.width / 2,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [highlightElement, onClose, step]);

  if (!mounted || !highlightElement || !position) return null;

  const { top, left } = position;

  const handleTypeSelect = (type: AnnotationType) => {
    if (type === AnnotationType.DELETION) {
      onAnnotate(type);
    } else {
      setActiveType(type);
      setStep('input');
    }
  };

  const getPlaceholder = () => {
    if (activeType === AnnotationType.REPLACEMENT) {
      return 'Replace with...';
    }
    return 'Add a comment...';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeType && inputValue.trim()) {
      onAnnotate(activeType, inputValue);
    }
  };

  return createPortal(
    <div
      className="annotation-toolbar fixed z-[100] bg-white border border-[#e5e2db] rounded-lg shadow-xl"
      style={{ top, left, transform: 'translateX(-50%)' }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {step === 'menu' ? (
        <div className="flex items-center p-1 gap-0.5">
          <ToolbarButton
            onClick={() => handleTypeSelect(AnnotationType.DELETION)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
            label="Delete"
            className="text-red-600 hover:bg-red-50"
          />
          <ToolbarButton
            onClick={() => handleTypeSelect(AnnotationType.REPLACEMENT)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            }
            label="Replace"
            className="text-orange-600 hover:bg-orange-50"
          />
          <ToolbarButton
            onClick={() => handleTypeSelect(AnnotationType.COMMENT)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            }
            label="Comment"
            className="text-blue-600 hover:bg-blue-50"
          />
          <div className="w-px h-5 bg-[#e5e2db] mx-0.5" />
          <ToolbarButton
            onClick={onClose}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
            label="Cancel"
            className="text-[#6B5B47] hover:bg-[#f3f1e8]"
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-start gap-1.5 p-1.5 pl-3">
          <textarea
            ref={inputRef}
            rows={1}
            className="bg-transparent text-sm min-w-44 max-w-80 max-h-32 placeholder:text-[#9a8b7a] text-[#16110a] resize-none px-2 py-1.5 focus:outline-none"
            placeholder={getPlaceholder()}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setStep('menu');
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && inputValue.trim()) {
                e.preventDefault();
                onAnnotate(activeType!, inputValue);
              }
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="px-3 py-1 text-xs font-medium rounded bg-[#6B5B47] text-white hover:opacity-90 disabled:opacity-50 transition-opacity self-stretch"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setStep('menu')}
            className="p-1 rounded text-[#6B5B47] hover:text-[#16110a] hover:bg-[#f3f1e8] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </form>
      )}
    </div>,
    document.body
  );
};

const ToolbarButton: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  className: string;
}> = ({ onClick, icon, label, className }) => (
  <button
    onClick={onClick}
    title={label}
    className={`p-1.5 rounded-md transition-colors ${className}`}
  >
    {icon}
  </button>
);
