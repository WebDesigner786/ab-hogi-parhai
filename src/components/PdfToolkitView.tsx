import React, { useState } from 'react';
import {
  Files,
  FilePlus,
  Scissors,
  RotateCw,
  Trash2,
  Download,
  Info,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { CourseDocument } from '../types';

interface PdfToolkitViewProps {
  documents: CourseDocument[];
}

export const PdfToolkitView: React.FC<PdfToolkitViewProps> = ({ documents }) => {
  const [activeSubTab, setActiveSubTab] = useState<'merge' | 'split' | 'organize' | 'info'>('merge');

  // Merge state
  const [mergeSelectedDocIds, setMergeSelectedDocIds] = useState<string[]>([]);
  const [uploadedMergePdfs, setUploadedMergePdfs] = useState<{ name: string; base64: string }[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedDownloadUrl, setMergedDownloadUrl] = useState<string | null>(null);

  // Split state
  const [splitDocBase64, setSplitDocBase64] = useState<string>('');
  const [splitDocName, setSplitDocName] = useState<string>('');
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(2);
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitDownloadUrl, setSplitDownloadUrl] = useState<string | null>(null);

  // Organize state
  const [orgDocBase64, setOrgDocBase64] = useState<string>('');
  const [orgDocName, setOrgDocName] = useState<string>('');
  const [pageOrderInput, setPageOrderInput] = useState<string>('');
  const [deletePagesInput, setDeletePagesInput] = useState<string>('');
  const [rotateDegrees, setRotateDegrees] = useState<number>(90);
  const [rotatePageInput, setRotatePageInput] = useState<string>('');
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [organizedDownloadUrl, setOrganizedDownloadUrl] = useState<string | null>(null);

  // Info state
  const [inspectDocBase64, setInspectDocBase64] = useState<string>('');
  const [inspectDocName, setInspectDocName] = useState<string>('');
  const [pdfInfo, setPdfInfo] = useState<any>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  // Error and success notification
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File Upload Helper for PDF operations
  const handlePdfFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onLoaded: (name: string, base64: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrorMessage('Please select a valid PDF document.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      onLoaded(file.name, base64);
    };
    reader.readAsDataURL(file);
  };

  // 1. Execute Merge
  const handleExecuteMerge = async () => {
    setErrorMessage(null);
    setActionMessage(null);
    setMergedDownloadUrl(null);

    const pdfList: string[] = [...uploadedMergePdfs.map((p) => p.base64)];

    if (pdfList.length < 2) {
      setErrorMessage('Please upload or select at least 2 PDF files to merge.');
      return;
    }

    setIsMerging(true);
    try {
      const res = await fetch('/api/pdf/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64Array: pdfList }),
      });
      const data = await res.json();
      if (data.mergedPdfBase64) {
        const byteCharacters = atob(data.mergedPdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setMergedDownloadUrl(url);
        setActionMessage(`Successfully merged ${pdfList.length} PDFs into a single file.`);
      } else {
        setErrorMessage(data.error || 'Failed to merge PDFs');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error');
    } finally {
      setIsMerging(false);
    }
  };

  // 2. Execute Split
  const handleExecuteSplit = async () => {
    setErrorMessage(null);
    setActionMessage(null);
    setSplitDownloadUrl(null);

    if (!splitDocBase64) {
      setErrorMessage('Please upload a PDF file to split.');
      return;
    }

    setIsSplitting(true);
    try {
      const res = await fetch('/api/pdf/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: splitDocBase64,
          startPage,
          endPage,
        }),
      });
      const data = await res.json();
      if (data.splitPdfBase64) {
        const byteCharacters = atob(data.splitPdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setSplitDownloadUrl(url);
        setActionMessage(`Extracted pages ${startPage} through ${endPage} successfully.`);
      } else {
        setErrorMessage(data.error || 'Failed to split PDF');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error');
    } finally {
      setIsSplitting(false);
    }
  };

  // 3. Execute Organize
  const handleExecuteOrganize = async () => {
    setErrorMessage(null);
    setActionMessage(null);
    setOrganizedDownloadUrl(null);

    if (!orgDocBase64) {
      setErrorMessage('Please upload a PDF file to organize.');
      return;
    }

    const deletePages = deletePagesInput
      ? deletePagesInput.split(',').map((p) => parseInt(p.trim(), 10)).filter((n) => !isNaN(n))
      : undefined;

    const pageOrder = pageOrderInput
      ? pageOrderInput.split(',').map((p) => parseInt(p.trim(), 10)).filter((n) => !isNaN(n))
      : undefined;

    const rotatePages = rotatePageInput
      ? rotatePageInput
          .split(',')
          .map((p) => parseInt(p.trim(), 10))
          .filter((n) => !isNaN(n))
          .map((p) => ({ page: p, rotationDegrees: rotateDegrees }))
      : undefined;

    setIsOrganizing(true);
    try {
      const res = await fetch('/api/pdf/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: orgDocBase64,
          operations: {
            pageOrder,
            deletePages,
            rotatePages,
          },
        }),
      });
      const data = await res.json();
      if (data.organizedPdfBase64) {
        const byteCharacters = atob(data.organizedPdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setOrganizedDownloadUrl(url);
        setActionMessage('PDF pages successfully reorganized and rotated.');
      } else {
        setErrorMessage(data.error || 'Failed to organize PDF');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error');
    } finally {
      setIsOrganizing(false);
    }
  };

  // 4. Execute Inspect Info
  const handleExecuteInspect = async (name: string, base64: string) => {
    setInspectDocName(name);
    setInspectDocBase64(base64);
    setIsInspecting(true);
    setPdfInfo(null);
    try {
      const res = await fetch('/api/pdf/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64: base64 }),
      });
      const data = await res.json();
      setPdfInfo(data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to inspect PDF');
    } finally {
      setIsInspecting(false);
    }
  };

  return (
    <div id="pdf-toolkit-container" className="flex-1 p-4 md:p-6 bg-slate-50 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-800">
              <Files className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">Academic PDF Toolkit</h1>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Real binary PDF processing: merge lecture slide decks, split assignment problems, reorder pages, rotate scans, and inspect metadata without uploading to third-party servers.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Sub tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'merge', label: 'Merge PDFs', icon: Layers },
          { id: 'split', label: 'Split / Extract Pages', icon: Scissors },
          { id: 'organize', label: 'Page Organizer & Rotate', icon: RotateCw },
          { id: 'info', label: 'Inspect Metadata', icon: Info },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveSubTab(tab.id as any);
                setErrorMessage(null);
                setActionMessage(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. Merge Section */}
      {activeSubTab === 'merge' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Combine Multiple PDF Documents</h2>
            <p className="text-xs text-slate-500">
              Upload two or more PDFs (e.g. Lab Report Body + Code Appendix + Verification Screenshot).
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Queued PDFs for Merge ({uploadedMergePdfs.length})
              </span>
              <label className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5">
                <FilePlus className="w-3.5 h-3.5" />
                <span>+ Add PDF File</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) =>
                    handlePdfFileUpload(e, (name, base64) =>
                      setUploadedMergePdfs((prev) => [...prev, { name, base64 }])
                    )
                  }
                  className="hidden"
                />
              </label>
            </div>

            {uploadedMergePdfs.length === 0 ? (
              <div className="p-6 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                No PDFs added to merge queue yet. Click "+ Add PDF File" above.
              </div>
            ) : (
              <div className="space-y-1.5">
                {uploadedMergePdfs.map((pdf, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[11px]">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800">{pdf.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setUploadedMergePdfs((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleExecuteMerge}
              disabled={uploadedMergePdfs.length < 2 || isMerging}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{isMerging ? 'Merging with pdf-lib...' : 'Merge PDFs'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {mergedDownloadUrl && (
              <a
                href={mergedDownloadUrl}
                download="merged_academic_document.pdf"
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Merged PDF</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* 2. Split Section */}
      {activeSubTab === 'split' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Extract Specific Page Range</h2>
            <p className="text-xs text-slate-500">
              Isolate required assignment pages or extract a specific lecture section.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">Source PDF</label>
            <div className="flex items-center gap-3">
              <label className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer transition-all border border-slate-200">
                <span>Select PDF File</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) =>
                    handlePdfFileUpload(e, (name, base64) => {
                      setSplitDocName(name);
                      setSplitDocBase64(base64);
                    })
                  }
                  className="hidden"
                />
              </label>
              <span className="text-xs text-slate-600 font-medium">
                {splitDocName || 'No file selected'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Start Page:
                </label>
                <input
                  type="number"
                  min={1}
                  value={startPage}
                  onChange={(e) => setStartPage(parseInt(e.target.value, 10) || 1)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  End Page:
                </label>
                <input
                  type="number"
                  min={1}
                  value={endPage}
                  onChange={(e) => setEndPage(parseInt(e.target.value, 10) || 1)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleExecuteSplit}
              disabled={!splitDocBase64 || isSplitting}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{isSplitting ? 'Extracting Pages...' : 'Extract Range'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {splitDownloadUrl && (
              <a
                href={splitDownloadUrl}
                download={`extracted_p${startPage}_to_p${endPage}.pdf`}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Extracted PDF</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* 3. Organize Section */}
      {activeSubTab === 'organize' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Reorder, Rotate & Remove Pages</h2>
            <p className="text-xs text-slate-500">
              Rearrange scrambled scanned exam papers, delete blank pages, or rotate sideways lecture slides.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer transition-all border border-slate-200">
                <span>Select PDF File</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) =>
                    handlePdfFileUpload(e, (name, base64) => {
                      setOrgDocName(name);
                      setOrgDocBase64(base64);
                    })
                  }
                  className="hidden"
                />
              </label>
              <span className="text-xs text-slate-600 font-medium">
                {orgDocName || 'No file selected'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Custom Page Order (comma-separated):
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1, 3, 2, 4"
                  value={pageOrderInput}
                  onChange={(e) => setPageOrderInput(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">Leaves original order if blank.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pages to Delete (comma-separated):
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2, 5"
                  value={deletePagesInput}
                  onChange={(e) => setDeletePagesInput(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rotate Specific Page(s):
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1, 4"
                  value={rotatePageInput}
                  onChange={(e) => setRotatePageInput(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rotation Angle:
                </label>
                <select
                  value={rotateDegrees}
                  onChange={(e) => setRotateDegrees(parseInt(e.target.value, 10))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value={90}>90° Clockwise</option>
                  <option value={180}>180° Flip</option>
                  <option value={270}>270° (90° Counter-Clockwise)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleExecuteOrganize}
              disabled={!orgDocBase64 || isOrganizing}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{isOrganizing ? 'Processing...' : 'Apply Page Operations'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {organizedDownloadUrl && (
              <a
                href={organizedDownloadUrl}
                download="organized_document.pdf"
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Organized PDF</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* 4. Info Section */}
      {activeSubTab === 'info' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Inspect PDF Header & Page Count</h2>
            <p className="text-xs text-slate-500">
              Validates whether a PDF is non-corrupt, readable by PDF.js, and checks page count.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer transition-all border border-slate-200">
              <span>Select PDF to Inspect</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) =>
                  handlePdfFileUpload(e, (name, base64) => handleExecuteInspect(name, base64))
                }
                className="hidden"
              />
            </label>
            <span className="text-xs text-slate-600 font-medium">
              {inspectDocName || 'No file selected'}
            </span>
          </div>

          {isInspecting && (
            <div className="text-xs text-slate-500 py-4">Inspecting PDF structure...</div>
          )}

          {pdfInfo && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-w-md space-y-2 text-xs">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Valid PDF Document</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Total Page Count:</span>
                <span className="font-bold text-slate-900">{pdfInfo.pageCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Document Title:</span>
                <span className="font-semibold text-slate-800">{pdfInfo.title || 'None'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Author:</span>
                <span className="font-semibold text-slate-800">{pdfInfo.author || 'None'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Producer / Engine:</span>
                <span className="font-semibold text-slate-800">{pdfInfo.producer || 'pdf-lib'}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
