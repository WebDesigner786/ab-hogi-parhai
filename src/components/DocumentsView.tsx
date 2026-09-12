import React, { useState } from 'react';
import {
  FolderKanban,
  FileText,
  UploadCloud,
  Search,
  Trash2,
  Eye,
  MessageSquare,
  Sparkles,
  Calculator,
  PenTool,
  Layers,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { Course, CourseDocument, DocumentChunk } from '../types';

interface DocumentsViewProps {
  courses: Course[];
  documents: CourseDocument[];
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
  onOpenUploadModal: () => void;
  onInspectDocument: (docId: string) => void;
  onDeleteDocument: (docId: string) => void;
  onQueryWithDocument: (docName: string) => void;
  onDirectSearchCorpus: (query: string) => Promise<{ chunk: DocumentChunk; score: number }[]>;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  courses,
  documents,
  selectedCourseId,
  onSelectCourse,
  onOpenUploadModal,
  onInspectDocument,
  onDeleteDocument,
  onQueryWithDocument,
  onDirectSearchCorpus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ chunk: DocumentChunk; score: number }[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const filteredDocs = selectedCourseId
    ? documents.filter((d) => d.courseId === selectedCourseId)
    : documents;

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const res = await onDirectSearchCorpus(searchQuery.trim());
      setSearchResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div id="documents-view-container" className="flex-1 p-4 md:p-6 bg-slate-50 overflow-y-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-emerald-700" />
            <span>Private Course Corpus (RAG)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your university materials (lecture slides, assignments, lab guides, handwritten notes) indexed with page-level citations.
          </p>
        </div>

        <button
          id="doc-view-upload-btn"
          type="button"
          onClick={onOpenUploadModal}
          className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Material</span>
        </button>
      </div>

      {/* RAG Search Bar & Test Retrieval */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
          <span>Search & Verify Corpus Grounding</span>
          {searchResults && (
            <button
              type="button"
              onClick={() => {
                setSearchResults(null);
                setSearchQuery('');
              }}
              className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Clear Results
            </button>
          )}
        </div>
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across all ingested slides and notes (e.g., 'Red-Black tree height proof', 'Rotations', 'asymptotic analysis')..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
          </div>
          <button
            type="submit"
            disabled={!searchQuery.trim() || isSearching}
            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            {isSearching ? 'Searching...' : 'Search Chunks'}
          </button>
        </form>

        {/* Search Results Display */}
        {searchResults && (
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div className="text-xs font-bold text-slate-700">
              Found {searchResults.length} verified context chunks:
            </div>
            {searchResults.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">
                No matching chunks found in the current corpus. Try different keywords.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {searchResults.map((res, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span className="truncate">{res.chunk.documentName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        Page {res.chunk.pageNumber} • Score {res.score}
                      </span>
                    </div>
                    <p className="text-slate-600 line-clamp-3 italic">
                      "{res.chunk.content}"
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 truncate">{res.chunk.sectionTitle}</span>
                      <button
                        type="button"
                        onClick={() => onQueryWithDocument(res.chunk.content)}
                        className="text-emerald-700 font-semibold hover:underline cursor-pointer"
                      >
                        Ask AI about this chunk →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Course Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onSelectCourse('')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCourseId === ''
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          All Courses ({documents.length})
        </button>
        {courses.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelectCourse(c.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCourseId === c.id
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {c.code} — {c.title.split('(')[0]}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all group"
          >
            <div>
              {/* Top Meta */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                  {doc.containsMath && (
                    <span
                      title="Contains mathematical equations (LaTeX extracted)"
                      className="p-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {doc.isHandwritten && (
                    <span
                      title="Contains handwritten notes"
                      className="p-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {doc.pageCount} {doc.pageCount === 1 ? 'Page' : 'Pages'}
                  </span>
                </div>
              </div>

              {/* Document Title */}
              <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-emerald-800 transition-colors">
                {doc.fileName}
              </h3>
              <p className="text-xs text-slate-500 font-medium mb-3">
                {doc.courseName}
              </p>

              {/* Stats Summary */}
              <div className="bg-slate-50 rounded-xl p-2.5 text-xs text-slate-600 space-y-1 mb-3">
                <div className="flex items-center justify-between">
                  <span>Structured Blocks:</span>
                  <span className="font-semibold text-slate-900">{doc.blocks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Searchable Chunks:</span>
                  <span className="font-semibold text-slate-900">{doc.chunks.length}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Size:</span>
                  <span>{Math.round(doc.fileSize / 1024)} KB</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onInspectDocument(doc.id)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Inspect Blocks</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onQueryWithDocument(doc.fileName)}
                  title="Ask AI about this document"
                  className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteDocument(doc.id)}
                  title="Remove from corpus"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {filteredDocs.length === 0 && (
          <div className="col-span-full bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center">
            <UploadCloud className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">No documents found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Upload lecture slides, past papers, problem sets, or handwritten notes to begin grounding.
            </p>
            <button
              type="button"
              onClick={onOpenUploadModal}
              className="mt-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              Upload Material
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
