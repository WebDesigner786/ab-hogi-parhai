import React, { useState } from 'react';
import {
  User,
  Shield,
  Bell,
  Lock,
  KeyRound,
  Mail,
  Building,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sliders,
  Globe,
  Smartphone,
} from 'lucide-react';
import { AuthUser, University } from '../types';

interface UserDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  onUpdateProfile: (updates: Partial<AuthUser>) => void;
  allUsers: AuthUser[];
  onSwitchUser: (userId: string) => void;
  onOpenAdminHub: () => void;
}

export const UserDashboardModal: React.FC<UserDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  allUsers,
  onSwitchUser,
  onOpenAdminHub,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'sessions'>('profile');
  const [name, setName] = useState(currentUser.name);
  const [department, setDepartment] = useState(currentUser.department);
  const [studentId, setStudentId] = useState(currentUser.studentId);
  const [twoFactor, setTwoFactor] = useState(currentUser.twoFactorEnabled);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Notification preferences state
  const [notifyRubric, setNotifyRubric] = useState(true);
  const [notifyQuota, setNotifyQuota] = useState(true);
  const [notifyAnnouncements, setNotifyAnnouncements] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          department: department.trim(),
          studentId: studentId.trim(),
          twoFactorEnabled: twoFactor,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        onUpdateProfile(data.user);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
        {/* Modal Header with Profile Avatar */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-700 flex items-center justify-center font-black text-lg text-white ring-2 ring-white/20">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">{currentUser.name}</h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono">{currentUser.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors text-lg"
          >
            ×
          </button>
        </div>

        {/* Modal Tabs Bar */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-200 bg-slate-50 text-xs">
          {[
            { id: 'profile', label: 'Profile & Identity', icon: User },
            { id: 'security', label: 'SSO & 2FA Security', icon: Shield },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'sessions', label: 'Switch Persona', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'border-emerald-700 text-emerald-800 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Account profile changes saved successfully.</span>
            </div>
          )}

          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-700 font-medium text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Enrollment / Employee ID</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-700 font-medium font-mono text-slate-900"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-700 block">Department / School</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-700 font-medium text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">University Campus</label>
                  <input
                    type="text"
                    value={currentUser.university}
                    disabled
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Assigned Role</label>
                  <input
                    type="text"
                    value={currentUser.role.toUpperCase()}
                    disabled
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-bold uppercase cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onOpenAdminHub}
                  className="text-xs text-emerald-800 font-semibold hover:underline"
                >
                  Open Institutional Admin Center →
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Save Profile Settings
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-slate-900">Two-Factor Authentication (2FA)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={twoFactor}
                    onChange={(e) => setTwoFactor(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-700 cursor-pointer"
                  />
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Requires TOTP authenticator code or SMS OTP when accessing high-risk academic tools and grading rubrics.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Federated SSO Provider</span>
                  <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                    Connected
                  </span>
                </div>
                <div className="text-slate-600 text-xs">
                  Logged in through <strong>{currentUser.ssoProvider || 'Google Workspace'}</strong> for Pakistani Higher Education.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">Session Management</span>
                <p className="text-slate-500 text-[11px]">
                  Revoke all active browser sessions across campus library terminals.
                </p>
                <button
                  type="button"
                  onClick={() => alert('All other academic sessions have been revoked.')}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg text-xs cursor-pointer"
                >
                  Revoke Other Sessions
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Rubric Evaluation Complete</span>
                  <span className="text-[11px] text-slate-500">
                    Send an email when a diagnostic report completes.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyRubric}
                  onChange={(e) => setNotifyRubric(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-700 cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Usage Quota Threshold Alerts</span>
                  <span className="text-[11px] text-slate-500">
                    Notify when token or RAG query consumption reaches 80% of tier limit.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyQuota}
                  onChange={(e) => setNotifyQuota(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-700 cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Campus Announcements</span>
                  <span className="text-[11px] text-slate-500">
                    Departmental exam schedule and syllabus updates.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyAnnouncements}
                  onChange={(e) => setNotifyAnnouncements(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-700 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 4: SWITCH PERSONA */}
          {activeTab === 'sessions' && (
            <div className="space-y-3">
              <p className="text-slate-500 text-xs">
                Switch your active session persona to test role permissions, grading diagnostics, and administrator capabilities:
              </p>
              <div className="space-y-2">
                {allUsers.map((u) => {
                  const isActive = currentUser.id === u.id;
                  return (
                    <div
                      key={u.id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        isActive
                          ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-500/20'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                          {u.name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{u.name}</span>
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-extrabold bg-slate-200 text-slate-800">
                              {u.role}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">{u.email}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSwitchUser(u.id);
                          onClose();
                        }}
                        disabled={isActive}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-emerald-800 text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {isActive ? 'Current Session' : 'Switch Persona'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
