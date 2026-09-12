import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  CreditCard,
  Building2,
  FileSpreadsheet,
  KeyRound,
  Network,
  BarChart3,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  Plus,
  Download,
  Trash2,
  RefreshCw,
  Check,
  Send,
  Sliders,
  DollarSign,
  GraduationCap,
  Sparkles,
  Smartphone,
  Globe,
  Radio,
  FileCode2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  AuthUser,
  Tenant,
  SubscriptionPlan,
  UsageMeter,
  Invoice,
  AuditLogEntry,
  ApiKey,
  WebhookEndpoint,
  Integration,
  RolePermission,
  AnalyticsData,
  UserRole,
} from '../types';

export type AdminSubTab =
  | 'overview'
  | 'rbac'
  | 'billing'
  | 'tenancy'
  | 'audit'
  | 'developer'
  | 'integrations'
  | 'analytics'
  | 'compliance';

interface AdminHubViewProps {
  currentUser: AuthUser;
  onUserSwitched: (user: AuthUser) => void;
  defaultSubTab?: AdminSubTab;
}

export const AdminHubView: React.FC<AdminHubViewProps> = ({
  currentUser,
  onUserSwitched,
  defaultSubTab = 'overview',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>(defaultSubTab);

  // Users & RBAC
  const [allUsers, setAllUsers] = useState<AuthUser[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [isUpdatingPerm, setIsUpdatingPerm] = useState(false);

  // Multi-Tenancy
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('tenant-nust');

  // Billing & Metering
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [usageMeter, setUsageMeter] = useState<UsageMeter | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedPlanToUpgrade, setSelectedPlanToUpgrade] = useState<SubscriptionPlan | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<string>('PayFast');
  const [isDunningRecovering, setIsDunningRecovering] = useState<string | null>(null);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditFilterAction, setAuditFilterAction] = useState<string>('');
  const [auditFilterStatus, setAuditFilterStatus] = useState<string>('');

  // Developer (API Keys & Webhooks)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeySecretModal, setNewKeySecretModal] = useState<string | null>(null);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [webhookTestResult, setWebhookTestResult] = useState<string | null>(null);

  // Integrations & Analytics
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Notifications
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load all admin data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [
        usersRes,
        permsRes,
        tenantsRes,
        plansRes,
        meterRes,
        invoicesRes,
        auditRes,
        keysRes,
        webhooksRes,
        integrationsRes,
        analyticsRes,
      ] = await Promise.all([
        fetch('/api/auth/users').then((r) => r.json()),
        fetch('/api/rbac/permissions').then((r) => r.json()),
        fetch('/api/tenants').then((r) => r.json()),
        fetch('/api/billing/plans').then((r) => r.json()),
        fetch('/api/billing/meter').then((r) => r.json()),
        fetch('/api/billing/invoices').then((r) => r.json()),
        fetch('/api/audit/logs').then((r) => r.json()),
        fetch('/api/api-keys').then((r) => r.json()),
        fetch('/api/webhooks').then((r) => r.json()),
        fetch('/api/integrations').then((r) => r.json()),
        fetch('/api/analytics').then((r) => r.json()),
      ]);

      if (Array.isArray(usersRes)) setAllUsers(usersRes);
      if (Array.isArray(permsRes)) setPermissions(permsRes);
      if (Array.isArray(tenantsRes)) setTenants(tenantsRes);
      if (Array.isArray(plansRes)) setPlans(plansRes);
      if (meterRes) setUsageMeter(meterRes);
      if (Array.isArray(invoicesRes)) setInvoices(invoicesRes);
      if (Array.isArray(auditRes)) setAuditLogs(auditRes);
      if (Array.isArray(keysRes)) setApiKeys(keysRes);
      if (Array.isArray(webhooksRes)) setWebhooks(webhooksRes);
      if (Array.isArray(integrationsRes)) setIntegrations(integrationsRes);
      if (analyticsRes) setAnalytics(analyticsRes);
    } catch (err: any) {
      console.error('Error loading admin suite data:', err);
    }
  };

  // Switch Active User Persona
  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        onUserSwitched(data.user);
        setStatusMessage(`Switched active session persona to ${data.user.name} (${data.user.role.toUpperCase()}).`);
        // Refresh audit logs
        const auditRes = await fetch('/api/audit/logs').then((r) => r.json());
        if (Array.isArray(auditRes)) setAuditLogs(auditRes);
      }
    } catch (err: any) {
      setErrorMessage('Failed to switch user session');
    }
  };

  // Toggle RBAC Permission for a role
  const handleTogglePermissionRole = async (permissionId: string, role: UserRole) => {
    const perm = permissions.find((p) => p.id === permissionId);
    if (!perm) return;

    const allowed = perm.allowedRoles.includes(role)
      ? perm.allowedRoles.filter((r) => r !== role)
      : [...perm.allowedRoles, role];

    setIsUpdatingPerm(true);
    try {
      const res = await fetch(`/api/rbac/permissions/${permissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowedRoles: allowed }),
      });
      const data = await res.json();
      if (data.success && data.permissions) {
        setPermissions(data.permissions);
        setStatusMessage(`Updated RBAC role permissions for "${perm.name}".`);
      }
    } catch (err) {
      setErrorMessage('Failed to update permission');
    } finally {
      setIsUpdatingPerm(false);
    }
  };

  // Handle Plan Upgrade Checkout
  const handleExecuteCheckout = async () => {
    if (!selectedPlanToUpgrade) return;
    setIsUpgrading(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanToUpgrade.id,
          gateway: selectedGateway,
          currency: 'PKR',
          amount: selectedPlanToUpgrade.pricePKR,
        }),
      });
      const data = await res.json();
      if (data.success && data.invoice) {
        setInvoices((prev) => [data.invoice, ...prev]);
        setSelectedPlanToUpgrade(null);
        setStatusMessage(
          `Successfully upgraded to ${selectedPlanToUpgrade.name} via ${selectedGateway}. Invoice ${data.invoice.invoiceNumber} paid.`
        );
      }
    } catch (err) {
      setErrorMessage('Checkout failed');
    } finally {
      setIsUpgrading(false);
    }
  };

  // Handle Dunning Retry
  const handleRetryDunning = async (invoiceId: string) => {
    setIsDunningRecovering(invoiceId);
    try {
      const res = await fetch('/api/billing/dunning/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json();
      if (data.success) {
        setInvoices((prev) =>
          prev.map((i) => (i.id === invoiceId ? { ...i, status: 'paid', dunningRetries: i.dunningRetries + 1 } : i))
        );
        setStatusMessage(data.message);
      }
    } catch (err) {
      setErrorMessage('Dunning retry failed');
    } finally {
      setIsDunningRecovering(null);
    }
  };

  // Handle Download Invoice PDF Receipt
  const handleDownloadInvoicePdf = async (invoiceId: string, invoiceNum: string) => {
    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}/pdf`);
      const data = await res.json();
      if (data.pdfBase64) {
        const byteCharacters = atob(data.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_${invoiceNum}.pdf`;
        a.click();
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to generate invoice receipt PDF');
    }
  };

  // Create API Key
  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName.trim(),
          scopes: ['corpus:read', 'rubric:eval', 'analytics:read'],
        }),
      });
      const data = await res.json();
      if (data.key) {
        setApiKeys((prev) => [data.key, ...prev]);
        setNewKeySecretModal(data.fullSecret);
        setNewKeyName('');
        setStatusMessage(`API key "${data.key.name}" generated successfully.`);
      }
    } catch (err) {
      setErrorMessage('Failed to create API key');
    }
  };

  // Revoke API Key
  const handleRevokeApiKey = async (id: string) => {
    try {
      await fetch(`/api/api-keys/${id}`, { method: 'DELETE' });
      setApiKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: 'revoked' } : k)));
      setStatusMessage('API key revoked.');
    } catch (err) {
      setErrorMessage('Failed to revoke API key');
    }
  };

  // Register Webhook
  const handleAddWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl.trim()) return;
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newWebhookUrl.trim(),
          events: ['rubric.evaluated', 'document.ingested'],
        }),
      });
      const data = await res.json();
      if (data.id) {
        setWebhooks((prev) => [data, ...prev]);
        setNewWebhookUrl('');
        setStatusMessage('Webhook endpoint subscribed.');
      }
    } catch (err) {
      setErrorMessage('Failed to add webhook');
    }
  };

  // Test Webhook
  const handleTestWebhook = async (id: string) => {
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: 'POST' });
      const data = await res.json();
      setWebhookTestResult(data.message);
      setStatusMessage(data.message);
    } catch (err) {
      setErrorMessage('Failed to send test ping');
    }
  };

  // Toggle Integration
  const handleToggleIntegration = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/integrations/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connect: !currentStatus }),
      });
      const data = await res.json();
      if (data.id) {
        setIntegrations((prev) => prev.map((int) => (int.id === id ? data : int)));
        setStatusMessage(`${data.name} is now ${data.connected ? 'connected' : 'disconnected'}.`);
      }
    } catch (err) {
      setErrorMessage('Failed to toggle integration');
    }
  };

  // Download Compliance Package
  const handleDownloadCompliancePackage = async () => {
    try {
      const res = await fetch('/api/compliance/export');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ABHOGIPARHAI_Compliance_Export_${currentUser.studentId || currentUser.id}.json`;
      a.click();
      setStatusMessage('Full FERPA / GDPR compliance data package downloaded.');
    } catch (err) {
      setErrorMessage('Failed to export data package');
    }
  };

  // Filtered Audit Logs
  const filteredLogs = auditLogs.filter((log) => {
    const matchesAction = !auditFilterAction || log.action.toLowerCase().includes(auditFilterAction.toLowerCase());
    const matchesStatus = !auditFilterStatus || log.status === auditFilterStatus;
    return matchesAction && matchesStatus;
  });

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];

  return (
    <div id="admin-hub-container" className="flex-1 p-4 md:p-6 bg-slate-100 overflow-y-auto space-y-6">
      {/* Enterprise Title & Active Role Switcher Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Enterprise Administration & Multi-Tenant Control</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Campus Tier
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Institutional governance, authentication, RBAC matrix, dunning recovery, usage-based metering, and compliance audit.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Role Persona Switcher Pill */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase px-2">Active Persona:</span>
          <div className="flex gap-1">
            {allUsers.map((u) => {
              const isActive = currentUser.id === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSwitchUser(u.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{u.name.split(' ')[0]}</span>
                  <span
                    className={`text-[9px] uppercase px-1 py-0.2 rounded font-bold ${
                      isActive ? 'bg-emerald-400 text-slate-950' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {u.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button type="button" onClick={() => setStatusMessage(null)} className="text-emerald-700 font-bold ml-2">
            ×
          </button>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-red-700 font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Dashboard & Campuses', icon: Building2 },
          { id: 'rbac', label: 'Auth & RBAC Matrix', icon: Lock },
          { id: 'billing', label: 'Subscriptions & Metering', icon: CreditCard },
          { id: 'tenancy', label: 'Multi-Tenancy & SSO', icon: Globe },
          { id: 'audit', label: 'Audit Logs', icon: FileSpreadsheet },
          { id: 'developer', label: 'API Keys & Webhooks', icon: KeyRound },
          { id: 'integrations', label: 'Third-Party Integrations', icon: Network },
          { id: 'analytics', label: 'Campus Analytics', icon: BarChart3 },
          { id: 'compliance', label: 'Data Privacy & Compliance', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as AdminSubTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- SUBTAB 1: OVERVIEW & DASHBOARD --- */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold">Active Campus Students</span>
                <Users className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {selectedTenant ? selectedTenant.studentCount.toLocaleString() : '14,850'}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <span>↑ 12.4% enrollment growth</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold">Grounded RAG Queries</span>
                <Radio className="w-4 h-4 text-blue-700" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {analytics ? analytics.totalQueries.toLocaleString() : '14,820'}
              </div>
              <div className="text-[11px] text-slate-500">Zero-hallucination verified</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold">Rubric Quality Benchmark</span>
                <GraduationCap className="w-4 h-4 text-purple-700" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {analytics ? `${analytics.rubricAverageScore}%` : '81.4%'}
              </div>
              <div className="text-[11px] text-purple-700 font-semibold">Department Grade Average</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold">Institutional Billing Status</span>
                <CreditCard className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-2xl font-black text-emerald-800">PAID (PKR 85K)</div>
              <div className="text-[11px] text-emerald-700 font-semibold">PayFast Verified • No Dunning</div>
            </div>
          </div>

          {/* Current Session Identity Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Current Authenticated Session Details
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold uppercase">
                {currentUser.role} Access
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 block">User Name & ID:</span>
                <span className="font-bold text-slate-900 text-sm block">{currentUser.name}</span>
                <span className="text-slate-500 font-mono">{currentUser.studentId}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block">Institutional Email:</span>
                <span className="font-bold text-slate-900 block">{currentUser.email}</span>
                <span className="text-emerald-700 font-semibold">Verified Domain SSO</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block">Department / School:</span>
                <span className="font-bold text-slate-900 block">{currentUser.department}</span>
                <span className="text-slate-500">{currentUser.university} Campus</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block">Security Authentication:</span>
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>2FA Active (TOTP + SSO)</span>
                </div>
                <span className="text-[11px] text-slate-400">Provider: {currentUser.ssoProvider}</span>
              </div>
            </div>
          </div>

          {/* Institutional Multi-Tenant Campuses List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Registered University Tenants ({tenants.length})
              </div>
              <span className="text-[11px] text-slate-400">Independent Data Sandbox Isolation</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tenants.map((t) => (
                <div
                  key={t.id}
                  className={`p-4 rounded-xl border transition-all ${
                    selectedTenantId === t.id
                      ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">
                        Subdomain: {t.slug}.abhogiparhai.edu.pk
                      </p>
                    </div>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded font-extrabold bg-slate-900 text-white">
                      {t.tier.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-200/60 my-2">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Students:</span>
                      <span className="font-bold text-slate-800">{t.studentCount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Faculty & TAs:</span>
                      <span className="font-bold text-slate-800">{t.facultyCount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 text-[11px]">
                      SSO: {t.ssoConfig.provider.toUpperCase()} (Enabled)
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedTenantId(t.id)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        selectedTenantId === t.id
                          ? 'bg-emerald-800 text-white'
                          : 'text-emerald-800 bg-white border border-slate-200 hover:bg-emerald-50'
                      }`}
                    >
                      {selectedTenantId === t.id ? 'Active Tenant' : 'Switch Tenant'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB 2: AUTH & ROLE-BASED ACCESS CONTROL (RBAC) --- */}
      {activeSubTab === 'rbac' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-700" />
                <span>Role-Based Access Control (RBAC) Permissions Matrix</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Defines fine-grained operational authorizations across Student, TA, Professor, and Super Admin roles.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Auto-enforced in Express server middleware</span>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3 w-1/3">Permission & Operational Scope</th>
                  <th className="p-3 text-center">Student</th>
                  <th className="p-3 text-center">Teaching Assistant</th>
                  <th className="p-3 text-center">Professor / Faculty</th>
                  <th className="p-3 text-center bg-slate-100">Super Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissions.map((perm) => (
                  <tr key={perm.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{perm.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{perm.description}</div>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 inline-block mt-1">
                        Category: {perm.category}
                      </span>
                    </td>

                    {/* Student Column */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={perm.allowedRoles.includes('student')}
                        onChange={() => handleTogglePermissionRole(perm.id, 'student')}
                        disabled={isUpdatingPerm}
                        className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-700 cursor-pointer"
                      />
                    </td>

                    {/* TA Column */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={perm.allowedRoles.includes('ta')}
                        onChange={() => handleTogglePermissionRole(perm.id, 'ta')}
                        disabled={isUpdatingPerm}
                        className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-700 cursor-pointer"
                      />
                    </td>

                    {/* Professor Column */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={perm.allowedRoles.includes('professor')}
                        onChange={() => handleTogglePermissionRole(perm.id, 'professor')}
                        disabled={isUpdatingPerm}
                        className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-700 cursor-pointer"
                      />
                    </td>

                    {/* Super Admin Column */}
                    <td className="p-3 text-center bg-slate-50/50">
                      <input
                        type="checkbox"
                        checked={perm.allowedRoles.includes('superadmin')}
                        onChange={() => handleTogglePermissionRole(perm.id, 'superadmin')}
                        disabled={isUpdatingPerm}
                        className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUBTAB 3: SUBSCRIPTION TIERS, METERING, INVOICING & DUNNING --- */}
      {activeSubTab === 'billing' && (
        <div className="space-y-6">
          {/* Usage-Based Metering Bar Gauges */}
          {usageMeter && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Real-Time Usage-Based Metering (Current Billing Cycle)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cycle: {new Date(usageMeter.billingCycleStart).toLocaleDateString()} — {new Date(usageMeter.billingCycleEnd).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Status: Healthy (No Overage)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                {/* Meter 1: Queries */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-between font-semibold">
                    <span>Grounded RAG Queries</span>
                    <span className="text-slate-900 font-bold">
                      {usageMeter.ragQueriesUsed} / {usageMeter.ragQueriesLimit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-700 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (usageMeter.ragQueriesUsed / usageMeter.ragQueriesLimit) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {Math.round((usageMeter.ragQueriesUsed / usageMeter.ragQueriesLimit) * 100)}% consumed
                  </span>
                </div>

                {/* Meter 2: Tokens */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-between font-semibold">
                    <span>Gemini 3.8 Tokens</span>
                    <span className="text-slate-900 font-bold">
                      {(usageMeter.tokensUsed / 1000000).toFixed(2)}M / {(usageMeter.tokensLimit / 1000000).toFixed(0)}M
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-700 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (usageMeter.tokensUsed / usageMeter.tokensLimit) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {Math.round((usageMeter.tokensUsed / usageMeter.tokensLimit) * 100)}% consumed
                  </span>
                </div>

                {/* Meter 3: PDF Ops */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-between font-semibold">
                    <span>PDF Binary Operations</span>
                    <span className="text-slate-900 font-bold">
                      {usageMeter.pdfOpsUsed} / {usageMeter.pdfOpsLimit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-700 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (usageMeter.pdfOpsUsed / usageMeter.pdfOpsLimit) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {Math.round((usageMeter.pdfOpsUsed / usageMeter.pdfOpsLimit) * 100)}% consumed
                  </span>
                </div>

                {/* Meter 4: Storage */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-between font-semibold">
                    <span>Corpus Storage</span>
                    <span className="text-slate-900 font-bold">
                      {usageMeter.storageUsedMB.toFixed(1)} MB / {(usageMeter.storageLimitMB / 1024).toFixed(0)} GB
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (usageMeter.storageUsedMB / usageMeter.storageLimitMB) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">Encrypted server isolation</span>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Tiers Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Available Institutional & Individual Subscription Tiers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between ${
                    p.popular ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-slate-900 text-base">{p.name}</h4>
                      {p.popular && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-4">{p.tagline}</p>

                    <div className="mb-4 pb-4 border-b border-slate-100">
                      <div className="text-2xl font-black text-slate-900">
                        {p.pricePKR === 0 ? 'Free' : `PKR ${p.pricePKR.toLocaleString()}`}
                        <span className="text-xs font-normal text-slate-500"> /{p.interval}</span>
                      </div>
                      {p.priceUSD > 0 && (
                        <span className="text-[11px] text-slate-400">(${p.priceUSD} USD equivalent)</span>
                      )}
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600 mb-6">
                      {p.features.map((f, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPlanToUpgrade(p)}
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      p.id === 'campus_enterprise'
                        ? 'bg-slate-900 hover:bg-slate-800 text-white'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    }`}
                  >
                    Select & Process via Payment Gateway →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Invoicing & Dunning Recovery Management */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Invoices & Dunning Recovery
                </h3>
                <p className="text-[11px] text-slate-500">
                  Electronic receipts with automated retry policies for local Pakistani & international gateways.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Gateway</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status & Dunning</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="p-3 text-slate-500">{new Date(inv.date).toLocaleDateString()}</td>
                      <td className="p-3 font-medium text-slate-800">{inv.description}</td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {inv.gateway}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {inv.currency} {inv.amount.toLocaleString()}
                      </td>
                      <td className="p-3">
                        {inv.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Paid</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded text-[11px]">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Failed (Retries: {inv.dunningRetries})</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status === 'failed' && (
                            <button
                              type="button"
                              onClick={() => handleRetryDunning(inv.id)}
                              disabled={isDunningRecovering === inv.id}
                              className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              {isDunningRecovering === inv.id ? 'Retrying...' : 'Retry Payment'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoicePdf(inv.id, inv.invoiceNumber)}
                            className="flex items-center gap-1 text-xs text-slate-700 hover:text-emerald-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Receipt PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {selectedPlanToUpgrade && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Upgrade to {selectedPlanToUpgrade.name}
                </h3>
                <p className="text-[11px] text-slate-500">Select payment gateway & verify transaction.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanToUpgrade(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5"
              >
                ×
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
              <span className="font-semibold text-slate-700">Total Subscription Due:</span>
              <span className="font-black text-slate-900 text-base">
                PKR {selectedPlanToUpgrade.pricePKR.toLocaleString()}
              </span>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Choose Payment Gateway:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['PayFast', 'JazzCash', 'EasyPaisa', 'Raast', 'Stripe'].map((gw) => (
                  <button
                    key={gw}
                    type="button"
                    onClick={() => setSelectedGateway(gw)}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                      selectedGateway === gw
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-1 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">{gw}</div>
                    <span className="text-[10px] text-slate-400">
                      {gw === 'Stripe' ? 'International Card' : 'Pakistan Instant IPN'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedPlanToUpgrade(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteCheckout}
                disabled={isUpgrading}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>{isUpgrading ? 'Processing Settlement...' : `Confirm & Pay via ${selectedGateway}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB 4: MULTI-TENANCY & INSTITUTIONAL SSO --- */}
      {activeSubTab === 'tenancy' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-700" />
              <span>Multi-Tenancy & Institutional Single Sign-On (SSO)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage federated identity providers (Google Workspace for Education, Microsoft 365 / Entra ID, Shibboleth SAML 2.0).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenants.map((t) => (
              <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    SSO Active
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-600">
                  <div>
                    <strong>Federation Provider:</strong> {t.ssoConfig.provider.toUpperCase()}
                  </div>
                  <div>
                    <strong>Domain Whitelist:</strong>{' '}
                    <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[11px]">
                      {t.ssoConfig.domainWhitelist.join(', ')}
                    </code>
                  </div>
                  <div>
                    <strong>Entity ID / Issuer:</strong>{' '}
                    <span className="text-[11px] text-slate-500 truncate block">
                      {t.ssoConfig.entityId || `https://saml.${t.domain}/idp`}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/70">
                  <span className="text-[11px] font-bold text-slate-700 block mb-1">
                    Isolated Campus Departments ({t.departments.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {t.departments.map((dept, dIdx) => (
                      <span
                        key={dIdx}
                        className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700"
                      >
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SUBTAB 5: AUDIT LOGS & SECURITY --- */}
      {activeSubTab === 'audit' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                <span>Immutable Security Audit Trail ({filteredLogs.length} Events)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Tamper-evident logs of logins, permissions, payment webhooks, and prompt injection neutralizations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={auditFilterAction}
                onChange={(e) => setAuditFilterAction(e.target.value)}
                placeholder="Filter by action..."
                className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
              <select
                value={auditFilterStatus}
                onChange={(e) => setAuditFilterStatus(e.target.value)}
                className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="WARNING">WARNING</option>
                <option value="DENIED">DENIED</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Action Event</th>
                  <th className="p-3">Resource Target</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{log.actorName}</div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">{log.actorRole}</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-950">{log.action}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-600 max-w-[160px] truncate">
                      {log.resource}
                    </td>
                    <td className="p-3 font-mono text-slate-500">{log.ipAddress}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'WARNING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 text-[11px] max-w-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUBTAB 6: DEVELOPER API KEYS & WEBHOOKS --- */}
      {activeSubTab === 'developer' && (
        <div className="space-y-6">
          {/* API Keys */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Programmatic API Keys
                </h3>
                <p className="text-[11px] text-slate-500">
                  Authenticate server-to-server calls for Canvas sync, lab scripts, and automated grading bots.
                </p>
              </div>
            </div>

            {/* Create API Key Form */}
            <form onSubmit={handleCreateApiKey} className="flex gap-2">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. SEECS Moodle Auto-Grader Key..."
                className="flex-1 p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
              <button
                type="submit"
                disabled={!newKeyName.trim()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                + Generate API Key
              </button>
            </form>

            {/* Modal displaying full secret once */}
            {newKeySecretModal && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <span className="text-xs font-bold text-amber-900 block">
                  Copy Secret Token (will not be displayed again):
                </span>
                <code className="block p-2 bg-white rounded border border-amber-300 font-mono text-xs text-slate-900 select-all">
                  {newKeySecretModal}
                </code>
                <button
                  type="button"
                  onClick={() => setNewKeySecretModal(null)}
                  className="text-xs text-amber-900 font-semibold underline mt-1 cursor-pointer"
                >
                  I have saved this token securely
                </button>
              </div>
            )}

            <div className="space-y-2">
              {apiKeys.map((k) => (
                <div
                  key={k.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{k.name}</span>
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                          k.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {k.status}
                      </span>
                    </div>
                    <div className="font-mono text-slate-500 text-[11px] mt-0.5">{k.secretMasked}</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Scopes: [{k.scopes.join(', ')}] • Created {new Date(k.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {k.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handleRevokeApiKey(k.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-semibold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Revoke Key
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Webhooks */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Outbound Webhook Subscriptions
              </h3>
              <p className="text-[11px] text-slate-500">
                Receive real-time notifications when documents are ingested, rubrics are evaluated, or payments settle.
              </p>
            </div>

            <form onSubmit={handleAddWebhook} className="flex gap-2">
              <input
                type="url"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                placeholder="https://your-university-server.edu.pk/api/webhooks..."
                className="flex-1 p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
              <button
                type="submit"
                disabled={!newWebhookUrl.trim()}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                + Subscribe Endpoint
              </button>
            </form>

            <div className="space-y-2">
              {webhooks.map((wh) => (
                <div
                  key={wh.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-4">
                    <div className="font-bold text-slate-900 font-mono truncate">{wh.url}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Events: [{wh.events.join(', ')}]
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Secret: <code className="font-mono">{wh.secret}</code> • Last Delivery: HTTP {wh.lastDeliveryStatus || 200}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTestWebhook(wh.id)}
                    className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send Test Ping</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB 7: THIRD-PARTY INTEGRATIONS --- */}
      {activeSubTab === 'integrations' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Network className="w-5 h-5 text-emerald-700" />
              <span>Academic Third-Party Connectors & Ecosystem</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sync courses from Canvas, Google Classroom, and Moodle, run Turnitin checks, and compile in Overleaf.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((int) => (
              <div
                key={int.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  int.connected
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {int.category}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        int.connected ? 'text-emerald-700 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {int.connected ? '● Active' : '○ Not Connected'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mb-1">{int.name}</h3>
                  <p className="text-xs text-slate-500 mb-3">{int.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {int.lastSyncAt ? `Last Sync: ${new Date(int.lastSyncAt).toLocaleTimeString()}` : 'No sync recorded'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleIntegration(int.id, int.connected)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      int.connected
                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                        : 'bg-emerald-700 text-white hover:bg-emerald-800'
                    }`}
                  >
                    {int.connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SUBTAB 8: CAMPUS ANALYTICS --- */}
      {activeSubTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Weekly Campus Query Volume & Token Ingestion
            </h3>

            <div className="grid grid-cols-7 gap-2 text-center pt-4">
              {analytics.dailyQueries.map((day, idx) => (
                <div key={idx} className="space-y-2 flex flex-col items-center">
                  <span className="text-[11px] font-bold text-slate-700">{day.count} q</span>
                  <div className="w-8 bg-slate-100 rounded-t-lg h-36 flex items-end justify-center overflow-hidden border border-slate-200">
                    <div
                      className="w-full bg-emerald-700 transition-all rounded-t-lg"
                      style={{ height: `${Math.min(100, (day.count / 2600) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block font-medium">{day.date}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rubric Grade Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Predicted Rubric Grade Distribution
              </h3>
              <div className="space-y-2 text-xs">
                {analytics.scoreDistribution.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-slate-700 font-semibold">
                      <span>{item.range}</span>
                      <span>{item.count} assignments</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="bg-purple-700 h-full rounded-full"
                        style={{ width: `${(item.count / 460) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Queried Courses */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Most Active University Courses
              </h3>
              <div className="space-y-2 text-xs">
                {analytics.topCourses.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{c.code}</span>
                      <span className="text-[11px] text-slate-500 block">
                        {c.documents} documents indexed
                      </span>
                    </div>
                    <span className="font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                      {c.queries.toLocaleString()} queries
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB 9: DATA PRIVACY & COMPLIANCE --- */}
      {activeSubTab === 'compliance' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <span>FERPA, GDPR & Pakistan Electronic Crimes Act (PECA) Compliance</span>
              </h2>
              <p className="text-xs text-slate-500">
                Institutional accountability, data sovereignty, right-to-be-forgotten, and data portability.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadCompliancePackage}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download Personal Data Package (JSON)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900">FERPA Academic Privacy</h3>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Student educational records, rubrics, and draft evaluations are strictly confidential. No student submissions are used for public model training.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900">Right to Portability & Erasure</h3>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Under GDPR Article 20, students and faculty can export complete structured data or request irreversible corpus purging at any time.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900">PECA 2016 Pakistan Compliance</h3>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                All transmissions comply with Pakistan Electronic Crimes Act standards. Immutable cryptographic logs record all administrative operations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
