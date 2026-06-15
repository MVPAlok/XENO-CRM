import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import DashboardOverview from './DashboardOverview';
import CustomersPage from './CustomersPage';
import SegmentsPage from './SegmentsPage';
import GrowthStudioPage from './GrowthStudioPage';
import CampaignsPage from './CampaignsPage';
import AnalyticsPage from './AnalyticsPage';
import CampaignActivityCenter from './ChannelSimulator';
import SettingsPage from './SettingsPage';
import OnboardingWizard from './OnboardingWizard';
import AiInsightsHub from './AiInsightsHub';

import {
  analyticsAPI,
  campaignAPI,
  copilotAPI,
  customerAPI,
  notificationAPI,
  segmentAPI,
  simulatorAPI,
  workspaceAPI,
  importAPI
} from '../utils/api';

const DEFAULT_KPIS = {
  totalCustomers: { value: '0', change: '—', isPositive: true, label: 'Total Customers' },
  totalRevenue: { value: '₹0', change: '—', isPositive: true, label: 'Total Revenue' },
  activeCampaigns: { value: '0', change: '—', isPositive: true, label: 'Active Campaigns' },
  conversionRate: { value: '0%', change: '—', isPositive: true, label: 'Conversion Rate' },
  customerLifetimeValue: { value: '₹0', change: '—', isPositive: true, label: 'Avg Customer CLV' },
  campaignRevenue: { value: '₹0', change: '—', isPositive: true, label: 'Campaign Attributed Rev' },
};

const EMPTY_SIM_METRICS = { sent: 0, delivered: 0, failed: 0, read: 0, clicked: 0, converted: 0 };

