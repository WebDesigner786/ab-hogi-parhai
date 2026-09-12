import React, { useState } from 'react';
import {
  FileCode2,
  Copy,
  Download,
  Printer,
  Check,
  Edit3,
  Eye,
  Layers,
  Sparkles,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { GeneratedArtifact } from '../types';

interface ArtifactStudioViewProps {
  artifact: GeneratedArtifact | null;
  onUpdateContent: (newContent: string) => void;
  university: string;
}

export const ArtifactStudioView: React.FC<ArtifactStudioViewProps> = ({
  artifact,
  onUpdateContent,
  university,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);

  if (!artifact) {
    return (
      <div id="artifact-studio-empty" className="flex-1 p-8 bg-slate-50 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
          <FileCode2 className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-800">No Active Artifact in Studio</h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Ask the AI in the Chat Workspace or complete a Socratic Interview to generate an assignment draft, lab report, or derivation analysis.
        </p>
      </div>
    );
  }

  const wordCount = artifact.content.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const res = await fetch('/api/pdf/generate-academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: artifact.title,
          subtitle: `${artifact.type.replace('_', ' ').toUpperCase()} • ${artifact.courseCode || 'CS Course'}`,
          author: 'Student 123456',
          university,
          bodyText: artifact.content,
        }),
      });
      const data = await res.json();
      if (data.pdfBase64) {
        const byteCharacters = atob(data.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfDownloadUrl(url);

        // Auto trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = `${artifact.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
        a.click();
      }
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="artifact-studio-container" className="flex-1 p-4 md:p-6 bg-slate-50 overflow-y-auto space-y-5">
      {/* Studio Header & Export Toolbar */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
              {artifact.type.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-400">
              {wordCount} words • ~{readingTime} min read
            </span>
          </div>
          <h1 className="text-base font-bold text-slate-900">{artifact.title}</h1>
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Mode toggle */}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-semibold ${
              isEditing
                ? 'bg-emerald-700 text-white border-emerald-800'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'Preview Output' : 'Edit Text'}</span>
          </button>

          {/* Copy Markdown */}
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
          </button>

          {/* Download Academic PDF */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Academic PDF'}</span>
          </button>

          {/* Print */}
          <button
            type="button"
            onClick={handlePrint}
            title="Print or Save as Browser PDF"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor or Preview Pane */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 max-w-4xl mx-auto">
        {isEditing ? (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600">
              Direct Academic Content Editor (Markdown & LaTeX supported):
            </label>
            <textarea
              value={artifact.content}
              onChange={(e) => onUpdateContent(e.target.value)}
              rows={22}
              className="w-full p-4 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 leading-relaxed"
            />
          </div>
        ) : (
          <div className="space-y-4 print:p-0">
            {/* Academic Document Header */}
            <div className="border-b border-slate-200 pb-4 mb-4 text-center space-y-1">
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-800">
                {university} • Academic Report
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {artifact.title}
              </h2>
              <div className="text-xs text-slate-500 font-medium">
                Verified Grounded Output • Prepared via ABHOGIPARHAI Academic Workspace
              </div>
            </div>

            {/* Rendered Text Body */}
            <div className="prose prose-slate max-w-none text-xs leading-relaxed text-slate-800 whitespace-pre-wrap font-sans">
              {artifact.content}
            </div>

            {/* Citations Footer if present */}
            {artifact.citations && artifact.citations.length > 0 && (
              <div className="mt-8 pt-4 border-t border-slate-200">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Grounding References ({artifact.citations.length})</span>
                </h3>
                <div className="space-y-1">
                  {artifact.citations.map((cite, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100"
                    >
                      <strong className="text-slate-800">[{idx + 1}]</strong> {cite.sourceDocName}, Page {cite.page}
                      {cite.section ? ` (${cite.section})` : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
