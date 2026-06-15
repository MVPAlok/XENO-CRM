import React from 'react';
import Logo from '../components/Logo';

export default function Sidebar({ 
  currentView, 
  onViewChange, 
  onLogout, 
  user, 
  workspace, 
  onResetWorkspace,
  unreadNotificationCount = 0,
  isMobileOpen,
  onCloseMobile
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'insights', label: 'AI Insights', icon: 'psychology', badge: unreadNotificationCount },
    { id: 'customers', label: 'Customers', icon: 'group' },
    { id: 'segments', label: 'Segments', icon: 'target' },
    { id: 'growth-studio', label: 'Growth Studio', icon: 'smart_toy' },
    { id: 'campaigns', label: 'Campaigns', icon: 'campaign' },
    { id: 'analytics', label: 'Analytics', icon: 'monitoring' },
    { id: 'simulator', label: 'Activity Center', icon: 'dns' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 w-64 border-r border-gray-150/40 bg-gradient-to-b from-white/95 via-white/85 to-indigo-50/10 backdrop-blur-xl flex flex-col h-screen shrink-0 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Brand Header */}
      <div className="h-[5.5rem] border-b border-gray-150/40 flex items-center px-6 gap-3 relative">
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-indigo-200/20 via-purple-200/30 to-indigo-100/20" />
        <div className="flex items-center justify-center">
          <Logo className="w-8 h-8 drop-shadow-md" />
        </div>
        <div className="text-left">
          <h1 className="text-sm font-black text-gray-905 leading-tight truncate max-w-[150px]">
            {workspace ? workspace.brandName : 'Xeno AI'}
          </h1>
          <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider truncate max-w-[150px]">
            {workspace ? workspace.industry : 'Campaign Console'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all duration-300 relative overflow-hidden ${
                isActive
                  ? 'sidebar-active-item scale-[1.015]'
                  : 'text-gray-500 hover:text-gray-900 hover:translate-x-1'
              }`}
            >
              {/* Soft background slide on hover */}
              {!isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              )}
              
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[60%] w-[4px] rounded-r-lg bg-indigo-600 shadow-[0_0_12px_rgba(79,70,229,0.8)] transition-all pointer-events-none" />
              )}
              <span className={`material-symbols-outlined text-[20px] transition-transform relative z-10 ${isActive ? 'text-indigo-600 scale-105' : 'text-gray-400 group-hover:text-indigo-500 group-hover:scale-105'}`}>
                {item.icon}
              </span>
              <span className={`relative z-10 ${isActive ? 'text-indigo-950 font-extrabold' : ''}`}>{item.label}</span>
              
              {item.badge > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black shadow-[0_0_8px_rgba(244,63,94,0.6)] relative z-10 pointer-events-none">
                  {item.badge}
                </span>
              )}

              {isActive && !item.badge && (
                <div className="absolute right-3.5 w-1.5 h-1.5 rounded-full bg-indigo-600 shadow-[0_0_6px_rgba(79,70,229,0.8)] pointer-events-none" />
              )}
            </button>
          );
        })}
      </nav>

      {/* AI Status section */}
      <div className="px-5 py-4 mx-4 my-2 border border-emerald-100/50 bg-emerald-50/15 rounded-2xl flex flex-col gap-2.5 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 pointer-events-none">
            <span className="animate-pulse absolute inset-0 rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          </span>
          <span className="text-[9px] font-black text-emerald-800 tracking-widest uppercase text-left">
            AI Engine Online
          </span>
        </div>
        <div className="space-y-1.5 text-left">
          <div className="flex justify-between text-[10px] font-semibold text-gray-500">
            <span>Accuracy</span>
            <span className="font-extrabold text-emerald-700">94% Prediction</span>
          </div>
          <div className="flex justify-between text-[10px] font-semibold text-gray-500">
            <span>Opportunities</span>
            <span className="font-extrabold text-indigo-700">4 Active Hub</span>
          </div>
        </div>
      </div>

      {/* User Session Profile Card Footer */}
      <div className="p-4 border-t border-gray-200/50 bg-gray-50/40">
        <div className="flex items-center gap-3 mb-4 text-left">
          <img
            alt={user?.firstName || 'User'}
            className="w-10 h-10 rounded-full border border-gray-200 object-cover"
            src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstName || 'Admin'}`}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-905 truncate">
              {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Sarah Jenkins'}
            </p>
            <p className="text-[10px] text-gray-400 font-bold truncate">
              {user?.email || 'sarah.j@xeno.ai'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {workspace && (
            <button
              onClick={onResetWorkspace}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 border border-gray-200 hover:bg-gray-100 text-gray-550 rounded-xl font-bold text-[10px] transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">restart_alt</span>
              Reset Workspace
            </button>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-red-200 hover:bg-red-50/80 text-red-600 rounded-xl font-bold text-[11px] transition-all hover:scale-[1.01]"
          >
            <span className="material-symbols-outlined text-[15px]">logout</span>
            Sign Out
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
