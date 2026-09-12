import React, { useState } from 'react';
import {
  X,
  FileText,
  Calculator,
  PenTool,
  Layers,
  AlertTriangle,
  Copy,
  Check,
  Search,
} from 'lucide-react';
import { CourseDocument } from '../types';

interface DocumentInspectionModalProps {
  document: CourseDocument | null;
  initialPage?: number;
  onClose: () => void;
}

export const DocumentInspectionModal: React.FC<DocumentInspectionModalProps> = ({
  document,
  initialPage,
  onClose,
}) => {
  const [selectedPage, setSelectedPage] = useState<number>(initialPage || 1);
  const [activeView, setActiveView] = useState<'blocks' | 'chunks' | 'raw'>('blocks');
  const [copiedLatex, setCopiedLatex] = useState<string | null>(null);

  if (!document) return null;

  const filteredBlocks = document.blocks.filter((b) => b.page === selectedPage);

  const handleCopyLatex = (latex: string) => {
    navigator.clipboard.writeText(latex);
    setCopiedLatex(latex);
    setTimeout(() => setCopiedLatex(null), 1800);
  };

  const pagesArray = Array.from({ length: Math.max(1, document.pageCount) }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-700 text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 line-clamp-1">
                {document.fileName}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span>{document.courseName}</span>
                <span>•</span>
                <span>{document.pageCount} Pages</span>
                <span>•</span>
                <span>{document.blocks.length} Structured Blocks</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Pills */}
            <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveView('blocks')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeView === 'blocks'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Blocks & Math
              </button>
              <button
                type="button"
                onClick={() => setActiveView('chunks')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeView === 'chunks'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                RAG Chunks ({document.chunks.length})
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Page Selector Sidebar (for blocks view) */}
          {activeView === 'blocks' && (
            <div className="w-full md:w-36 bg-slate-50 border-r border-slate-200 p-2 overflow-y-auto shrink-0 flex md:flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1 hidden md:block">
                Select Page
              </span>
              {pagesArray.map((p) => {
                const countForPage = document.blocks.filter((b) => b.page === p).length;
                const isSelected = selectedPage === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedPage(p)}
                    className={`flex-1 md:flex-none text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-800 text-white font-bold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>Page {p}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {countForPage}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Main Inspection List */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
            {activeView === 'blocks' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800">
                    Extracted Elements on Page {selectedPage}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Multimodal Layout Analysis
                  </span>
                </div>

                {filteredBlocks.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    No structured blocks recorded for Page {selectedPage}.
                  </p>
                ) : (
                  filteredBlocks.map((block) => (
                    <div
                      key={block.id}
                      className={`p-3 rounded-xl border text-xs space-y-2 ${
                        block.type === 'equation'
                          ? 'bg-purple-50/60 border-purple-200'
                          : block.type === 'uncertain'
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            block.type === 'equation'
                              ? 'bg-purple-200 text-purple-900'
                              : block.type === 'heading'
                              ? 'bg-blue-100 text-blue-800'
                              : block.type === 'uncertain'
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {block.type}
                        </span>

                        {block.confidence && (
                          <span className="text-[10px] text-slate-400">
                            Confidence: {Math.round(block.confidence * 100)}%
                          </span>
                        )}
                      </div>

                      <div className="text-slate-800 leading-relaxed font-medium">
                        {block.content}
                      </div>

                      {/* Equation LaTeX Preview */}
                      {block.latex && (
                        <div className="mt-2 p-2.5 bg-white rounded-lg border border-purple-200 flex items-center justify-between gap-3">
                          <div className="font-mono text-xs text-purple-950 truncate math-block">
                            $${block.latex}$$
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyLatex(block.latex!)}
                            className="text-slate-500 hover:text-purple-800 shrink-0 p-1 cursor-pointer flex items-center gap-1 text-[11px]"
                          >
                            {copiedLatex === block.latex ? (
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>Copy LaTeX</span>
                          </button>
                        </div>
                      )}

                      {/* Low-confidence or unreadable notice */}
                      {block.type === 'uncertain' && (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-800 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Ambiguous handwriting / scan. Never silently invented by the AI.
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeView === 'chunks' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800 pb-2 border-b border-slate-100">
                  Searchable Chunks Indexed for RAG Retrieval ({document.chunks.length})
                </div>

                {document.chunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-700">
                      <span className="text-emerald-900 font-bold">{chunk.sectionTitle || 'Section'}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                        Page {chunk.pageNumber}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed font-mono text-[11px] whitespace-pre-wrap">
                      {chunk.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
