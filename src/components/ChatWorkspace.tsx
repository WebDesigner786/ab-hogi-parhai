import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Mic,
  Sparkles,
  Bot,
  User,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';
import { ChatMessage, Citation, CourseDocument, GeneratedArtifact, ToolExecution } from '../types';

interface ChatWorkspaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string, attachedDocIds?: string[]) => void;
  onOpenVoiceModal: () => void;
  onOpenUploadModal: () => void;
  onInspectDocument: (docId: string, pageNumber?: number) => void;
  onOpenArtifactInStudio: (artifact: GeneratedArtifact) => void;
  documents: CourseDocument[];
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onOpenVoiceModal,
  onOpenUploadModal,
  onInspectDocument,
  onOpenArtifactInStudio,
  documents,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim(), selectedDocIds);
    setInputText('');
    setSelectedDocIds([]);
    setShowAttachMenu(false);
  };

  const samplePrompts = [
    'Explain the Red-Black Tree height proof from Lecture 04.',
    'Generate a complete CS-212 lab report for Lab 03.',
    'Check my assignment against the university grading rubric.',
    'Ask me questions about my FYP idea and turn answers into a draft.',
    'Find all lecture slides explaining O(log n) rotations.',
    'Merge my lab assignment PDFs into a single submission file.',
  ];

  const toggleDocSelection = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  // Helper to render message text with Markdown headers, bold, and LaTeX math notation
  const renderFormattedText = (text: string) => {
    // Split by paragraphs
    const paragraphs = text.split('\n\n');

    return (
      <div className="space-y-3 text-sm leading-relaxed text-slate-800">
        {paragraphs.map((para, pIdx) => {
          const trimmed = para.trim();
          if (!trimmed) return null;

          // Check if markdown header
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={pIdx} className="font-bold text-slate-900 text-sm mt-3 mb-1">
                {trimmed.replace(/^###\s+/, '')}
              </h4>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={pIdx} className="font-extrabold text-slate-900 text-base mt-4 mb-1.5 border-b border-slate-100 pb-1">
                {trimmed.replace(/^##\s+/, '')}
              </h3>
            );
          }
          if (trimmed.startsWith('# ')) {
            return (
              <h2 key={pIdx} className="font-black text-slate-900 text-lg mt-4 mb-2">
                {trimmed.replace(/^#\s+/, '')}
              </h2>
            );
          }

          // Format bullet lists
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const items = trimmed.split('\n');
            return (
              <ul key={pIdx} className="list-disc list-inside space-y-1 my-1 pl-1">
                {items.map((it, itIdx) => (
                  <li key={itIdx} className="text-slate-700">
                    {renderInlineFormatting(it.replace(/^[-*]\s+/, ''))}
                  </li>
                ))}
              </ul>
            );
          }

          // Format numbered lists
          if (/^\d+\.\s/.test(trimmed)) {
            const items = trimmed.split('\n');
            return (
              <ol key={pIdx} className="list-decimal list-inside space-y-1 my-1 pl-1">
                {items.map((it, itIdx) => (
                  <li key={itIdx} className="text-slate-700">
                    {renderInlineFormatting(it.replace(/^\d+\.\s+/, ''))}
                  </li>
                ))}
              </ol>
            );
          }

          // Blockquote or note
          if (trimmed.startsWith('> ')) {
            return (
              <div
                key={pIdx}
                className="border-l-4 border-emerald-600 bg-emerald-50/50 pl-3 py-1.5 rounded-r-lg text-emerald-950 italic text-xs my-2"
              >
                {renderInlineFormatting(trimmed.replace(/^>\s+/, ''))}
              </div>
            );
          }

          return <p key={pIdx}>{renderInlineFormatting(trimmed)}</p>;
        })}
      </div>
    );
  };

  // Helper for inline bold, code, and LaTeX math expressions
  const renderInlineFormatting = (content: string) => {
    // Process math equations $...$ or $$...$$
    const mathRegex = /(\$\$[^\$]+\$\$|\$[^\$]+\$)/g;
    const parts = content.split(mathRegex);

    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const mathContent = part.slice(2, -2);
        return (
          <span
            key={index}
            className="block my-2 p-2 bg-slate-100 rounded-lg text-emerald-900 font-mono text-center math-block text-sm border border-slate-200"
          >
            {mathContent}
          </span>
        );
      }
      if (part.startsWith('$') && part.endsWith('$')) {
        const mathContent = part.slice(1, -1);
        return (
          <span
            key={index}
            className="inline-block px-1.5 py-0.5 mx-0.5 bg-emerald-50 text-emerald-900 rounded font-mono text-xs border border-emerald-200 font-medium math-block"
          >
            {mathContent}
          </span>
        );
      }

      // Check for bold and inline code
      const inlineParts = part.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
      return (
        <span key={index}>
          {inlineParts.map((sub, sIdx) => {
            if (sub.startsWith('**') && sub.endsWith('**')) {
              return (
                <strong key={sIdx} className="font-bold text-slate-900">
                  {sub.slice(2, -2)}
                </strong>
              );
            }
            if (sub.startsWith('`') && sub.endsWith('`')) {
              return (
                <code
                  key={sIdx}
                  className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-mono text-xs border border-slate-200"
                >
                  {sub.slice(1, -1)}
                </code>
              );
            }
            return sub;
          })}
        </span>
      );
    });
  };

  return (
    <div id="chat-workspace-container" className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* Welcome Banner if no or single message */}
        {messages.length <= 1 && (
          <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Welcome to ABHOGIPARHAI Academic Workspace
                </h2>
                <p className="text-xs text-slate-500">
                  Ask questions, ground inquiries in course slides, synthesize lab reports, or run real PDF utilities.
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 mb-4 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Hallucination Grounding:</strong> When Strict Mode is active, responses cite actual pages from your uploaded course slides and PDFs. If proof isn't found in your corpus, the assistant will decline to guess.
              </span>
            </div>

            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Suggested Academic Commands:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSendMessage(prompt)}
                  className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-xs text-slate-700 hover:text-emerald-900 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate mr-2">{prompt}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Stream */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`max-w-3xl mx-auto flex gap-3.5 ${
                isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`flex-1 max-w-2xl rounded-2xl p-4 shadow-xs transition-all ${
                  isUser
                    ? 'bg-emerald-800 text-white rounded-tr-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                }`}
              >
                {/* User Message */}
                {isUser ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {msg.text}
                  </p>
                ) : (
                  <div>
                    {/* Tool Executions Progress Badges */}
                    {msg.toolsExecuted && msg.toolsExecuted.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1.5 pb-2.5 border-b border-slate-100">
                        {msg.toolsExecuted.map((tool, tIdx) => (
                          <span
                            key={tIdx}
                            className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                              tool.status === 'completed'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : tool.status === 'running'
                                ? 'bg-amber-50 border-amber-200 text-amber-800 animate-pulse'
                                : 'bg-red-50 border-red-200 text-red-800'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            <span>{tool.message}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* AI Formatted Response */}
                    {renderFormattedText(msg.text)}

                    {/* Citations Box */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Grounded Citations ({msg.citations.length})</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.citations.map((cite, cIdx) => (
                            <button
                              key={cIdx}
                              type="button"
                              onClick={() => onInspectDocument(cite.sourceDocId, cite.page)}
                              className="text-left p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs text-slate-700 transition-all flex items-start justify-between gap-2 group cursor-pointer"
                            >
                              <div className="min-w-0">
                                <div className="font-semibold text-emerald-950 truncate">
                                  {cite.sourceDocName}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Page {cite.page} {cite.section ? `• ${cite.section}` : ''}
                                </div>
                                <p className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5">
                                  "{cite.snippet}"
                                </p>
                              </div>
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-700 shrink-0 mt-1" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Generated Artifact Card */}
                    {msg.artifact && (
                      <div className="mt-4 p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-emerald-600 text-white">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold">{msg.artifact.title}</div>
                            <div className="text-[10px] text-slate-400">
                              {msg.artifact.type.replace('_', ' ').toUpperCase()} • Ready for review
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenArtifactInStudio(msg.artifact!)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Open in Studio</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="max-w-3xl mx-auto flex gap-3.5 items-center text-slate-500 text-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-xs">
              <RotateCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
              <span>Orchestrating tools and grounding response in course corpus...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Control Area */}
      <div className="p-3 md:p-4 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto">
          {/* Selected Attachments Chips */}
          {selectedDocIds.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5 items-center text-xs">
              <span className="text-[11px] font-semibold text-slate-500">Grounded to:</span>
              {selectedDocIds.map((docId) => {
                const doc = documents.find((d) => d.id === docId);
                return (
                  <span
                    key={docId}
                    className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full text-xs font-medium"
                  >
                    <FileText className="w-3 h-3 text-emerald-700" />
                    <span className="max-w-[150px] truncate">{doc ? doc.fileName : docId}</span>
                    <button
                      type="button"
                      onClick={() => toggleDocSelection(docId)}
                      className="hover:text-red-700 cursor-pointer ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
            {/* Attachment Dropdown Toggle */}
            <div className="relative">
              <button
                id="chat-attach-btn"
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                title="Attach course document or slides"
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                  selectedDocIds.length > 0 || showAttachMenu
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Attach Dropdown Menu */}
              {showAttachMenu && (
                <div className="absolute bottom-12 left-0 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50">
                  <div className="text-xs font-bold text-slate-700 px-2 py-1 flex items-center justify-between border-b border-slate-100 mb-1">
                    <span>Attach to Prompt</span>
                    <button
                      type="button"
                      onClick={onOpenUploadModal}
                      className="text-emerald-700 hover:underline text-[11px] font-semibold cursor-pointer"
                    >
                      + Upload New
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {documents.length === 0 ? (
                      <p className="text-xs text-slate-400 p-2 text-center">
                        No documents in corpus yet. Upload lecture slides or notes.
                      </p>
                    ) : (
                      documents.map((doc) => {
                        const isSelected = selectedDocIds.includes(doc.id);
                        return (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => toggleDocSelection(doc.id)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-50 text-emerald-900 font-semibold'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate mr-2">{doc.fileName}</span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Voice Dictation Button */}
            <button
              id="chat-voice-btn"
              type="button"
              onClick={onOpenVoiceModal}
              title="Voice Input (Speech-to-Text with Urdu & English code-switching)"
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-800 transition-colors cursor-pointer"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Main Text Input */}
            <input
              id="chat-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question, request a lab report, analyze a derivation, or command a tool..."
              disabled={isLoading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
            />

            {/* Send Button */}
            <button
              id="chat-send-btn"
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:hover:bg-emerald-700 text-white p-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Powered by Gemini 3.8 Flash • Strict academic grounding enabled</span>
            <span>Press Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
};
