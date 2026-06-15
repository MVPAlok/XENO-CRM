import React, { useState, useEffect } from 'react';

export default function SettingsPage({ 
  onResetWorkspace, 
  workspace, 
  timestamps = {}, 
  onImport, 
  onAnalyze, 
  role = 'Admin',
  onRenameWorkspace,
  onDeleteWorkspace,
  onDuplicateWorkspace,
  onArchiveWorkspace
}) {
  const [activeTab, setActiveTab] = useState('workspace');
  
  // Brand / Workspace Profile states
  const [brandName, setBrandName] = useState('');
  const [industry, setIndustry] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [primaryChannel, setPrimaryChannel] = useState('');
  const [monthlyCustomers, setMonthlyCustomers] = useState('');
  const [currency, setCurrency] = useState('INR (₹)');
  const [defaultDiscount, setDefaultDiscount] = useState('WELCOME20');

  // Channel toggles
  const [channels, setChannels] = useState({
    whatsapp: true,
    email: true,
    sms: true,
    rcs: false,
  });

  // AI settings
  const [aiSettings, setAiSettings] = useState({
    model: 'gpt-4-turbo',
    temperature: 0.7,
    maxTokens: 500,
    safetyFilter: true,
    explainabilityDepth: 'high'
  });

  // Integration settings
  const [integrations, setIntegrations] = useState({
    salesforce: false,
    hubspot: false,
    shopify: true,
    segment: false
  });

  // Action status indicators
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [savedMessage, setSavedMessage] = useState(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [isDeletingConfirm, setIsDeletingConfirm] = useState(false);
  const [isResettingConfirm, setIsResettingConfirm] = useState(false);
  const [freshnessScore, setFreshnessScore] = useState(98);
  const [showRenamedAlert, setShowRenamedAlert] = useState(false);

  // Sync workspace properties into local component state when workspace changes
  useEffect(() => {
    if (workspace) {
      setBrandName(workspace.brandName || '');
      setIndustry(workspace.industry || 'Retail');
      setBusinessType(workspace.businessType || 'D2C');
      setPrimaryChannel(workspace.primaryChannel || 'WhatsApp');
      setMonthlyCustomers(workspace.monthlyCustomers || '10,000');
    }
  }, [workspace]);

  // Permission checks based on roles
  const canModifyBrand = role === 'Admin' || role === 'Marketing Manager';
  const canModifyChannels = role === 'Admin';
  const canModifyAi = role === 'Admin' || role === 'Analyst';
  const canPerformWorkspaceCrud = role === 'Admin';
  const canArchiveWorkspace = role === 'Admin' || role === 'Marketing Manager';
  const canTriggerDataActions = role !== 'Viewer'; // Analyst, Manager, Admin can import/analyze

  const handleSave = (e) => {
    if (e) e.preventDefault();
    if (!canModifyBrand && !canModifyAi) {
      alert("Permission Denied: Your role does not allow saving configuration settings.");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSavedMessage('Configuration successfully saved and synced to the Xeno platform!');
      // Update global workspace details if modified
      if (onRenameWorkspace && brandName !== workspace.brandName) {
        onRenameWorkspace(workspace.id, brandName);
      }
      setTimeout(() => setSavedMessage(null), 3000);
    }, 800);
  };

  const handleChannelToggle = (key) => {
    if (!canModifyChannels) {
      alert("Permission Denied: Only Admins can modify communications gateways.");
      return;
    }
    setChannels({ ...channels, [key]: !channels[key] });
  };

  const handleIntegrationToggle = (key) => {
    if (!canTriggerDataActions) {
      alert("Permission Denied: Viewers cannot configure external integrations.");
      return;
    }
    setIntegrations({ ...integrations, [key]: !integrations[key] });
  };

  const handleTriggerSync = () => {
    if (!canTriggerDataActions) {
      alert("Permission Denied: Viewers cannot trigger data synchronization.");
      return;
    }
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncSuccess(true);
      setFreshnessScore(100);
      
      // Emit event to notify parent main dashboard to update timestamp
      if (timestamps) {
        timestamps.lastRefresh = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today';
      }
      
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 2000);
  };

  const handleRenameSubmit = () => {
    if (!canModifyBrand) {
      alert("Permission Denied: Your role does not allow renaming this workspace.");
      return;
    }
    if (onRenameWorkspace && brandName.trim()) {
      onRenameWorkspace(workspace.id, brandName);
      setShowRenamedAlert(true);
      setTimeout(() => setShowRenamedAlert(false), 3000);
    }
  };

  const handleDuplicate = () => {
    if (!canPerformWorkspaceCrud) {
      alert("Permission Denied: Only Admins can duplicate workspaces.");
      return;
    }
    if (onDuplicateWorkspace) {
      onDuplicateWorkspace(workspace.id);
    }
  };

  const handleArchive = () => {
    if (!canArchiveWorkspace) {
      alert("Permission Denied: Marketing Managers and Admins only can archive workspaces.");
      return;
    }
    if (onArchiveWorkspace) {
      onArchiveWorkspace(workspace.id);
    }
  };

  const handleDelete = () => {
    if (!canPerformWorkspaceCrud) {
      alert("Permission Denied: Only Admins can delete workspaces.");
      return;
    }
    if (onDeleteWorkspace) {
      onDeleteWorkspace(workspace.id);
      setIsDeletingConfirm(false);
    }
  };

  const handleResetConfirm = () => {
    if (onResetWorkspace) {
      onResetWorkspace();
      setIsResettingConfirm(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Notification for Config Save */}
      {savedMessage && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 shadow-xl flex items-center gap-2.5 font-bold text-xs animate-in slide-in-from-top duration-300">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Toast Notification for Sync Success */}
      {syncSuccess && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 shadow-xl flex items-center gap-2.5 font-bold text-xs animate-in slide-in-from-top duration-300">
          <span className="material-symbols-outlined text-[18px] animate-pulse">sync</span>
          <span>CRM Synchronized! Customer database and AI segments successfully re-aligned.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 border border-gray-150/80 rounded-3xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-955">Settings & Control Panel</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
              role === 'Admin' ? 'bg-indigo-100 text-indigo-700' :
              role === 'Marketing Manager' ? 'bg-purple-100 text-purple-700' :
              role === 'Analyst' ? 'bg-cyan-100 text-cyan-700' :
              'bg-gray-100 text-gray-500'
            }`}>
              {role} Privilege
            </span>
          </div>
          <p className="text-xs text-gray-450 font-semibold mt-0.5">
            Configure workspace variables, ingest offline dataset pipelines, simulate Salesforce/Hubspot integrations, and calibrate predictive LLM outputs.
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving || (!canModifyBrand && !canModifyAi)}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-bold text-xs shadow-md transition-all hover:scale-[1.01] flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed group active:scale-[0.98]"
        >
          {saving ? (
            <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-[16px] group-hover:scale-110 transition-transform">save</span>
          )}
          <span>Apply Configurations</span>
        </button>
      </div>

      {/* Role Restriction Banner Warning */}
      {role === 'Viewer' && (
        <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 flex items-center gap-3.5 text-left">
          <span className="material-symbols-outlined text-amber-600 text-[22px]">lock</span>
          <div>
            <h4 className="text-xs font-bold text-amber-800">Locked Settings View (Viewer Role)</h4>
            <p className="text-[10px] text-amber-600 font-medium leading-relaxed">
              Your active user session is mapped to a Viewer account. Settings updates, dataset imports, sync queries, and workspace mutations are disabled. Change roles in the navigation bar to enable access.
            </p>
          </div>
        </div>
      )}

      {role === 'Analyst' && (
        <div className="bg-blue-50 border border-blue-200/60 rounded-2xl p-4 flex items-center gap-3.5 text-left">
          <span className="material-symbols-outlined text-blue-600 text-[22px]">info</span>
          <div>
            <h4 className="text-xs font-bold text-blue-800">Limited Settings Access (Analyst Role)</h4>
            <p className="text-[10px] text-blue-600 font-medium leading-relaxed">
              You are permitted to trigger dataset ingestion, sync CRM systems, and re-calibrate AI parameters. However, workspace creations, deletions, name updates, and communication channel gateways remain restricted.
            </p>
          </div>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Hand Navigation Cards */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white/80 border border-gray-200/60 rounded-[2rem] p-4 shadow-sm space-y-1">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`w-full px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-3 transition-all ${
                activeTab === 'workspace' 
                  ? 'bg-indigo-50 border-l-4 border-indigo-600 text-indigo-700 shadow-sm' 
                  : 'text-gray-450 hover:text-gray-700 hover:bg-gray-50/60'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
              <span>Workspace Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('data')}
              className={`w-full px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-3 transition-all ${
                activeTab === 'data' 
                  ? 'bg-indigo-50 border-l-4 border-indigo-600 text-indigo-700 shadow-sm' 
                  : 'text-gray-450 hover:text-gray-700 hover:bg-gray-50/60'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">sync_alt</span>
              <span>Data & CRM Sync</span>
            </button>

            <button
              onClick={() => setActiveTab('channels')}
              className={`w-full px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-3 transition-all ${
                activeTab === 'channels' 
                  ? 'bg-indigo-50 border-l-4 border-indigo-600 text-indigo-700 shadow-sm' 
                  : 'text-gray-450 hover:text-gray-700 hover:bg-gray-50/60'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">hub</span>
              <span>Outbound Gateways</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-3 transition-all ${
                activeTab === 'ai' 
                  ? 'bg-indigo-50 border-l-4 border-indigo-600 text-indigo-700 shadow-sm' 
                  : 'text-gray-450 hover:text-gray-700 hover:bg-gray-50/60'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">psychology</span>
              <span>AI Engine Setup</span>
            </button>
          </div>

          {/* Quick Stats Summary Card */}
          <div className="bg-gradient-to-br from-indigo-950 to-purple-950 text-white rounded-[2rem] p-5 shadow-md space-y-4">
            <div>
              <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest">Active Workspace ID</span>
              <p className="text-[11px] font-mono text-gray-300 break-all select-all font-semibold mt-1">
                {workspace?.id || 'ws-default-key'}
              </p>
            </div>
            
            <div className="pt-2.5 border-t border-indigo-800/40 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] text-indigo-300 font-bold block">Analysis Status</span>
                <span className="text-xs font-black text-cyan-400">Ready (Core V2)</span>
              </div>
              <div>
                <span className="text-[9px] text-indigo-300 font-bold block">Data Freshness</span>
                <span className="text-xs font-black text-emerald-400">{freshnessScore}% Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Hand Panel Body */}
        <div className="lg:col-span-3 bg-white/80 border border-gray-200/60 rounded-[2.25rem] p-8 shadow-sm">
          
          {/* TAB 1: WORKSPACE PROFILE & CRUD ACTIONS */}
          {activeTab === 'workspace' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Workspace Brand profile</h3>
                <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Edit registration parameters and administrative states for this specific campaign division.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Workspace / Brand Name</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      disabled={!canModifyBrand}
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="flex-1 px-4 py-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold disabled:opacity-50 disabled:bg-gray-100"
                    />
                    {canModifyBrand && (
                      <button 
                        type="button" 
                        onClick={handleRenameSubmit}
                        className="px-3 bg-indigo-50 border border-indigo-200 text-indigo-650 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all"
                      >
                        Rename
                      </button>
                    )}
                  </div>
                  {showRenamedAlert && (
                    <span className="text-[10px] text-emerald-600 font-bold mt-1.5 block">Workspace renamed successfully!</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Industry Sector</label>
                  <select
                    disabled={!canModifyBrand}
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold text-gray-650 disabled:opacity-50 disabled:bg-gray-100"
                  >
                    <option value="Retail">Retail & Storefront</option>
                    <option value="E-Commerce">E-Commerce & Digital Store</option>
                    <option value="D2C Apparel">D2C Fashion & Apparel</option>
                    <option value="SaaS / Web App">SaaS / B2B Software</option>
                    <option value="Health & Beauty">Health, Wellness & Beauty</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Operational Business Model</label>
                  <select
                    disabled={!canModifyBrand}
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold text-gray-650 disabled:opacity-50 disabled:bg-gray-100"
                  >
                    <option value="D2C">D2C (Direct to Consumer)</option>
                    <option value="B2B">B2B (Business to Business)</option>
                    <option value="B2B2C">B2B2C Hybrid Model</option>
                    <option value="Subscription">Subscription / Recurring SaaS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Coupon Default Discount Code</label>
                  <input
                    type="text"
                    disabled={!canModifyBrand}
                    value={defaultDiscount}
                    onChange={(e) => setDefaultDiscount(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold disabled:opacity-50 disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Administrative Actions Section */}
              <div className="pt-6 border-t border-gray-100 mt-6 space-y-4">
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">Workspace Management Actions</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Duplicate Workspace */}
                  <div className="bg-gray-50/50 border border-gray-150 rounded-2xl p-4 flex flex-col justify-between gap-3 text-left">
                    <div>
                      <h5 className="text-xs font-bold text-gray-900">Duplicate Entire Workspace</h5>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5 leading-relaxed">
                        Copy all custom segmentation logic, configured workflows, and audience timelines into a new clone brand instance.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!canPerformWorkspaceCrud}
                      onClick={handleDuplicate}
                      className="w-fit px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 font-bold text-[10px] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Duplicate Instance
                    </button>
                  </div>

                  {/* Archive Workspace */}
                  <div className="bg-gray-50/50 border border-gray-150 rounded-2xl p-4 flex flex-col justify-between gap-3 text-left">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-gray-900">Archive Workspace</h5>
                        {workspace?.isArchived && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[8px] font-black uppercase">Archived</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5 leading-relaxed">
                        Toggle inactive state. Archiving temporarily pauses automated simulations and hides campaign reports from the sidebar selectors.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!canArchiveWorkspace}
                      onClick={handleArchive}
                      className={`w-fit px-4 py-2 font-bold text-[10px] rounded-xl transition-all ${
                        workspace?.isArchived 
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-800' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {workspace?.isArchived ? 'Unarchive Workspace' : 'Archive Workspace'}
                    </button>
                  </div>

                </div>

                {/* Danger zone grid */}
                <div className="pt-4 mt-2">
                  <h4 className="text-xs font-bold text-red-650 uppercase tracking-wider mb-3">Danger Zone Settings</h4>
                  <div className="bg-red-50/10 border border-red-100/50 rounded-2xl p-5 space-y-4 text-left">
                    
                    {/* Delete Workspace */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <div>
                        <h5 className="text-xs font-bold text-red-700">Permanently Delete Workspace</h5>
                        <p className="text-[10px] text-gray-400 font-semibold leading-relaxed mt-0.5">
                          Erase this brand container. All customers CRM logs, campaigns, and attributes are lost. This action is irreversible.
                        </p>
                      </div>
                      
                      {isDeletingConfirm ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsDeletingConfirm(false)}
                            className="px-3 py-1.5 bg-gray-100 text-gray-650 font-bold text-[10px] rounded-xl hover:bg-gray-200 transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleDelete}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded-xl transition-all shadow-sm"
                          >
                            Yes, Delete Permanently
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={!canPerformWorkspaceCrud}
                          onClick={() => setIsDeletingConfirm(true)}
                          className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-650 font-bold text-[10px] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete Workspace
                        </button>
                      )}
                    </div>

                    {/* Reset Console Platform */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-4 border-t border-red-100/30">
                      <div>
                        <h5 className="text-xs font-bold text-red-700">Reset Console Brand Registries</h5>
                        <p className="text-[10px] text-gray-400 font-semibold leading-relaxed mt-0.5">
                          Clears all workspaces and active states from local storage. Resets the CRM platform to the First Onboarding wizard step.
                        </p>
                      </div>
                      
                      {isResettingConfirm ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsResettingConfirm(false)}
                            className="px-3 py-1.5 bg-gray-100 text-gray-650 font-bold text-[10px] rounded-xl hover:bg-gray-200 transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleResetConfirm}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded-xl transition-all shadow-sm"
                          >
                            Yes, Reset All
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsResettingConfirm(true)}
                          className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-650 font-bold text-[10px] rounded-xl transition-all"
                        >
                          Hard Reset Platform
                        </button>
                      )}
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: DATA REFRESH & CRM SYNC */}
          {activeTab === 'data' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Data Ingestion Center</h3>
                  <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Merge or overwrite offline customer datasets, recompute AI clustering algorithms, and sync SaaS records.</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">AI Engines In Sync</span>
                </div>
              </div>

              {/* Data Freshness Status Strip */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100/50 p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Last Dataset Import</span>
                  <span className="text-xs font-bold text-gray-900 mt-1 block">
                    {timestamps.lastUpload || workspace?.lastUpload || '8:10 PM Today'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Last AI Analysis</span>
                  <span className="text-xs font-bold text-gray-900 mt-1 block">
                    {timestamps.lastAnalysis || workspace?.lastAnalysis || '8:22 PM Today'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">CRM Freshness</span>
                  <span className="text-xs font-bold text-gray-900 mt-1 block">
                    {timestamps.lastRefresh || workspace?.lastRefresh || 'Updated 12m ago'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Quality Health Score</span>
                  <span className="text-xs font-bold text-indigo-750 mt-1 block">
                    {freshnessScore}% Freshness
                  </span>
                </div>
              </div>

              {/* Ingestion & Refresh Operations */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-900">Database Action Pipeline</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Import dataset */}
                  <div className="p-4 border border-gray-200 rounded-2xl text-left flex justify-between items-start gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-indigo-650">upload_file</span>
                        <h5 className="text-xs font-bold text-gray-900">Import/Upload New Dataset</h5>
                      </div>
                      <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                        Trigger the onboarding wizard to drag-and-drop a new `.csv` customer manifest file containing emails, phone logs, and order histories.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!canTriggerDataActions}
                      onClick={onImport}
                      className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-650 hover:bg-indigo-100 rounded-xl text-[10px] font-bold transition-all disabled:opacity-40"
                    >
                      Import
                    </button>
                  </div>

                  {/* Re-run AI Analysis */}
                  <div className="p-4 border border-gray-200 rounded-2xl text-left flex justify-between items-start gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-indigo-650">psychology</span>
                        <h5 className="text-xs font-bold text-gray-900">Re-run AI Core Analysis</h5>
                      </div>
                      <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                        Recompute AI clustering, refresh churn predictors, scan behavior patterns, and generate fresh priority recommendations.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!canTriggerDataActions}
                      onClick={onAnalyze}
                      className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-650 hover:bg-indigo-100 rounded-xl text-[10px] font-bold transition-all disabled:opacity-40"
                    >
                      Analyze
                    </button>
                  </div>
                </div>

                {/* Additional file merging controls */}
                <div className="bg-gray-50/60 border border-gray-150 rounded-2xl p-5 space-y-4 text-left">
                  <h5 className="text-xs font-bold text-indigo-950">Advanced Dataset Merging</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                      <input 
                        type="radio" 
                        name="merge_type" 
                        defaultChecked 
                        disabled={!canTriggerDataActions}
                        className="mt-0.5 accent-indigo-600" 
                      />
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Merge and De-duplicate</span>
                        <span className="text-[10px] text-gray-400 font-semibold leading-none">Append new records while preserving historical timelines.</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                      <input 
                        type="radio" 
                        name="merge_type" 
                        disabled={!canTriggerDataActions}
                        className="mt-0.5 accent-indigo-600" 
                      />
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Full Database Replacement</span>
                        <span className="text-[10px] text-gray-400 font-semibold leading-none">Overwrite the current database completely with the newly provided file.</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* CRM Integrations Integration Grid */}
              <div className="pt-6 border-t border-gray-100 space-y-5 text-left">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Sync External CRMs & E-commerce Platforms</h4>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Toggle live pipelines to pull transactions, contacts, and metadata directly from external SaaS connectors.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Shopify */}
                  <div className="p-4 border border-gray-200 rounded-2xl flex justify-between items-center bg-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[26px] text-emerald-600">storefront</span>
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Shopify Connect API</span>
                        <span className="text-[10px] text-gray-400 font-semibold">Live catalog sync & order fulfillment.</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleIntegrationToggle('shopify')}
                      disabled={!canTriggerDataActions}
                      className={`w-11 h-6 rounded-full p-1 transition-colors flex ${
                        integrations.shopify ? 'bg-indigo-600 justify-end' : 'bg-gray-200 justify-start'
                      } disabled:opacity-40`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>

                  {/* Salesforce */}
                  <div className="p-4 border border-gray-200 rounded-2xl flex justify-between items-center bg-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[26px] text-sky-500">cloud</span>
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Salesforce CRM Integration</span>
                        <span className="text-[10px] text-gray-400 font-semibold">Pull contact lists & lead pipelines.</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleIntegrationToggle('salesforce')}
                      disabled={!canTriggerDataActions}
                      className={`w-11 h-6 rounded-full p-1 transition-colors flex ${
                        integrations.salesforce ? 'bg-indigo-600 justify-end' : 'bg-gray-200 justify-start'
                      } disabled:opacity-40`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>

                  {/* HubSpot */}
                  <div className="p-4 border border-gray-200 rounded-2xl flex justify-between items-center bg-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[26px] text-amber-500">hub</span>
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">HubSpot Marketing Hub</span>
                        <span className="text-[10px] text-gray-400 font-semibold">Sync customer status & preferences.</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleIntegrationToggle('hubspot')}
                      disabled={!canTriggerDataActions}
                      className={`w-11 h-6 rounded-full p-1 transition-colors flex ${
                        integrations.hubspot ? 'bg-indigo-600 justify-end' : 'bg-gray-200 justify-start'
                      } disabled:opacity-40`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>

                  {/* Segment */}
                  <div className="p-4 border border-gray-200 rounded-2xl flex justify-between items-center bg-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[26px] text-emerald-500">scatter_plot</span>
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Segment.io CDPs</span>
                        <span className="text-[10px] text-gray-400 font-semibold">Stream real-time browser behaviors.</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleIntegrationToggle('segment')}
                      disabled={!canTriggerDataActions}
                      className={`w-11 h-6 rounded-full p-1 transition-colors flex ${
                        integrations.segment ? 'bg-indigo-600 justify-end' : 'bg-gray-200 justify-start'
                      } disabled:opacity-40`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                </div>

                {/* Direct Manual Sync Action */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={syncing || !canTriggerDataActions}
                    onClick={handleTriggerSync}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-40"
                  >
                    {syncing ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                        <span>Synchronizing Databases...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">sync</span>
                        <span>Trigger Direct Sync Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OUTBOUND GATEWAYS */}
          {activeTab === 'channels' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Active Communication Channels</h3>
                <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Toggle active messaging gateways and set carrier keys for SMS, RCS, WhatsApp, or Emails.</p>
              </div>
              
              <div className="space-y-4">
                
                {/* WhatsApp */}
                <div className="flex flex-col p-5 border border-gray-200 rounded-2xl gap-4 text-left">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-emerald-500 text-[26px]">chat</span>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">WhatsApp Marketing Business API</h4>
                        <p className="text-[10px] text-gray-400 font-semibold">Required for transactional & conversational winbacks. 85% avg read rate.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleChannelToggle('whatsapp')}
                      disabled={!canModifyChannels}
                      className={`w-11 h-6 rounded-full p-1 transition-colors flex ${
                        channels.whatsapp ? 'bg-indigo-600 justify-end' : 'bg-gray-200 justify-start'
                      } disabled:opacity-40`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                    </button>
                  </div>
                  {channels.whatsapp && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100 animate-in slide-in-from-top-3 duration-250">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">WhatsApp Business ID</label>
                        <input
                          type="text"
                          disabled={!canModifyChannels}
                          defaultValue="wab_id_939281726"
                          className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none font-semibold text-gray-600 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Webhook Endpoint Verification Key</label>
                        <input
                          type="password"
                          disabled={!canModifyChannels}
                          defaultValue="•••••••••••••••••••••••••••"
                          className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none font-semibold text-gray-650 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="flex flex-col p-5 border border-gray-200 rounded-2xl gap-4 text-left">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-indigo-500 text-[26px]">mail</span>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Email SMTP Relays (Amazon SES / SendGrid)</h4>
                        <p className="text-[10px] text-gray-400 font-semibold">Outbound HTML newsletters and seasonal clearance catalogs. 22% avg open rate.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleChannelToggle('email')}
                      disabled={!canModifyChannels}
                      className={`w-11 h-6 rounded-full p-1 transition-colors flex ${
                        channels.email ? 'bg-indigo-600 justify-end' : 'bg-gray-200 justify-start'
                      } disabled:opacity-40`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                  {channels.email && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100 animate-in slide-in-from-top-3 duration-250">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">AWS Host Endpoint</label>
                        <input
                          type="text"
                          disabled={!canModifyChannels}
                          defaultValue="email-smtp.us-east-1.amazonaws.com"
                          className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none font-semibold text-gray-600 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Sender Address (Verified)</label>
                        <input
                          type="text"
                          disabled={!canModifyChannels}
                          defaultValue="updates@acmeretail.com"
                          className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none font-semibold text-gray-650 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* SMS */}
                <div className="flex flex-col p-5 border border-gray-200 rounded-2xl gap-4 text-left">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-amber-500 text-[26px]">sms</span>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">SMS Outbound Gateway (Twilio / Plivo)</h4>
                        <p className="text-[10px] text-gray-400 font-semibold">Fallback transactional dispatch. Fast delivery rates, limited copy constraints.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleChannelToggle('sms')}
                      disabled={!canModifyChannels}
                      className={`w-11 h-6 rounded-full p-1 transition-colors flex ${
                        channels.sms ? 'bg-indigo-600 justify-end' : 'bg-gray-200 justify-start'
                      } disabled:opacity-40`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                  {channels.sms && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100 animate-in slide-in-from-top-3 duration-250">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Twilio Account SID</label>
                        <input
                          type="text"
                          disabled={!canModifyChannels}
                          defaultValue="AC22c83d7aa0fbc89a80e1b9b"
                          className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none font-semibold text-gray-600 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Messaging Service SID</label>
                        <input
                          type="text"
                          disabled={!canModifyChannels}
                          defaultValue="MG7782161a0f8b1e550993ef"
                          className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none font-semibold text-gray-650 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* RCS */}
                <div className="flex flex-col p-5 border border-gray-200 rounded-2xl gap-4 text-left">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-pink-500 text-[26px]">forum</span>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">RCS Rich Messaging (Google Jibe API)</h4>
                        <p className="text-[10px] text-gray-400 font-semibold">Dynamic rich carousels and verified sender branding directly on Android devices.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleChannelToggle('rcs')}
                      disabled={!canModifyChannels}
                      className={`w-11 h-6 rounded-full p-1 transition-colors flex ${
                        channels.rcs ? 'bg-indigo-600 justify-end' : 'bg-gray-200 justify-start'
                      } disabled:opacity-40`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                  {channels.rcs && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100 animate-in slide-in-from-top-3 duration-250">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">RCS Brand Agent ID</label>
                        <input
                          type="text"
                          disabled={!canModifyChannels}
                          defaultValue="rcs_agent_acme_retail_v1"
                          className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none font-semibold text-gray-600 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Verified Bot ID</label>
                        <input
                          type="text"
                          disabled={!canModifyChannels}
                          defaultValue="bot_acme_verified@rcs.google.com"
                          className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none font-semibold text-gray-650 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: AI & API CONFIGURATION */}
          {activeTab === 'ai' && (
            <div className="space-y-6 animate-in fade-in duration-300 text-left">
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-sans">Growth Studio Engine Configuration</h3>
                <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Control LLM models, set temperature parameters, restrict copywriting creativity, and verify explanation depth.</p>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-450 uppercase tracking-wider mb-2">Primary Copywriter LLM Model</label>
                  <select
                    disabled={!canModifyAi}
                    value={aiSettings.model}
                    onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                    className="w-full px-4 py-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold text-gray-600 disabled:opacity-50"
                  >
                    <option value="gpt-4-turbo">GPT-4 Turbo (Optimal for copywrite and reasoning)</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast dispatches)</option>
                    <option value="claude-3-opus">Claude 3 Opus (Creative long-form templates)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Massive prompt context windows)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500 mb-2">
                    <span>Creativity Scale (Temperature)</span>
                    <span className="text-indigo-650 font-bold">{aiSettings.temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.2"
                    step="0.1"
                    disabled={!canModifyAi}
                    value={aiSettings.temperature}
                    onChange={(e) => setAiSettings({ ...aiSettings, temperature: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50"
                  />
                  <span className="text-[10px] text-gray-400 font-semibold leading-none mt-1.5 block">
                    Higher scale yields more emotional and diverse copy templates. Low values yield uniform, standard corporate messages.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-450 uppercase tracking-wider mb-2">Explanation Depth</label>
                    <select
                      disabled={!canModifyAi}
                      value={aiSettings.explainabilityDepth}
                      onChange={(e) => setAiSettings({ ...aiSettings, explainabilityDepth: e.target.value })}
                      className="w-full px-4 py-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold text-gray-600 disabled:opacity-50"
                    >
                      <option value="high">High (Show full cohort logic & confidence metrics)</option>
                      <option value="medium">Medium (Summarize criteria & predictions)</option>
                      <option value="low">Low (Show basic target counts only)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-450 uppercase tracking-wider mb-2">Max Token Limit Per Prompt</label>
                    <input
                      type="number"
                      disabled={!canModifyAi}
                      value={aiSettings.maxTokens}
                      onChange={(e) => setAiSettings({ ...aiSettings, maxTokens: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-2xl flex justify-between items-center bg-white mt-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[24px] text-indigo-600">security</span>
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">Prompt Injection Guard rails</span>
                      <span className="text-[10px] text-gray-400 font-semibold">Enable strict filtering to block malicious prompt injections in user-facing dispatches.</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setAiSettings({ ...aiSettings, safetyFilter: !aiSettings.safetyFilter })}
                    disabled={!canModifyAi}
                    className={`w-11 h-6 rounded-full p-1 transition-colors flex ${
                      aiSettings.safetyFilter ? 'bg-indigo-600 justify-end' : 'bg-gray-200 justify-start'
                    } disabled:opacity-40`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>
      
    </div>
  );
}
