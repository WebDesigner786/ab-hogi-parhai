import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Sparkles,
} from 'lucide-react';
import { Course } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  selectedCourseId: string;
  onUploadSuccess: (newDoc: any) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  courses,
  selectedCourseId,
  onUploadSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [targetCourseId, setTargetCourseId] = useState(selectedCourseId || (courses[0]?.id || ''));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);
    const validMimes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'text/plain',
      'text/markdown',
    ];

    if (!validMimes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
      setErrorMessage('Unsupported file type. Please upload a PDF, PNG/JPEG scan, or TXT file.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 25MB limit.');
      return;
    }

    setSelectedFile(file);
  };

  const handleProcessUpload = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingStatus('Reading binary document data...');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        setProcessingStatus('Running Multimodal Vision, Layout & LaTeX Math Extraction...');

        const targetCourse = courses.find((c) => c.id === targetCourseId);

        const res = await fetch('/api/documents/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: selectedFile.name,
            fileData: base64Data,
            mimeType: selectedFile.type || 'application/pdf',
            courseId: targetCourseId || 'general',
            courseName: targetCourse?.title || 'General Academic',
          }),
        });

        const data = await res.json();
        if (data.success && data.document) {
          setProcessingStatus('Indexing searchable RAG chunks complete!');
          onUploadSuccess(data.document);
          setTimeout(() => {
            onClose();
          }, 600);
        } else {
          setErrorMessage(data.error || 'Document processing failed.');
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Network error during upload.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage('Failed to read selected file.');
      setIsProcessing(false);
    };

    reader.readAsDataURL(selectedFile);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-700 text-white">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Upload Course Material</h2>
              <p className="text-[11px] text-slate-500">
                PDFs, handwritten note scans, or lecture slides.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Course Assignment */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">Assign to Course:</label>
          <select
            value={targetCourseId}
            onChange={(e) => setTargetCourseId(e.target.value)}
            disabled={isProcessing}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
            dragActive
              ? 'border-emerald-700 bg-emerald-50'
              : selectedFile
              ? 'border-emerald-400 bg-emerald-50/30'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md"
            onChange={handleChange}
            className="hidden"
          />

          {selectedFile ? (
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 truncate max-w-xs mx-auto">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-slate-500">
                  {Math.round(selectedFile.size / 1024)} KB • Ready for extraction
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-700">
                Drag & drop lecture PDF or scan here, or <span className="text-emerald-700 underline">browse</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Supports PDF, scanned images, handwritten notes (up to 25MB)
              </p>
            </div>
          )}
        </div>

        {/* Progress & Error States */}
        {isProcessing && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-emerald-700 animate-spin shrink-0" />
            <span>{processingStatus}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleProcessUpload}
            disabled={!selectedFile || isProcessing}
            className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ingest & Index</span>
          </button>
        </div>
      </div>
    </div>
  );
};
