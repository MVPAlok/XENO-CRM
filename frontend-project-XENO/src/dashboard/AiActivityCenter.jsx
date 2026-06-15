import React, { useState, useEffect } from 'react';

export default function AiActivityCenter({
  notifications = [],
  onDismissNotification,
  onClearAllNotifications,
  isOpen,
  onToggle
}) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [isProcessing, setIsProcessing] = useState(false);

  const filters = ['All', 'Campaigns', 'Insights', 'Customers', 'Simulator', 'Revenue'];

  // Simulate AI processing occasionally
  useEffect(() => {
    const interval = setInterval(() => {
      setIsProcessing(true);
      setTimeout(() => setIsProcessing(false), 2000);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getFilteredNotifications = () => {
    if (activeFilter === 'All') return notifications;
    // Map existing notification text to pseudo-categories for the demo
    return notifications.filter(n => {
      const text = n.text.toLowerCase();
      if (activeFilter === 'Campaigns') return text.includes('campaign');
      if (activeFilter === 'Insights') return text.includes('detected') || text.includes('model') || text.includes('role');
      if (activeFilter === 'Customers') return text.includes('purchased') || text.includes('customer');
      if (activeFilter === 'Simulator') return text.includes('simulat');
      if (activeFilter === 'Revenue') return text.includes('₹') || text.includes('revenue');
      return true;
    });
  };

  const filteredNotifs = getFilteredNotifications();

  return (
    <div className="relative">
      {/* AI Activity Bell */}
      <button 
        onClick={onToggle}
        className={`relative p-2.5 rounded-xl transition-all duration-300 shadow-sm flex items-center justify-center
          ${isOpen ? 'bg-indigo-50 border border-indigo-200 text-indigo-600' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:shadow-md'}
        `}
        style={{
          boxShadow: isOpen ? '0 0 15px rgba(168, 85, 247, 0.15)' : ''
        }}
      >
        {isProcessing && (
          <div className="absolute inset-0 rounded-xl border border-dashed border-purple-400 opacity-50 animate-[spin_4s_linear_infinite]" style={{ margin: '-4px' }} />
        )}
        
        <span className="material-symbols-outlined text-[20px] transition-transform duration-300" 
              style={{ transform: isOpen ? 'rotate(15deg) scale(1.1)' : 'rotate(0deg) scale(1)' }}>
          notifications
        </span>
        
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 pointer-events-none">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 opacity-60 animate-ping" />
            <div className="relative w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] text-white font-black shadow-sm"
                 style={{ background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          </div>
        )}
      </button>

      {/* Solid Dropdown */}
      {isOpen && (
        <div className="absolute top-12 right-0 w-[400px] rounded-[24px] bg-white shadow-[0_24px_50px_-12px_rgba(79,70,229,0.15)] py-4 z-50 animate-in fade-in slide-in-from-top-3 zoom-in-95 duration-200 flex flex-col max-h-[500px] overflow-hidden border border-gray-100">
          
          {/* Header */}
          <div className="px-5 pb-3 border-b border-gray-100/50 flex justify-between items-end shrink-0">
            <div>
              <h3 className="text-[13px] font-extrabold text-gray-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-purple-500">auto_awesome</span>
                AI Intelligence Feed
              </h3>
              <p className="text-[9px] text-gray-400 font-semibold mt-0.5">Last updated: Just now</p>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={onClearAllNotifications}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50/50 hover:bg-indigo-100 px-2 py-1 rounded-md"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="px-4 py-2.5 overflow-x-auto custom-scrollbar shrink-0 border-b border-gray-100/50">
            <div className="flex items-center gap-1.5 min-w-max">
              {filters.map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                    activeFilter === filter 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' 
                      : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Executive AI Summary (Only on "All") */}
          {activeFilter === 'All' && (
            <div className="mx-4 mt-3 mb-2 p-3 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/80 border border-indigo-100/50 shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[14px] text-indigo-600">bolt</span>
                <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wider">Today's AI Summary</span>
              </div>
              <p className="text-[11px] font-medium text-indigo-800/80 leading-snug">
                Xeno AI has processed 1.2M data points. Detected 1 conversion anomaly and successfully launched 1 automated campaign.
              </p>
            </div>
          )}

          {/* Event Stream */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-2">
            {filteredNotifs.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-center px-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-[24px] text-indigo-300">check_circle</span>
                </div>
                <h4 className="text-xs font-bold text-gray-700">All caught up!</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Xeno AI is actively monitoring your workspace.</p>
              </div>
            ) : (
              filteredNotifs.map((notif) => {
                const isRisk = notif.type === 'risk';
                const isSuccess = notif.type === 'success';
                
                return (
                  <div 
                    key={notif.id}
                    className={`group p-3 rounded-2xl transition-all relative text-left border ${
                      notif.read 
                        ? 'bg-white border-gray-100 hover:border-gray-200' 
                        : 'bg-white border-purple-100 shadow-[0_4px_12px_rgba(168,85,247,0.05)]'
                    }`}
                  >
                    {!notif.read && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-r-md" />
                    )}
                    <div className="flex items-start gap-3 pl-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isRisk ? 'bg-rose-50 text-rose-500' : isSuccess ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-500'
                      }`}>
                        <span className="material-symbols-outlined text-[16px]">
                          {isRisk ? 'warning' : isSuccess ? 'verified' : 'insights'}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                            {isRisk ? 'Critical Alert' : isSuccess ? 'Action Complete' : 'AI Insight'}
                          </span>
                          <span className="text-[9px] text-gray-400 font-medium">{notif.time}</span>
                        </div>
                        <p className={`text-[12px] leading-tight ${notif.read ? 'text-gray-600 font-medium' : 'text-gray-900 font-bold'}`}>
                          {notif.text}
                        </p>
                        
                        {/* Smart Actions */}
                        <div className="mt-2.5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="px-2.5 py-1 text-[10px] font-bold text-white bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors">
                            View Details
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDismissNotification(notif.id);
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
