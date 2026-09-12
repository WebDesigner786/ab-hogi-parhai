import React, { useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  Send,
  Mic,
  CheckCircle2,
  ListTodo,
  FileCode2,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  BookOpen,
} from 'lucide-react';
import { GeneratedArtifact, SocraticIdeaState, SocraticTurn } from '../types';

interface SocraticViewProps {
  onOpenVoiceModal: () => void;
  onDraftGenerated: (artifact: GeneratedArtifact) => void;
}

export const SocraticView: React.FC<SocraticViewProps> = ({
  onOpenVoiceModal,
  onDraftGenerated,
}) => {
  const [topicInput, setTopicInput] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<SocraticTurn | null>(null);
  const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);
  const [studentAnswerInput, setStudentAnswerInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const [ideaState, setIdeaState] = useState<SocraticIdeaState>({
    topic: '',
    thesis: '',
    arguments: [],
    evidence: [],
    examples: [],
    counterarguments: [],
    conclusion: '',
  });

  const [isReadyForDraft, setIsReadyForDraft] = useState(false);

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicInput.trim() }),
      });
      const data = await res.json();
      if (data.turn) {
        setCurrentTurn({
          id: `turn-1`,
          agentQuestion: data.turn.agentQuestion,
          targetCategory: data.turn.targetCategory || 'thesis',
          status: 'pending',
        });
        setIdeaState(data.state || ideaState);
        setIsSessionActive(true);
        setIsReadyForDraft(!!data.turn.isReadyForDraft);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentAnswerInput.trim() || !currentTurn || isLoading) return;

    const answer = studentAnswerInput.trim();
    setHistory((prev) => [...prev, { question: currentTurn.agentQuestion, answer }]);
    setStudentAnswerInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/interview/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: ideaState.topic || topicInput,
          state: ideaState,
          studentAnswer: answer,
        }),
      });
      const data = await res.json();
      if (data.turn) {
        setCurrentTurn({
          id: `turn-${history.length + 2}`,
          agentQuestion: data.turn.agentQuestion,
          targetCategory: data.turn.targetCategory || 'evidence',
          status: 'pending',
        });
        setIdeaState(data.state || ideaState);
        setIsReadyForDraft(!!data.turn.isReadyForDraft);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSynthesizeDraft = async () => {
    if (isSynthesizing) return;
    setIsSynthesizing(true);
    try {
      const res = await fetch('/api/interview/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: ideaState,
          format: 'formal_academic_essay',
        }),
      });
      const data = await res.json();
      if (data.draft) {
        const newArtifact: GeneratedArtifact = {
          id: `art-socratic-${Date.now()}`,
          title: data.title || `${ideaState.topic} — Synthesized Draft`,
          type: 'assignment_draft',
          content: data.draft,
          createdAt: new Date().toISOString(),
          citations: [],
        };
        onDraftGenerated(newArtifact);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleReset = () => {
    setIsSessionActive(false);
    setTopicInput('');
    setCurrentTurn(null);
    setHistory([]);
    setIdeaState({
      topic: '',
      thesis: '',
      arguments: [],
      evidence: [],
      examples: [],
      counterarguments: [],
      conclusion: '',
    });
    setIsReadyForDraft(false);
  };

  return (
    <div id="socratic-view-container" className="flex-1 p-4 md:p-6 bg-slate-50 overflow-y-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-800">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">
              Socratic "Noted" Interview Agent
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Instead of generating a generic essay, the agent questions you step-by-step to extract your genuine thoughts, evidence, and critical reasoning before structuring your academic draft.
          </p>
        </div>

        {isSessionActive && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Interview</span>
          </button>
        )}
      </div>

      {!isSessionActive ? (
        /* Initial Topic Selection Screen */
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto font-bold shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              What idea or assignment do you want to develop?
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Enter a thesis, research proposal topic, or lab inquiry. The agent will question your logic, demand evidence, and help you structure an authentic academic argument.
            </p>
          </div>

          <form onSubmit={handleStartInterview} className="space-y-3">
            <textarea
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="e.g. Analysis of load balancing algorithms in cloud computing, OR Red-Black Trees vs AVL Trees in high-frequency trading..."
              rows={3}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 resize-none"
            />

            <button
              type="submit"
              disabled={!topicInput.trim() || isLoading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>{isLoading ? 'Starting Interview...' : 'Begin Socratic Interview'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick topic suggestion chips */}
          <div className="pt-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Sample University Ideas:
            </div>
            <div className="space-y-1.5">
              {[
                'Trade-offs of Red-Black Trees vs AVL Trees for worst-case database indexing',
                'Energy-efficient routing protocols for Smart Cities in Pakistan',
                'Design of a distributed fault-tolerant key-value store for NUST SEECS',
              ].map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTopicInput(s)}
                  className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 text-xs text-slate-700 border border-slate-200 hover:border-emerald-200 transition-all cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Active Interview & Idea Board Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Interview Dialogue */}
          <div className="lg:col-span-2 space-y-4">
            {/* Conversation History */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 max-h-[500px] overflow-y-auto shadow-xs">
              {history.map((h, idx) => (
                <div key={idx} className="space-y-2 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800">
                    <span className="font-bold text-emerald-800 block mb-1">
                      Socratic Agent (Q{idx + 1}):
                    </span>
                    {h.question}
                  </div>
                  <div className="bg-emerald-800 text-white p-3 rounded-xl ml-4">
                    <span className="font-semibold text-emerald-200 block mb-1">
                      Your Thought:
                    </span>
                    {h.answer}
                  </div>
                </div>
              ))}

              {/* Current Pending Question */}
              {currentTurn && (
                <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl text-xs space-y-1 shadow-xs">
                  <div className="flex items-center justify-between text-emerald-900 font-bold mb-1">
                    <span>Socratic Agent:</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                      Target: {currentTurn.targetCategory}
                    </span>
                  </div>
                  <p className="text-slate-900 font-medium leading-relaxed">
                    {currentTurn.agentQuestion}
                  </p>
                </div>
              )}
            </div>

            {/* Answer Input */}
            <form onSubmit={handleSendAnswer} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="relative">
                <textarea
                  value={studentAnswerInput}
                  onChange={(e) => setStudentAnswerInput(e.target.value)}
                  placeholder="Articulate your thought, evidence, or counter-perspective..."
                  rows={3}
                  disabled={isLoading}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 resize-none"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onOpenVoiceModal}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Speak Answer</span>
                </button>

                <button
                  type="submit"
                  disabled={!studentAnswerInput.trim() || isLoading}
                  className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>{isLoading ? 'Analyzing...' : 'Submit Response'}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Structured Idea Board & Synthesizer */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <ListTodo className="w-4 h-4 text-emerald-700" />
                  <span>Structured Idea Canvas</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Live sync</span>
              </div>

              {/* Thesis */}
              <div className="text-xs space-y-1">
                <span className="font-bold text-slate-700">Central Thesis:</span>
                <p className="text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 italic">
                  {ideaState.thesis || '(Will be distilled from your answers...)'}
                </p>
              </div>

              {/* Arguments */}
              <div className="text-xs space-y-1">
                <span className="font-bold text-slate-700">Identified Arguments ({ideaState.arguments.length}):</span>
                {ideaState.arguments.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No arguments recorded yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {ideaState.arguments.map((arg, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0 mt-0.5" />
                        <span className="text-slate-700">{arg}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Counterarguments */}
              <div className="text-xs space-y-1">
                <span className="font-bold text-slate-700">Counterarguments & Skepticism:</span>
                {ideaState.counterarguments.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">None logged yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {ideaState.counterarguments.map((ca, idx) => (
                      <li key={idx} className="text-slate-600 bg-amber-50/60 p-1.5 rounded border border-amber-200 text-[11px]">
                        • {ca}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Ready to Synthesize Action */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSynthesizeDraft}
                  disabled={isSynthesizing || (!ideaState.thesis && ideaState.arguments.length === 0)}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <FileCode2 className="w-4 h-4 text-emerald-400" />
                  <span>{isSynthesizing ? 'Synthesizing Academic Draft...' : 'Synthesize Final Draft'}</span>
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-1.5">
                  Generates an editable formal draft based on your recorded answers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