export default function DashboardMain({ user, onBack }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = location.pathname.split('/')[2] || 'dashboard';

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [copilotPrompt, setCopilotPrompt] = useState('');
  const [skeletonLoading, setSkeletonLoading] = useState(false);
  const [workspacesLoading, setWorkspacesLoading] = useState(true);

  // Floating Copilot Handlers
  const [isFloatingCopilotOpen, setIsFloatingCopilotOpen] = useState(false);
  const [floatingChatLogs, setFloatingChatLogs] = useState([
    { 
      sender: 'ai', 
      text: "Hello! I am your AI Marketing assistant. How can I help optimize your campaigns today?", 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);
  const [floatingInput, setFloatingInput] = useState('');
  const [isFloatingAiTyping, setIsFloatingAiTyping] = useState(false);

  // Role State
  const [role, setRole] = useState('Admin');

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    addNotification(`User role simulated as "${newRole}"`, 'info');
  };

  // Central Workspaces States
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('');

  const [isCreatingNewWorkspace, setIsCreatingNewWorkspace] = useState(false);
  const [isOnboardingSubmitting, setIsOnboardingSubmitting] = useState(false);
  const [onboardingError, setOnboardingError] = useState(null);
  const [reanalysisWorkspaceId, setReanalysisWorkspaceId] = useState(null);
  const [importWorkspaceId, setImportWorkspaceId] = useState(null);

  // Active Workspace Data States
  const [customers, setCustomers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [segments, setSegments] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [kpis, setKpis] = useState(DEFAULT_KPIS);
  const [notifications, setNotifications] = useState([]);
  const [workspaceTimestamps, setWorkspaceTimestamps] = useState({
    lastAnalysis: 'Just Now',
    lastUpload: 'Just Now',
    lastRefresh: 'Just Now'
  });

  // Simulator State
  const [simMetrics, setSimMetrics] = useState(EMPTY_SIM_METRICS);
  const [simLogs, setSimLogs] = useState([]);
  const [isPaused, setIsPaused] = useState(true);
  const [simSpeed, setSimSpeed] = useState(4); // seconds per event

  const [activeCampaignId, setActiveCampaignId] = useState(null);
  const [activeCustomerId, setActiveCustomerId] = useState(null);
  const [floatingConversationId, setFloatingConversationId] = useState(null);

  const addNotification = useCallback((text, type = 'info') => {
    const newNotif = {
      id: `nt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' today',
      read: false,
      type
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const loadWorkspaces = useCallback(async (preferId = null) => {
    setWorkspacesLoading(true);
    try {
      const data = await workspaceAPI.list();
      if (data.success) {
        let list = data.workspaces || [];
        if (list.length === 0) {
          try {
            const createData = await workspaceAPI.create({
              brandName: "My Workspace",
              industry: "Other",
              businessType: "Other",
              primaryChannel: "Email",
              monthlyCustomers: "0-1000"
            });
            if (createData.success && createData.workspace) {
              list = [createData.workspace];
            }
          } catch (createErr) {
            console.error('Failed auto-creating default workspace', createErr);
          }
        }
        setWorkspaces(list);
        setActiveWorkspaceId((prev) => {
          if (preferId && list.some((w) => w.id === preferId)) return preferId;
          if (prev && list.some((w) => w.id === prev)) return prev;
          return list[0]?.id || '';
        });
      }
    } catch (err) {
      console.error('Failed loading workspaces', err);
      addNotification(err.message || 'Failed to load workspaces.', 'risk');
    } finally {
      setWorkspacesLoading(false);
    }
  }, [addNotification]);

  const loadWorkspaceData = useCallback(async (workspaceId) => {
    if (!workspaceId) return;
    setSkeletonLoading(true);
    try {
      const [custs, camps, segs, overview, logs, metrics, notifs] = await Promise.all([
        customerAPI.list(workspaceId, '?limit=100'),
        campaignAPI.list(workspaceId),
        segmentAPI.list(workspaceId),
        analyticsAPI.getOverview(workspaceId),
        simulatorAPI.getLogs(workspaceId, '?limit=50'),
        simulatorAPI.getMetrics(workspaceId),
        notificationAPI.list(workspaceId)
      ]);

      setCustomers(custs.customers || []);
      setCampaigns(camps.campaigns || []);
      setSegments(segs.segments || []);
      setAnalyticsData(overview);
      setKpis(overview.kpis || DEFAULT_KPIS);
      setSimLogs(logs.logs || []);
      setSimMetrics(metrics.metrics || EMPTY_SIM_METRICS);
      setNotifications(notifs.notifications || []);
      setWorkspaceTimestamps({
        lastAnalysis: 'Just Now',
        lastUpload: 'Just Now',
        lastRefresh: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today'
      });
    } catch (err) {
      console.error('Failed loading workspace data', err);
      addNotification(err.message || 'Failed to load workspace data.', 'risk');
    } finally {
      setSkeletonLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (activeWorkspaceId) {
      loadWorkspaceData(activeWorkspaceId);
    }
  }, [activeWorkspaceId, loadWorkspaceData]);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    const interval = setInterval(() => {
      Promise.all([
        simulatorAPI.getLogs(activeWorkspaceId, '?limit=50'),
        simulatorAPI.getMetrics(activeWorkspaceId),
        campaignAPI.list(activeWorkspaceId),
        analyticsAPI.getOverview(activeWorkspaceId),
        notificationAPI.list(activeWorkspaceId)
      ]).then(([logs, metrics, camps, overview, notifs]) => {
        setSimLogs(logs.logs || []);
        setSimMetrics(metrics.metrics || EMPTY_SIM_METRICS);
        setCampaigns(camps.campaigns || []);
        setAnalyticsData(overview);
        setKpis(overview.kpis || DEFAULT_KPIS);
        setNotifications(notifs.notifications || []);
      }).catch((err) => console.error('Failed refreshing live workspace data', err));
    }, 5000);

    return () => clearInterval(interval);
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    simulatorAPI.control(activeWorkspaceId, { isPaused, speed: simSpeed }).catch((err) => {
      console.error('Failed updating simulator control', err);
    });
  }, [activeWorkspaceId, isPaused, simSpeed]);

  useEffect(() => {
    setFloatingConversationId(null);
    setFloatingChatLogs([
      {
        sender: 'ai',
        text: "Hello! I am your AI Marketing assistant. How can I help optimize your campaigns today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [activeWorkspaceId]);

  const handleDismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  // Workspace Actions
  const handleSelectWorkspace = (id) => {
    setActiveWorkspaceId(id);
  };

  const handleCreateWorkspace = () => {
    if (role === 'Viewer') {
      alert("Permission Denied: Viewers cannot create workspaces.");
      return;
    }
    setIsCreatingNewWorkspace(true);
  };

  const handleOnboardingComplete = async (workspaceDetails) => {
    setIsOnboardingSubmitting(true);
    setOnboardingError(null);
    try {
      const data = await workspaceAPI.create({
        brandName: workspaceDetails.brandName,
        industry: workspaceDetails.industry,
        businessType: workspaceDetails.businessType,
        primaryChannel: workspaceDetails.primaryChannel,
        monthlyCustomers: workspaceDetails.monthlyCustomers,
      });
      if (data.success && data.workspace?.id) {
        const newWorkspace = data.workspace;

        // Perform CSV upload if files are present
        if (workspaceDetails.customersFile || workspaceDetails.ordersFile) {
          const formData = new FormData();
          if (workspaceDetails.customersFile) {
            formData.append('customers', workspaceDetails.customersFile, workspaceDetails.customersFile.name);
          }
          if (workspaceDetails.ordersFile) {
            formData.append('orders', workspaceDetails.ordersFile, workspaceDetails.ordersFile.name);
          }
          try {
            await importAPI.uploadCsv(newWorkspace.id, formData);
          } catch (importErr) {
            console.error('Initial CSV import failed', importErr);
            addNotification('Initial CSV import failed, but workspace was created.', 'warning');
          }
        }

        setWorkspaces((prev) => {
          const exists = prev.some((w) => w.id === newWorkspace.id);
          return exists ? prev.map((w) => (w.id === newWorkspace.id ? newWorkspace : w)) : [...prev, newWorkspace];
        });
        setActiveWorkspaceId(newWorkspace.id);
        addNotification(`Workspace "${newWorkspace.brandName || newWorkspace.name}" created successfully.`, 'success');
        navigate('/dashboard');
      } else if (data.success) {
        await loadWorkspaces();
        navigate('/dashboard');
      } else {
        throw new Error('Workspace was not created. Please try again.');
      }
    } catch (err) {
      console.error('Workspace creation failed', err);
      const message = err.message || 'Workspace creation failed.';
      setOnboardingError(message);
      addNotification(message, 'risk');
    } finally {
      setIsOnboardingSubmitting(false);
      setIsCreatingNewWorkspace(false);
    }
  };

  const handleRenameWorkspace = async (id, newName) => {
    try {
      const data = await workspaceAPI.patch(id, { brandName: newName });
      if (data.success) {
        setWorkspaces(prev => prev.map(w => w.id === id ? data.workspace : w));
        addNotification(`Workspace renamed to "${newName}"`, 'success');
      }
    } catch (err) {
      console.error('Workspace rename failed', err);
      addNotification(err.message || 'Workspace rename failed.', 'risk');
    }
  };

  const handleDuplicateWorkspace = async (id) => {
    try {
      const data = await workspaceAPI.duplicate(id);
      if (data.success) {
        await loadWorkspaces(data.workspace.id);
        addNotification(`Workspace duplicated as "${data.workspace.brandName || data.workspace.name}"`, 'success');
      }
    } catch (err) {
      console.error('Workspace duplicate failed', err);
      addNotification(err.message || 'Workspace duplicate failed.', 'risk');
    }
  };

  const handleArchiveWorkspace = async (id) => {
    const source = workspaces.find(w => w.id === id);
    if (!source) return;
    try {
      const data = await workspaceAPI.patch(id, { isArchived: !source.isArchived });
      if (data.success) {
        setWorkspaces(prev => prev.map(w => w.id === id ? data.workspace : w));
        addNotification(`Workspace is now ${data.workspace.isArchived ? 'archived' : 'unarchived'}`, 'info');
      }
    } catch (err) {
      console.error('Workspace archive failed', err);
      addNotification(err.message || 'Workspace archive failed.', 'risk');
    }
  };

  const handleDeleteWorkspace = async (id) => {
    try {
      await workspaceAPI.delete(id);
      const next = workspaces.filter(w => w.id !== id);
      setWorkspaces(next);
      addNotification('Workspace deleted.', 'risk');
      if (activeWorkspaceId === id) {
        setActiveWorkspaceId(next[0]?.id || '');
        if (next.length === 0) navigate('/dashboard');
      }
    } catch (err) {
      console.error('Workspace delete failed', err);
      addNotification(err.message || 'Workspace delete failed.', 'risk');
    }
  };

  const handleRerunAnalysis = (id) => {
    if (role === 'Viewer') {
      alert("Permission Denied: Viewers cannot trigger data re-analysis.");
      return;
    }
    setReanalysisWorkspaceId(id);
  };

  const handleImportDataset = (id) => {
    if (role === 'Viewer') {
      alert("Permission Denied: Viewers cannot import datasets.");
      return;
    }
    setImportWorkspaceId(id);
  };

  const handleResetWorkspace = () => {
    setWorkspaces([]);
    setActiveWorkspaceId('');
    navigate('/dashboard');
  };

  // Floating Copilot — real backend chat
  const ensureCopilotConversation = async () => {
    if (floatingConversationId) return floatingConversationId;
    const data = await copilotAPI.createConversation(activeWorkspaceId, 'Xeno AI Assistant');
    if (data.success && data.conversation) {
      setFloatingConversationId(data.conversation.id);
      return data.conversation.id;
    }
    throw new Error('Failed to start copilot conversation');
  };

  const sendCopilotMessage = async (userText) => {
    if (!activeWorkspaceId) {
      addNotification('Select a workspace before using the AI copilot.', 'risk');
      return;
    }
    setIsFloatingAiTyping(true);
    try {
      const convId = await ensureCopilotConversation();
      const data = await copilotAPI.sendMessage(activeWorkspaceId, convId, userText);
      if (data.success && data.message) {
        setFloatingChatLogs((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: data.message.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: data.message.action || null
          }
        ]);
      }
    } catch (err) {
      console.error('Copilot message failed', err);
      addNotification(err.message || 'AI copilot request failed.', 'risk');
    } finally {
      setIsFloatingAiTyping(false);
    }
  };

  const handleSendChip = (chipText) => {
    const userMsg = {
      sender: 'user',
      text: chipText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setFloatingChatLogs(prev => [...prev, userMsg]);
    sendCopilotMessage(chipText);
  };

  const handleFloatingSubmit = (e) => {
    e.preventDefault();
    if (!floatingInput.trim()) return;

    const userMsg = {
      sender: 'user',
      text: floatingInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setFloatingChatLogs(prev => [...prev, userMsg]);
    const input = floatingInput;
    setFloatingInput('');
    sendCopilotMessage(input);
  };

  // View Navigation Helpers
  const handleNavigateView = (viewId) => {
    if (viewId === 'dashboard') {
      navigate('/dashboard');
    } else {
      navigate(`/dashboard/${viewId}`);
    }
  };

  const handleLaunchNewCampaign = async (newCamp) => {
    if (role === 'Viewer') {
      alert("Permission Denied: Viewers cannot launch campaigns.");
      return;
    }
    if (role === 'Analyst') {
      alert("Permission Denied: Analysts are restricted to data modeling. Campaign creation is disabled.");
      return;
    }
    if (!activeWorkspaceId) {
      addNotification('No active workspace selected.', 'risk');
      return;
    }

    const matchedSegment = segments.find(
      (s) => s.name === newCamp.segment || s.id === newCamp.segmentId
    );

    try {
      const data = await campaignAPI.create(activeWorkspaceId, {
        name: newCamp.name,
        segmentId: matchedSegment?.id || newCamp.segmentId,
        segment: newCamp.segment,
        channel: newCamp.channel,
        messageBody: newCamp.message,
        messageSubject: newCamp.messageSubject,
        status: newCamp.status || 'Running',
      });

      if (data.success && data.campaign) {
        setCampaigns((prev) => [data.campaign, ...prev]);
        setCopilotPrompt('');
        addNotification(`Campaign "${newCamp.name}" launched successfully!`, 'success');
        navigate('/dashboard/campaigns');
      }
    } catch (err) {
      console.error('Campaign launch failed', err);
      addNotification(err.message || 'Campaign launch failed.', 'risk');
    }
  };

  if (workspacesLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#faf8ff]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-500">Loading workspaces...</p>
        </div>
      </div>
    );
  }



  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];

  if (!activeWorkspace) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#faf8ff]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-[#faf8ff] bg-dot-pattern bg-grid-subtle text-gray-800 font-sans">
      
      {/* Ambient Empty Space Particles */}
      <div className="ambient-particles-container">
        {Array.from({ length: 15 }).map((_, i) => (
          <div 
            key={i} 
            className="ambient-dot" 
            style={{ 
              width: `${Math.random() * 4 + 2}px`, 
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${Math.random() * 20 + 15}s`
            }} 
          />
        ))}
      </div>

      {/* 1. Sidebar Left */}
      <Sidebar 
        currentView={currentView}
        onViewChange={(view) => {
          handleNavigateView(view);
          setIsMobileSidebarOpen(false);
        }}
        onLogout={onBack}
        user={user}
        workspace={activeWorkspace}
        onResetWorkspace={handleResetWorkspace}
        unreadNotificationCount={notifications.filter(n => !n.read).length}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Right Column Container */}
      <div className="flex-1 min-w-0 h-full flex flex-col relative overflow-hidden">
        
        {/* 2. Top Header Navbar */}
        <TopHeader 
          user={user}
          onSearch={(val) => console.log('Searching for:', val)}
          onOpenGrowthStudio={() => navigate('/dashboard/growth-studio')}
          workspace={activeWorkspace}
          workspaces={workspaces}
          onSelectWorkspace={handleSelectWorkspace}
          onCreateWorkspace={handleCreateWorkspace}
          onRenameWorkspace={handleRenameWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
          onDuplicateWorkspace={handleDuplicateWorkspace}
          onArchiveWorkspace={handleArchiveWorkspace}
          onRerunAnalysis={handleRerunAnalysis}
          onImportDataset={handleImportDataset}
          role={role}
          onChangeRole={handleRoleChange}
          notifications={notifications}
          onDismissNotification={handleDismissNotification}
          onClearAllNotifications={handleClearAllNotifications}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
          isLoading={skeletonLoading}
        />

        {/* 3. Main Workspace Area */}
        <main className="flex-1 min-h-0 p-4 md:p-8 overflow-y-auto custom-scrollbar relative z-10">
          <Routes>
            <Route 
              path="/" 
              element={
                <DashboardOverview 
                  onNavigateToView={handleNavigateView}
                  onGenerateCampaign={(text) => {
                    setCopilotPrompt(text);
                    navigate('/dashboard/growth-studio');
                  }}
                  kpis={kpis}
                  simMetrics={simMetrics}
                  workspace={activeWorkspace}
                  timestamps={workspaceTimestamps}
                  logs={simLogs}
                  campaigns={campaigns}
                  segments={segments}
                  role={role}
                  isLoading={skeletonLoading}
                />
              } 
            />

            <Route 
              path="insights"
              element={
                <AiInsightsHub 
                  onNavigateToView={handleNavigateView}
                  onGenerateCampaign={(text) => {
                    setCopilotPrompt(text);
                    navigate('/dashboard/growth-studio');
                  }}
                  role={role}
                />
              }
            />

            <Route 
              path="customers" 
              element={
                <CustomersPage 
                  customers={customers}
                  activeCustomerId={activeCustomerId}
                  clearActiveCustomerId={() => setActiveCustomerId(null)}
                />
              } 
            />

            <Route 
              path="segments" 
              element={
                <SegmentsPage 
                  onNavigateToView={handleNavigateView}
                  onGenerateCampaign={(text) => {
                    setCopilotPrompt(text);
                    navigate('/dashboard/growth-studio');
                  }}
                  customers={customers}
                  segments={segments}
                  isLoading={skeletonLoading}
                />
              } 
            />

            <Route 
              path="growth-studio" 
              element={
                <GrowthStudioPage 
                  initialPrompt={copilotPrompt}
                  onLaunchCampaign={handleLaunchNewCampaign}
                  role={role}
                />
              } 
            />

            <Route 
              path="campaigns" 
              element={
                <CampaignsPage 
                  campaigns={campaigns}
                  activeCampaignId={activeCampaignId}
                  clearActiveCampaignId={() => setActiveCampaignId(null)}
                />
              } 
            />

            <Route 
              path="analytics" 
              element={<AnalyticsPage campaigns={campaigns} analyticsData={analyticsData} isLoading={skeletonLoading} />}
            />

            <Route 
              path="simulator" 
              element={
                <CampaignActivityCenter 
                  metrics={simMetrics}
                  logs={simLogs}
                  onClearLogs={() => setSimLogs([])}
                  isPaused={isPaused}
                  onTogglePause={() => setIsPaused(!isPaused)}
                  speed={simSpeed}
                  onToggleSpeed={() => setSimSpeed(prev => prev === 2 ? 4 : prev === 4 ? 6 : 2)}
                  onOpenCampaign={(campId) => {
                    setActiveCampaignId(campId);
                    navigate('/dashboard/campaigns');
                  }}
                  onOpenCustomer={(custId) => {
                    setActiveCustomerId(custId);
                    navigate('/dashboard/customers');
                  }}
                />
              } 
            />

            <Route 
              path="settings" 
              element={
                <SettingsPage 
                  onResetWorkspace={handleResetWorkspace}
                  workspace={activeWorkspace}
                  timestamps={workspaceTimestamps}
                  onImport={() => handleImportDataset(activeWorkspaceId)}
                  onAnalyze={() => handleRerunAnalysis(activeWorkspaceId)}
                  role={role}
                  onRenameWorkspace={handleRenameWorkspace}
                  onDeleteWorkspace={handleDeleteWorkspace}
                  onDuplicateWorkspace={handleDuplicateWorkspace}
                  onArchiveWorkspace={handleArchiveWorkspace}
                />
              } 
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Background Ambient Glow Nodes */}
      <div className="glow-node bg-indigo-500/10 w-[500px] h-[500px] -top-40 -left-40 pointer-events-none" />
      <div className="glow-node bg-purple-500/10 w-[600px] h-[600px] bottom-10 right-20 pointer-events-none" />
      <div className="glow-node bg-cyan-400/5 w-[400px] h-[400px] top-1/2 left-1/3 pointer-events-none" />

      {/* Onboarding Wizard Modal Backdrop (For creating workspace from top bar) */}
      {isCreatingNewWorkspace && (
        <div className="fixed inset-0 z-50 bg-gray-950/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <OnboardingWizard 
            onComplete={handleOnboardingComplete}
            onCancel={() => setIsCreatingNewWorkspace(false)}
            isSubmitting={isOnboardingSubmitting}
            error={onboardingError}
          />
        </div>
      )}

      {/* Re-analysis Simulation Wizard Modal */}
      {reanalysisWorkspaceId && (
        <div className="fixed inset-0 z-50 bg-gray-950/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <OnboardingWizard 
            initialStep={3}
            onComplete={async () => {
              setWorkspaceTimestamps(prev => ({
                ...prev,
                lastAnalysis: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today',
                lastRefresh: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today'
              }));
              addNotification('AI behavioral models successfully re-compiled.', 'success');
              setReanalysisWorkspaceId(null);
              if (activeWorkspaceId) await loadWorkspaceData(activeWorkspaceId);
            }}
            onCancel={() => setReanalysisWorkspaceId(null)}
          />
        </div>
      )}

      {/* Dataset Import Simulation Wizard Modal */}
      {importWorkspaceId && (
        <div className="fixed inset-0 z-50 bg-gray-950/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <OnboardingWizard 
            initialStep={2}
            onComplete={async () => {
              setWorkspaceTimestamps(prev => ({
                ...prev,
                lastUpload: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today',
                lastAnalysis: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today',
                lastRefresh: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today'
              }));
              addNotification('New dataset successfully imported and merged.', 'success');
              setImportWorkspaceId(null);
              if (activeWorkspaceId) await loadWorkspaceData(activeWorkspaceId);
            }}
            onCancel={() => setImportWorkspaceId(null)}
          />
        </div>
      )}

      {/* Globally Docked Floating AI Copilot */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end group">
        {/* Floating Chat Box */}
        {isFloatingCopilotOpen && (
          <div className="glass-panel w-80 md:w-96 h-[450px] mb-4 rounded-[2rem] border border-indigo-100 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="bg-indigo-950 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-cyan-400 animate-pulse">smart_toy</span>
                <span className="text-xs font-black tracking-wider uppercase">Xeno AI Assistant</span>
              </div>
              <button 
                onClick={() => setIsFloatingCopilotOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/25">
              {floatingChatLogs.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white border border-gray-150 text-gray-800 rounded-tl-none'
                  }`}>
                    {msg.text}
                    {msg.action && (
                      <button
                        onClick={() => {
                          setCopilotPrompt(msg.action.prompt);
                          navigate('/dashboard/growth-studio');
                          setIsFloatingCopilotOpen(false);
                        }}
                        className="mt-3 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-705 font-black text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1 border border-indigo-100"
                      >
                        <span className="material-symbols-outlined text-[12px]">rocket_launch</span>
                        {msg.action.label}
                      </button>
                    )}
                  </div>
                  <span className="text-[9px] text-gray-400 font-bold mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}
              {isFloatingAiTyping && (
                <div className="flex items-center gap-1 bg-white border border-gray-150 p-3 rounded-2xl rounded-tl-none w-20 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              )}
            </div>

            {/* Suggestion chips */}
            {floatingChatLogs.length <= 1 && !isFloatingAiTyping && (
              <div className="px-4 py-2 border-t border-gray-100 bg-white/50 flex flex-wrap gap-1.5">
                <button 
                  onClick={() => handleSendChip("Who should I target this week?")}
                  className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1.5 hover:bg-indigo-100 transition-colors"
                >
                  Who to target?
                </button>
                <button 
                  onClick={() => handleSendChip("What campaign should I launch?")}
                  className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1.5 hover:bg-indigo-100 transition-colors"
                >
                  What to launch?
                </button>
                <button 
                  onClick={() => handleSendChip("Show customers likely to churn.")}
                  className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1.5 hover:bg-indigo-100 transition-colors"
                >
                  Show churn risk
                </button>
              </div>
            )}

            {/* Input Bar */}
            <form onSubmit={handleFloatingSubmit} className="p-3 border-t border-gray-150 bg-white flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask AI Copilot..."
                value={floatingInput}
                onChange={(e) => setFloatingInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
              <button
                type="submit"
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-800 text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
              </button>
            </form>
          </div>
        )}

        {/* Floating Action Button */}
        <div className="relative">
          <button
            onClick={() => setIsFloatingCopilotOpen(!isFloatingCopilotOpen)}
            className={`premium-hover-lift w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_12px_24px_rgba(79,70,229,0.3)] transition-transform border-none relative overflow-hidden group/fab floating-1 ${
              isFloatingCopilotOpen ? 'bg-indigo-950' : 'bg-gradient-to-tr from-indigo-600 via-indigo-755 to-purple-600'
            }`}
          >
            <span className="absolute inset-0 bg-white/20 opacity-0 group-hover/fab:opacity-100 transition-opacity rounded-full"></span>
            
            {isFloatingCopilotOpen ? (
              <span className="material-symbols-outlined text-[24px] relative z-10">close</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[24px] animate-pulse relative z-10">smart_toy</span>
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-400 border-2 border-white rounded-full z-10 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span>
              </>
            )}
          </button>
          
          {/* Tooltip */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
            {isFloatingCopilotOpen ? 'Close AI Assistant' : 'Ask AI Copilot'}
            <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-l-4 border-l-gray-900"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
