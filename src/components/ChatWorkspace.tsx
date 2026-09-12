import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCw,
  Copy,
  Check,
  Trash2,
  Zap,
  BookOpen,
  Code2,
  HelpCircle,
  Maximize2,
} from 'lucide-react';
import { ChatMessage, Citation, CourseDocument, GeneratedArtifact } from '../types';

interface ChatWorkspaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string, attachedDocIds?: string[]) => void;
  onOpenVoiceModal: () => void;
  onOpenUploadModal: () => void;
  onInspectDocument: (docId: string, pageNumber?: number) => void;
  onOpenArtifactInStudio: (artifact: GeneratedArtifact) => void;
  documents: CourseDocument[];
  strictGrounding: boolean;
  onToggleStrictGrounding: () => void;
  onClearChat: () => void;
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
  strictGrounding,
  onToggleStrictGrounding,
  onClearChat,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim(), selectedDocIds);
    setInputText('');
    setSelectedDocIds([]);
    setShowAttachMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(id);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  const toggleDocSelection = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const samplePrompts = [
    {
      category: 'Algorithms & Derivations',
      icon: Code2,
      text: 'Explain the Red-Black Tree height proof from Lecture 04 with mathematical induction.',
    },
    {
      category: 'Lab Reports',
      icon: FileText,
      text: 'Generate a complete CS-212 lab report for Lab 03 with method, graphs, and conclusion.',
    },
    {
      category: 'Rubric Diagnostic',
      icon: CheckCircle2,
      text: 'Evaluate my assignment draft against the university grading rubric and predict score.',
    },
    {
      category: 'Socratic Brainstorming',
      icon: HelpCircle,
      text: 'Interview me about my Final Year Project idea and convert my answers into an academic proposal.',
    },
    {
      category: 'Lecture Search',
      icon: BookOpen,
      text: 'Find all lecture slides explaining O(log n) rotations and AVL comparisons.',
    },
    {
      category: 'General Assistant',
      icon: Zap,
      text: 'Explain the time complexity of QuickSort best vs worst case with recurrence relations.',
    },
  ];

  return (
    <div id="chat-workspace-container" className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                Academic AI Assistant
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {strictGrounding
                ? 'Strict Course Grounding: Zero-hallucination mode citing slides & syllabus'
                : 'Free Academic Copilot: Open conversational mode with full course corpus awareness'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Strict Grounding Toggle */}
          <button
            id="toggle-strict-grounding-btn"
            type="button"
            onClick={onToggleStrictGrounding}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              strictGrounding
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
            title="Toggle between Strict Zero-Hallucination Grounding and Open Copilot Mode"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${strictGrounding ? 'text-emerald-700' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">
              {strictGrounding ? 'Strict Grounding: ON' : 'Strict Grounding: OFF'}
            </span>
          </button>

          {/* Clear Chat Button */}
          {messages.length > 0 && (
            <button
              id="clear-chat-btn"
              type="button"
              onClick={onClearChat}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all cursor-pointer"
              title="Clear conversation history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          )}
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* Welcome Banner when few messages */}
        {messages.length === 0 && (
          <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-xs mt-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Welcome to ABHOGIPARHAI Academic Copilot
                </h2>
                <p className="text-xs text-slate-500">
                  Assists you like ChatGPT & Gemini — enriched with university lecture slides, syllabus, and instant academic tooling.
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 mb-4 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-1 text-slate-700">
                <p>
                  <strong>How it works:</strong> Ask any academic question, request derivations, synthesize lab reports, or ask for code explanations.
                </p>
                <p className="text-[11px] text-slate-500">
                  Responses are enriched by your indexed course materials ({documents.length} documents indexed) with exact page citations.
                </p>
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Try asking:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {samplePrompts.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSendMessage(item.text)}
                    className="text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-xs text-slate-700 hover:text-emerald-950 transition-all flex items-start justify-between group cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                        <Icon className="w-3 h-3" />
                        <span>{item.category}</span>
                      </div>
                      <p className="line-clamp-2 leading-relaxed text-slate-600 group-hover:text-slate-900">
                        {item.text}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
                  </button>
                );
              })}
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

                    {/* Rich Markdown Formatted Assistant Content */}
                    <div className="markdown-content text-sm leading-relaxed text-slate-800 space-y-3">
                      <Markdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-lg font-black text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-100">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-base font-extrabold text-slate-900 mt-4 mb-1.5 border-b border-slate-100 pb-1">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-sm font-bold text-slate-900 mt-3 mb-1">
                              {children}
                            </h3>
                          ),
                          h4: ({ children }) => (
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mt-2 mb-1">
                              {children}
                            </h4>
                          ),
                          p: ({ children }) => (
                            <p className="leading-relaxed mb-2.5 text-slate-800 last:mb-0">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside space-y-1 my-2 pl-1 text-slate-700">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside space-y-1 my-2 pl-1 text-slate-700">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="leading-relaxed">{children}</li>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-emerald-600 bg-emerald-50/60 pl-3.5 py-2 my-2.5 rounded-r-lg text-emerald-950 text-xs italic">
                              {children}
                            </blockquote>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-3 rounded-lg border border-slate-200">
                              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => (
                            <thead className="bg-slate-100 font-semibold text-slate-800 uppercase text-[10px] tracking-wider">
                              {children}
                            </thead>
                          ),
                          tbody: ({ children }) => (
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {children}
                            </tbody>
                          ),
                          tr: ({ children }) => (
                            <tr className="hover:bg-slate-50/70 transition-colors">{children}</tr>
                          ),
                          th: ({ children }) => (
                            <th className="px-3 py-2 font-bold text-slate-700 border-b border-slate-200">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="px-3 py-2 text-slate-700 border-b border-slate-100">
                              {children}
                            </td>
                          ),
                          hr: () => <hr className="my-4 border-slate-200" />,
                          strong: ({ children }) => (
                            <strong className="font-bold text-slate-950">{children}</strong>
                          ),
                          code: ({ inline, className, children, ...props }: any) => {
                            const codeString = String(children).replace(/\n$/, '');
                            const match = /language-(\w+)/.exec(className || '');
                            const lang = match ? match[1] : '';

                            if (inline) {
                              return (
                                <code
                                  className="px-1.5 py-0.5 bg-slate-100 text-slate-900 rounded font-mono text-xs border border-slate-200"
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            }

                            const codeBlockId = `code-${Math.random().toString(36).substr(2, 9)}`;

                            return (
                              <div className="relative my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 text-slate-100 font-mono text-xs shadow-xs">
                                <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400">
                                  <span className="font-semibold text-emerald-400 uppercase tracking-wider">
                                    {lang || 'code'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyCode(codeString, codeBlockId)}
                                    className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-0.5 rounded transition-colors cursor-pointer"
                                  >
                                    {copiedCodeIdx === codeBlockId ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span className="text-emerald-400">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <pre className="p-3.5 overflow-x-auto text-slate-200 leading-relaxed">
                                  <code>{codeString}</code>
                                </pre>
                              </div>
                            );
                          },
                        }}
                      >
                        {msg.text}
                      </Markdown>
                    </div>

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
                              className="text-left p-2.5 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs text-slate-700 transition-all flex items-start justify-between gap-2 group cursor-pointer"
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
                              {msg.artifact.type.replace('_', ' ').toUpperCase()} • Generated artifact
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

                    {/* Message Actions Bar */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(msg.text, msg.id)}
                        className="flex items-center gap-1 text-slate-400 hover:text-emerald-700 px-2 py-0.5 rounded transition-colors cursor-pointer"
                      >
                        {copiedMsgId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy response</span>
                          </>
                        )}
                      </button>
                    </div>
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
              <span>Synthesizing response with Gemini 3.8 Flash...</span>
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

          <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-emerald-700/20 focus-within:border-emerald-700 transition-all">
            {/* Attachment Dropdown Toggle */}
            <div className="relative">
              <button
                id="chat-attach-btn"
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                title="Attach course document or slides"
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  selectedDocIds.length > 0 || showAttachMenu
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
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
              className="p-2 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-800 transition-colors cursor-pointer"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Auto-expanding Textarea */}
            <textarea
              ref={inputRef}
              id="chat-input"
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything or request lab reports, derivations, code..."
              disabled={isLoading}
              className="flex-1 bg-transparent border-0 resize-none py-1.5 px-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none max-h-32 leading-relaxed"
            />

            {/* Send Button */}
            <button
              id="chat-send-btn"
              type="button"
              onClick={() => handleSubmit()}
              disabled={!inputText.trim() || isLoading}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:hover:bg-emerald-700 text-white p-2.5 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Powered by Gemini 3.8 Flash • Multi-turn academic reasoning</span>
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
};
