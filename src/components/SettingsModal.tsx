import React from 'react';
import { X, ShieldCheck, Trash2, School, Cpu, CheckCircle2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  university: string;
  onSelectUniversity: (uni: string) => void;
  strictGrounding: boolean;
  onToggleStrictGrounding: () => void;
  onClearCorpus: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  university,
  onSelectUniversity,
  strictGrounding,
  onToggleStrictGrounding,
  onClearCorpus,
}) => {
  const [confirmReset, setConfirmReset] = React.useState(false);

  if (!isOpen) return null;

  const universities = [
    'NUST Islamabad',
    'FAST-NUCES',
    'LUMS Lahore',
    'GIKI Swabi',
    'COMSATS University',
    'UET Lahore',
    'NED University Karachi',
    'Quaid-i-Azam University',
    'PIEAS Islamabad',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Workspace Settings & Integrity</h2>
              <p className="text-[11px] text-slate-500">
                Academic preferences, model status & security controls.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* University Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <School className="w-4 h-4 text-emerald-700" />
            <span>Target University / Institution</span>
          </label>
          <select
            value={university}
            onChange={(e) => onSelectUniversity(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
          >
            {universities.map((uni) => (
              <option key={uni} value={uni}>
                {uni}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400">
            Adapts document headers, rubric weights, and citation format to institutional standards.
          </p>
        </div>

        {/* Strict Grounding Toggle */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-800">Strict Academic Grounding Mode</div>
            <div className="text-[11px] text-slate-500">
              Disallow speculative answers if source proof is absent in your corpus.
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleStrictGrounding}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              strictGrounding ? 'bg-emerald-700' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                strictGrounding ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Model Architecture Info */}
        <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-950">
            <Cpu className="w-4 h-4 text-emerald-700" />
            <span>Gemini 3.8 Flash Server-Side Architecture</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            All AI queries run strictly server-side through protected `/api/*` routes. Your API keys are never leaked to the client browser.
          </p>
        </div>

        {/* Clear Corpus Action */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-800">Reset Workspace Corpus</div>
            <div className="text-[11px] text-slate-400">Remove uploaded documents and chat history</div>
          </div>
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClearCorpus();
                  setConfirmReset(false);
                  onClose();
                }}
                className="text-xs text-white font-semibold bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="text-xs text-slate-600 hover:bg-slate-100 px-2 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-semibold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
