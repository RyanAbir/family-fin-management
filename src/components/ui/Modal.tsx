"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-xl bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-4 sm:zoom-in-95 duration-500"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 bg-white">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 font-heading tracking-tight">{title}</h3>
            <div className="w-8 h-1 bg-indigo-600 rounded-full" />
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-2xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100"
          >
            <X size={20} />
          </button>
        </div> 

        {/* Content */}
        <div className="p-8 max-h-[85vh] overflow-y-auto bg-slate-50/20">
          {children}
        </div>
      </div>
    </div>
  );
}
