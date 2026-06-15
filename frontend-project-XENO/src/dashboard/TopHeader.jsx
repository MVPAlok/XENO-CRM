import React, { useState, useEffect } from 'react';
import AiActivityCenter from './AiActivityCenter';

export default function TopHeader({ 
  user, 
  onSearch, 
  onOpenGrowthStudio, 
  workspace, 
  workspaces = [], 
  onSelectWorkspace, 
  onCreateWorkspace, 
  onRenameWorkspace, 
  onDeleteWorkspace, 
  onDuplicateWorkspace, 
  onArchiveWorkspace, 
  onRerunAnalysis,
  onImportDataset,
  role = 'Admin', 
  onChangeRole,
  notifications = [],
  onDismissNotification,
  onClearAllNotifications,
  onToggleMobileSidebar
}) {
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [activeActionsWorkspaceId, setActiveActionsWorkspaceId] = useState(null);

  // Typing effect for search placeholder
  const placeholders = [
    "Ask anything about customers...",
    "Search for churn risk segments...",
    "Find VIP expansion opportunities...",
    "Analyze last week's revenue..."
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-[5.5rem] shrink-0 bg-white/70 backdrop-blur-xl flex items-center justify-between px-3 md:px-8 sticky top-0 z-20 select-none relative">
      {/* Faint bottom border gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-indigo-200/30 via-purple-300/40 to-indigo-100/35" />

      {/* Brand & Store Selector */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile Hamburger Menu */}
        <button 
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-1.5 md:p-2 -ml-1 md:-ml-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>
        <div className="relative">
          <button
            onClick={() => {
              setShowWorkspaceDropdown(!showWorkspaceDropdown);
              setShowRoleDropdown(false);
              setShowNotificationDropdown(false);
            }}
            className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3.5 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all font-bold text-[11px] md:text-xs text-gray-750 shadow-xs premium-hover-lift"
          >
            <span className="material-symbols-outlined text-[16px] text-indigo-500 hidden sm:block">storefront</span>
            <span className="truncate max-w-[80px] sm:max-w-[120px]">
              {workspace ? workspace.brandName : 'No Workspace'}
            </span>
            {workspace && workspace.isArchived && (
              <span className="text-[8px] bg-gray-100 text-gray-400 px-1 py-0.2 rounded font-extrabold ml-1 uppercase hidden sm:inline-block">Archived</span>
            )}
            <span className="material-symbols-outlined text-[16px] text-gray-400">keyboard_arrow_down</span>
          </button>
          
          {showWorkspaceDropdown && (
            <div className="absolute top-11 left-0 w-64 border border-gray-200/80 rounded-[1.5rem] bg-white shadow-xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-250">
              <div className="px-4 pb-2 border-b border-gray-100 flex justify-between items-center">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Brand Workspaces</span>
                {role === 'Admin' && (
                  <button 
                    onClick={() => {
                      onCreateWorkspace();
                      setShowWorkspaceDropdown(false);
                    }}
                    className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                  >
                    <span className="material-symbols-outlined text-[10px]">add</span> Create
                  </button>
                )}
              </div>

              {workspaces.length === 0 ? (
                <div className="py-4 px-4 text-center text-xs text-gray-450 italic font-semibold">
                  No Workspace Created
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto custom-scrollbar my-1.5">
                  {workspaces.map((ws) => {
                    const isActive = workspace?.id === ws.id;
                    const isWorkspaceActionsOpen = activeActionsWorkspaceId === ws.id;

                    return (
                      <div 
                        key={ws.id}
                        className={`group/ws-row relative flex items-center justify-between px-3 py-1.5 mx-1.5 rounded-xl transition-all ${
                          isActive ? 'bg-indigo-50/45 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <button
                          onClick={() => {
                            onSelectWorkspace(ws.id);
                            setShowWorkspaceDropdown(false);
                          }}
                          className="flex-1 text-left text-xs font-bold truncate pr-6"
                        >
                          {ws.brandName}
                          {ws.isArchived && (
                            <span className="text-[8px] text-gray-400 ml-1.5 font-bold uppercase">(Archived)</span>
                          )}
                        </button>

                        {/* Actions button */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveActionsWorkspaceId(isWorkspaceActionsOpen ? null : ws.id);
                            }}
                            className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">more_vert</span>
                          </button>

                          {/* Mini Context Actions Menu */}
                          {isWorkspaceActionsOpen && (
                            <div className="absolute right-0 top-6 w-40 bg-white border border-gray-150 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionsWorkspaceId(null);
                                  const name = prompt("Rename workspace:", ws.brandName);
                                  if (name && name.trim()) onRenameWorkspace(ws.id, name.trim());
                                }}
                                className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-gray-650 hover:bg-gray-50 hover:text-indigo-650 flex items-center gap-1.5"
                              >
                                <span className="material-symbols-outlined text-[12px]">edit</span> Rename Workspace
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionsWorkspaceId(null);
                                  onDuplicateWorkspace(ws.id);
                                }}
                                className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-gray-650 hover:bg-gray-50 hover:text-indigo-650 flex items-center gap-1.5"
                              >
                                <span className="material-symbols-outlined text-[12px]">content_copy</span> Duplicate Workspace
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionsWorkspaceId(null);
                                  onArchiveWorkspace(ws.id);
                                }}
                                className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-gray-655 hover:bg-gray-50 hover:text-indigo-650 flex items-center gap-1.5"
                              >
                                <span className="material-symbols-outlined text-[12px]">archive</span> {ws.isArchived ? 'Unarchive' : 'Archive'}
                              </button>
                              {role === 'Admin' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveActionsWorkspaceId(null);
                                    if (confirm(`Are you sure you want to delete ${ws.brandName}?`)) {
                                      onDeleteWorkspace(ws.id);
                                    }
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 border-t border-gray-100"
                                >
                                  <span className="material-symbols-outlined text-[12px]">delete</span> Delete Workspace
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {workspace && (
                <div className="mt-1.5 pt-1.5 border-t border-gray-100 px-2 space-y-0.5">
                  <button
                    onClick={() => {
                      onRerunAnalysis(workspace.id);
                      setShowWorkspaceDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[10px] font-extrabold text-indigo-600 hover:bg-indigo-50/50 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">psychology</span>
                    Re-run AI Analysis
                  </button>
                  <button
                    onClick={() => {
                      onImportDataset(workspace.id);
                      setShowWorkspaceDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[10px] font-extrabold text-blue-600 hover:bg-blue-50/50 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">upload_file</span>
                    Import New Dataset
                  </button>
                </div>
              )}
              
              <div className="px-2 pt-2 border-t border-gray-100 mt-2">
                <button
                  onClick={() => {
                    onCreateWorkspace();
                    setShowWorkspaceDropdown(false);
                  }}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-705 font-extrabold text-[10px] rounded-xl transition-all flex items-center justify-center gap-1 border border-indigo-100"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Create Workspace
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Search Bar */}
      <div className="flex-1 max-w-lg mx-2 md:mx-8 hidden sm:block group">
        <div className="relative flex items-center transition-all duration-300">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-xl blur opacity-0 group-focus-within:opacity-40 transition-opacity duration-300 pointer-events-none" />
          
          <span className="material-symbols-outlined absolute left-4 text-[18px] text-indigo-500 sparkle-pulse-icon pointer-events-none z-10">auto_awesome</span>
          <input
            type="text"
            onChange={(e) => onSearch && onSearch(e.target.value)}
            placeholder={placeholders[placeholderIndex]}
            className="relative z-10 w-full pl-11 pr-4 py-3 text-xs bg-gray-50/80 border border-gray-200 rounded-xl shadow-inner-soft focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none transition-all duration-500 placeholder:text-gray-400 font-semibold"
          />
        </div>
      </div>

      {/* Utility Panel */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Role Selector Dropdown */}
        <div className="relative hidden md:block">
          <button
            onClick={() => {
              setShowRoleDropdown(!showRoleDropdown);
              setShowWorkspaceDropdown(false);
              setShowNotificationDropdown(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-105 rounded-xl bg-indigo-50/30 hover:bg-indigo-50/60 transition-all font-bold text-xs text-indigo-700"
          >
            <span className="material-symbols-outlined text-[15px]">shield_person</span>
            <span>Role: {role}</span>
            <span className="material-symbols-outlined text-[14px]">keyboard_arrow_down</span>
          </button>

          {showRoleDropdown && (
            <div className="absolute top-11 right-0 w-48 border border-gray-200/80 rounded-xl bg-white shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-250">
              <div className="px-3 py-1 border-b border-gray-100 mb-1">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Simulate Role</span>
              </div>
              {['Admin', 'Marketing Manager', 'Analyst', 'Viewer'].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    onChangeRole(r);
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-indigo-50/50 hover:text-indigo-650 transition-colors flex items-center justify-between ${
                    role === r ? 'text-indigo-600 bg-indigo-50/20' : 'text-gray-605'
                  }`}
                >
                  <span>{r}</span>
                  {role === r && <span className="material-symbols-outlined text-[14px] text-indigo-600">check</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* AI Assistant shortcut */}
        <button
          onClick={onOpenGrowthStudio}
          className="premium-gradient-btn hidden sm:flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-[0_4px_14px_0_rgba(124,58,237,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_0_rgba(124,58,237,0.4)] active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px] text-cyan-300 sparkle-pulse-icon">auto_awesome</span>
          <span>Ask Growth Studio</span>
        </button>

        {/* Notifications Popover */}
        <AiActivityCenter 
          notifications={notifications}
          onDismissNotification={onDismissNotification}
          onClearAllNotifications={onClearAllNotifications}
          isOpen={showNotificationDropdown}
          onToggle={() => {
            setShowNotificationDropdown(!showNotificationDropdown);
            setShowWorkspaceDropdown(false);
            setShowRoleDropdown(false);
          }}
        />

        {/* User Info */}
        <div className="flex items-center gap-2.5 pl-2 md:pl-3 border-l border-gray-200/50">
          <img
            alt={user?.firstName || 'User'}
            className="w-8 h-8 rounded-full border border-gray-150 object-cover"
            src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstName || 'Admin'}`}
          />
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-gray-900">{user?.firstName ? `${user.firstName} ${user.lastName}` : 'Sarah Jenkins'}</p>
            <span className="text-[9px] text-indigo-650 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
              {role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
