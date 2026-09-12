import React, { useState } from 'react';
import {
  FileCheck2,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  RotateCw,
  Sparkles,
  Quote,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { RubricEvaluationReport } from '../types';

export const RubricView: React.FC = () => {
  const [rubricText, setRubricText] = useState('');
  const [draftText, setDraftText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [report, setReport] = useState<RubricEvaluationReport | null>(null);

  const sampleRubric = `NUST SEECS Department of Computer Science
Assignment Grading Rubric (Total: 100 Points)

Criterion 1: Theoretical Foundation & Problem Formulation (25 Points)
- Clear problem definition and scope
- Formal mathematical notation and asymptotic bounds
- Grounding in course lecture principles

Criterion 2: Algorithm Analysis & Mathematical Rigor (35 Points)
- Invariant proof for Red-Black Tree height bound
- Accurate time/space complexity analysis
- Rotational properties and color balance invariants explained

Criterion 3: Experimental Benchmarking & Code Architecture (25 Points)
- Comparative empirical metrics (Random vs Sorted keys)
- Clean code architecture with sentinel leaves
- Graphical height verification

Criterion 4: Scholarly Writing & Citations (15 Points)
- Standard IEEE citation format
- Clear section headings and executive abstract
- Absence of unverified speculative claims`;

  const sampleDraft = `Title: Asymptotic Evaluation and Implementation Analysis of Red-Black Trees
Course: CS-212 Data Structures & Algorithms
Author: Student 123456, NUST SEECS

1. Abstract & Objective
In this laboratory investigation, we analyze the performance of self-balancing binary search trees, specifically Red-Black Trees, to evaluate their guaranteed logarithmic bounds against degenerated BSTs.

2. Theoretical Foundation & Properties
A Red-Black Tree enforces five fundamental structural properties:
1. Every node is colored red or black.
2. The root node is black.
3. Every leaf sentinel NIL is black.
4. If a node is red, both its children are black.
5. Every path from a given node to its descendant leaves contains the same number of black nodes (black-height).

3. Algorithm Complexity & Lemma
Search, insertion, and deletion operate in O(log n) worst-case time because tree height is strictly bounded by h <= 2 * floor(log2(n+1)). Tree balance is maintained using Left-Rotate and Right-Rotate in O(1) pointer updates.

4. Experimental Results
Benchmarking 1,000,000 random vs sequential integers showed that standard BST height grew linearly to 100,000+ under sorted input, whereas Red-Black Tree height remained bounded at 26 levels.

5. References
[1] Cormen, Leiserson, Rivest, Stein. Introduction to Algorithms, 4th Edition. MIT Press.`;

  const handlePreloadSample = () => {
    setRubricText(sampleRubric);
    setDraftText(sampleDraft);
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rubricText.trim() || !draftText.trim() || isEvaluating) return;

    setIsEvaluating(true);
    try {
      const res = await fetch('/api/rubric/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rubricText: rubricText.trim(),
          draftText: draftText.trim(),
        }),
      });
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div id="rubric-view-container" className="flex-1 p-4 md:p-6 bg-slate-50 overflow-y-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-800">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">
              Predictive Rubric Grading Engine
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Audit your assignment against actual university grading rubrics. The engine extracts criteria, assesses draft evidence, estimates score ranges, and pinpoints missing requirements.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePreloadSample}
          className="flex items-center gap-1.5 text-xs text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-700" />
          <span>Preload NUST Rubric & Draft</span>
        </button>
      </div>

      {/* Input Grid: Rubric + Draft */}
      <form onSubmit={handleEvaluate} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Rubric Input */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                1. University Grading Rubric
              </span>
              <span className="text-[11px] text-slate-400">Paste criteria & points</span>
            </div>
            <textarea
              value={rubricText}
              onChange={(e) => setRubricText(e.target.value)}
              placeholder="Paste rubric criteria with point breakdown (e.g., Criterion 1: Theory (25 pts)...)..."
              rows={9}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-700/20 focus:border-purple-700 resize-none font-mono"
            />
          </div>

          {/* Student Draft Input */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                2. Your Assignment / Report Draft
              </span>
              <span className="text-[11px] text-slate-400">Paste text to audit</span>
            </div>
            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder="Paste your assignment draft, lab report text, or essay..."
              rows={9}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-700/20 focus:border-purple-700 resize-none font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!rubricText.trim() || !draftText.trim() || isEvaluating}
          className="w-full bg-purple-900 hover:bg-purple-950 disabled:opacity-40 text-white text-xs font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          {isEvaluating ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" />
              <span>Evaluating Rubric Criteria & Evidence...</span>
            </>
          ) : (
            <>
              <span>Run Diagnostic Rubric Evaluation</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Evaluation Diagnostic Report */}
      {report && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          {/* Header Score Card */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">{report.rubricTitle}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{report.summary}</p>
            </div>

            <div className="flex items-center gap-4 bg-purple-50 px-4 py-2.5 rounded-xl border border-purple-200">
              <div className="text-right">
                <div className="text-xs text-purple-900 font-semibold">Predicted Score:</div>
                <div className="text-xl font-black text-purple-950">
                  {report.totalPredictedScore} / {report.totalMaxPoints}
                </div>
              </div>
              <div className="h-8 w-px bg-purple-200" />
              <div>
                <div className="text-xs text-purple-900 font-semibold">Confidence:</div>
                <div className="text-sm font-extrabold text-purple-900">
                  {Math.round(report.overallConfidence * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Criteria Breakdown Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Criterion-by-Criterion Diagnosis
            </h3>

            <div className="space-y-4">
              {report.criteriaResults.map((crit, idx) => {
                const scorePercent = Math.round((crit.predictedScore / crit.maxPoints) * 100);
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span>{crit.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-purple-900">
                          {crit.predictedScore} / {crit.maxPoints} pts ({scorePercent}%)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                          Confidence: {Math.round(crit.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-800 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, scorePercent)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Strengths */}
                      <div className="space-y-1">
                        <span className="font-bold text-emerald-800 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Demonstrated Strengths:</span>
                        </span>
                        <ul className="space-y-0.5 text-slate-700 pl-4 list-disc">
                          {crit.strengths.map((s, sIdx) => (
                            <li key={sIdx}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Missing Requirements */}
                      <div className="space-y-1">
                        <span className="font-bold text-amber-800 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                          <span>Missing / Weak Requirements:</span>
                        </span>
                        {crit.missingRequirements.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">None detected.</p>
                        ) : (
                          <ul className="space-y-0.5 text-slate-700 pl-4 list-disc">
                            {crit.missingRequirements.map((m, mIdx) => (
                              <li key={mIdx}>{m}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Direct Evidence Quotes */}
                    {crit.evidenceQuotes.length > 0 && (
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-600">
                        <span className="font-semibold text-slate-700 block mb-1">
                          Evidence Extracted from Draft:
                        </span>
                        {crit.evidenceQuotes.map((q, qIdx) => (
                          <p key={qIdx} className="italic text-[11px] text-slate-500">
                            {q}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Actionable Recommendations */}
                    {crit.actionableRecommendations.length > 0 && (
                      <div className="bg-purple-50/70 p-2.5 rounded-lg border border-purple-200 text-xs text-purple-950">
                        <span className="font-bold text-purple-900 block mb-0.5">
                          Actionable Improvement:
                        </span>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {crit.actionableRecommendations.map((r, rIdx) => (
                            <li key={rIdx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>{report.disclaimer}</span>
          </div>
        </div>
      )}
    </div>
  );
};
