import React from 'react';
import {
  GraduationCap,
  ShieldCheck,
  Sparkles,
  BookOpen,
  RotateCcw,
  Settings,
  Flame,
} from 'lucide-react';
import { Course, University, AuthUser } from '../types';

interface HeaderProps {
  university: University;
  onUniversityChange: (uni: University) => void;
  courses: Course[];
  selectedCourseId: string;
  onCourseChange: (courseId: string) => void;
  strictCorpusOnly: boolean;
  onToggleStrictCorpus: () => void;
  onResetSession: () => void;
  onOpenSettings: () => void;
  hasApiKey: boolean;
  currentUser?: AuthUser;
  onOpenUserDashboard?: () => void;
  onOpenAdminHub?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  university,
  onUniversityChange,
  courses,
  selectedCourseId,
  onCourseChange,
  strictCorpusOnly,
  onToggleStrictCorpus,
  onResetSession,
  onOpenSettings,
  hasApiKey,
  currentUser,
  onOpenUserDashboard,
  onOpenAdminHub,
}) => {
  const universities: University[] = ['NUST', 'FAST', 'GIKI', 'COMSATS', 'LUMS', 'UET', 'Other'];

  return (
    <header
      id="app-header"
      className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 shadow-xs"
    >
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-800 to-teal-600 flex items-center justify-center text-white shadow-sm ring-1 ring-emerald-900/10">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 tracking-tight text-lg">
              ABHOGI<span className="text-emerald-700">PARHAI</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
              Academic AI
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium hidden sm:block">
            Grounded Workspace for Pakistani Universities
          </p>
        </div>
      </div>

      {/* Course Context & Grounding Controls */}
      <div className="flex items-center flex-wrap gap-2 text-sm">
        {/* University Selector */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
          <span className="text-xs font-semibold text-slate-600 mr-1.5 hidden md:inline">Uni:</span>
          <select
            id="university-selector"
            value={university}
            onChange={(e) => onUniversityChange(e.target.value as University)}
            className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
          >
            {universities.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        {/* Course Filter Dropdown */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
          <BookOpen className="w-3.5 h-3.5 text-emerald-700 mr-1.5" />
          <select
            id="course-selector"
            value={selectedCourseId}
            onChange={(e) => onCourseChange(e.target.value)}
            className="text-xs font-medium text-slate-800 bg-transparent focus:outline-none max-w-[170px] truncate cursor-pointer"
          >
            <option value="">All Course Documents</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.title.split('(')[0]}
              </option>
            ))}
          </select>
        </div>

        {/* Strict Corpus Toggle */}
        <button
          id="strict-corpus-toggle"
          type="button"
          onClick={onToggleStrictCorpus}
          title={
            strictCorpusOnly
              ? 'Strict Mode ON: AI will only answer with verified evidence from your uploaded course slides/notes.'
              : 'Strict Mode OFF: External academic general knowledge permitted.'
          }
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
            strictCorpusOnly
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck
            className={`w-3.5 h-3.5 ${strictCorpusOnly ? 'text-emerald-700' : 'text-slate-400'}`}
          />
          <span className="hidden sm:inline">Strict Grounding:</span>
          <span>{strictCorpusOnly ? 'Strict ON' : 'Off'}</span>
        </button>

        {/* Gemini API Status Pill */}
        <div
          title={hasApiKey ? 'Gemini 3.8 Flash Server Active' : 'API Key will be loaded from environment'}
          className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="hidden lg:inline text-[11px]">Gemini AI</span>
        </div>

        {/* User Account / Persona Pill */}
        {currentUser && (
          <button
            id="header-user-persona-btn"
            type="button"
            onClick={onOpenUserDashboard}
            title={`Logged in as ${currentUser.name} (${currentUser.role}). Click to view dashboard.`}
            className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs transition-all cursor-pointer"
          >
            <div className="w-5 h-5 rounded-md bg-emerald-700 text-white font-bold text-[10px] flex items-center justify-center">
              {currentUser.name[0]}
            </div>
            <span className="font-semibold text-slate-800 hidden md:inline truncate max-w-[100px]">
              {currentUser.name.split(' ')[0]}
            </span>
            <span
              className={`text-[9px] uppercase px-1 py-0.2 rounded font-extrabold ${
                currentUser.role === 'superadmin'
                  ? 'bg-slate-900 text-white'
                  : currentUser.role === 'professor'
                  ? 'bg-purple-100 text-purple-800'
                  : currentUser.role === 'ta'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {currentUser.role}
            </span>
          </button>
        )}

        {/* Reset Session */}
        <button
          id="reset-session-btn"
          type="button"
          onClick={onResetSession}
          title="Start a fresh conversation"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Settings & Privacy */}
        <button
          id="settings-btn"
          type="button"
          onClick={onOpenSettings}
          title="Privacy & Settings"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
