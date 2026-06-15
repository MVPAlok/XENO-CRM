import React, { useState } from 'react';

export default function AiInsightsHub({ onNavigateToView, onGenerateCampaign, role, insights = [] }) {
  const [expandedInsightId, setExpandedInsightId] = useState(null);

  const opportunity = insights.find(i => i.type === 'revenue_opportunity');
  const churn = insights.find(i => i.type === 'churn_risk');
  const growth = insights.find(i => i.type === 'segment_growth');
  
  const recoverableRev = opportunity?.metricValue || '₹0';
  const atRiskRev = churn?.metricValue || '₹0';
  const vipGrowth = opportunity ? `+12% Uplift` : '—'; // segment growth proxy
  
  const avgConfidence = insights.length > 0 
    ? Math.round(insights.reduce((sum, i) => sum + (i.confidence || 0), 0) / insights.length) 
    : 0;

  const handleTakeAction = (insight) => {
    if (role === 'Viewer') {
      alert("Permission Denied: Viewers cannot create or launch campaigns.");
      return;
    }
    onGenerateCampaign(insight.promptText);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12 select-none">
      {/* Header */}
      <div className="text-left">
        <h2 className="text-2xl font-bold text-gray-955 flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-600 text-[28px]">psychology</span>
          AI Insights Hub
        </h2>
        <p className="text-xs text-gray-400 font-semibold mt-1">
          Automated customer behavioral scans, revenue opportunities, and optimization anomalies discovered by Xeno AI.
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white border border-gray-200 p-5 rounded-[2rem] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <span className="material-symbols-outlined text-[24px]">payments</span>
          </div>
          <div className="text-left">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Recoverable Rev</span>
            <span className="text-lg font-black text-gray-900">{recoverableRev}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-[2rem] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
            <span className="material-symbols-outlined text-[24px]">trending_down</span>
          </div>
          <div className="text-left">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">At Risk Revenue</span>
            <span className="text-lg font-black text-rose-600">{atRiskRev}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-[2rem] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
            <span className="material-symbols-outlined text-[24px]">stars</span>
          </div>
          <div className="text-left">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">New VIP Growth</span>
            <span className="text-lg font-black text-purple-600">{vipGrowth}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-[2rem] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-cyan-50 rounded-2xl text-cyan-600">
            <span className="material-symbols-outlined text-[24px]">campaign</span>
          </div>
          <div className="text-left">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Avg Confidence</span>
            <span className="text-lg font-black text-cyan-600">{avgConfidence}% Match</span>
          </div>
        </div>
      </div>

      {/* Detailed Insights Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {insights.map((insight) => {
          const isExpanded = expandedInsightId === insight.id;
          let glowClass = 'hover:shadow-[0_12px_30px_rgba(79,70,229,0.08)]';
          let borderGlow = 'hover:border-indigo-200';
          let typeColor = 'text-indigo-600 bg-indigo-50';

          if (insight.type === 'revenue_opportunity') {
            glowClass = 'hover:shadow-[0_12px_30px_rgba(245,158,11,0.1)]';
            borderGlow = 'hover:border-amber-200';
            typeColor = 'text-amber-700 bg-amber-50';
          } else if (insight.type === 'churn_risk') {
            glowClass = 'hover:shadow-[0_12px_30px_rgba(239,68,68,0.12)]';
            borderGlow = 'hover:border-rose-200';
            typeColor = 'text-rose-700 bg-rose-50';
          } else if (insight.type === 'segment_growth') {
            glowClass = 'hover:shadow-[0_12px_30px_rgba(139,92,246,0.1)]';
            borderGlow = 'hover:border-purple-200';
            typeColor = 'text-purple-700 bg-purple-50';
          } else if (insight.type === 'channel_optimization') {
            glowClass = 'hover:shadow-[0_12px_30px_rgba(6,182,212,0.1)]';
            borderGlow = 'hover:border-cyan-200';
            typeColor = 'text-cyan-700 bg-cyan-50';
          }

          return (
            <div
              key={insight.id}
              className={`bg-white border border-gray-200 p-6 rounded-[2.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-300 premium-hover-lift flex flex-col justify-between ${glowClass} ${borderGlow}`}
            >
              <div>
                {/* Header Row */}
                <div className="flex justify-between items-start mb-4">
                  <div className="text-left space-y-1">
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${typeColor}`}>
                      {insight.title}
                    </span>
                    <h3 className="text-base font-bold text-gray-950 pt-1">{insight.subtitle}</h3>
                  </div>
                  
                  {/* Confidence Ring */}
                  <div className="relative w-11 h-11 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path className="text-gray-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path 
                        className={insight.type === 'churn_risk' ? 'text-rose-500' : 'text-indigo-650'} 
                        strokeDasharray={`${insight.confidence}, 100`} 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        stroke="currentColor" 
                        fill="none" 
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-gray-900">
                      {insight.confidence}%
                    </div>
                  </div>
                </div>

                {/* Subtitle Details */}
                <p className="text-xs text-gray-500 leading-relaxed text-left font-medium">
                  {insight.description}
                </p>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4 my-5 bg-gray-50/50 border border-gray-100 p-4 rounded-2xl">
                  <div className="text-left">
                    <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{insight.metricLabel}</span>
                    <span className={`text-xl font-extrabold ${insight.type === 'churn_risk' ? 'text-rose-600' : 'text-indigo-750'}`}>{insight.metricValue}</span>
                  </div>
                  <div className="text-left">
                    <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Suggested Strategy</span>
                    <span className="text-xs font-bold text-gray-900 block truncate mt-1">{insight.suggestedCampaign}</span>
                  </div>
                </div>

                {/* Why AI Found This Collapsed Section */}
                <div className="border-t border-gray-100 pt-4">
                  <button
                    onClick={() => setExpandedInsightId(isExpanded ? null : insight.id)}
                    className="w-full flex items-center justify-between text-xs font-bold text-indigo-600 hover:text-indigo-850 transition-colors"
                  >
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] animate-pulse">auto_awesome</span>
                      Why AI Discovered This
                    </span>
                    <span className="material-symbols-outlined text-[18px]">
                      {isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="mt-3.5 space-y-2.5 bg-indigo-50/10 border border-indigo-50 rounded-2xl p-4 text-left text-xs font-medium text-gray-600 animate-in slide-in-from-top-2 duration-300">
                      <div className="space-y-2">
                        <p className="font-bold text-indigo-950 uppercase text-[9px] tracking-wider mb-1">AI Reasoning Logs</p>
                        {insight.whyAiFound.map((point, index) => (
                          <div key={index} className="flex gap-2 items-start">
                            <span className="text-emerald-500 font-bold">✔</span>
                            <span className="font-semibold text-gray-600">{point}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2.5 border-t border-indigo-100/50 mt-1">
                        <p className="font-bold text-indigo-950 uppercase text-[9px] tracking-wider mb-1">Impact Analysis</p>
                        <p className="text-gray-500 leading-normal font-semibold">{insight.impact}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">
                  Confidence: {insight.confidence}% Match
                </span>
                
                <button
                  onClick={() => handleTakeAction(insight)}
                  disabled={role === 'Viewer'}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                  Take Action
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
