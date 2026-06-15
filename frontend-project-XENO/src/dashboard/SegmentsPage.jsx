import React, { useState } from 'react';

const getSegmentDetails = (segment) => ({
  rule: segment.rules?.length
    ? segment.rules.map((r) => `${r.field} ${r.operator} ${r.value}`).join(' AND ')
    : segment.description || 'Custom filter rules',
  why: segment.description || 'Defined by segment configuration.',
  campaign: `Campaign for ${segment.name}`,
  channel: 'WhatsApp',
  source: segment.type === 'AUTO' ? 'AI Generated' : 'Created Manually'
});

const getSegmentCrmDetails = (segment) => ({
  members: [`${segment.count || 0} matched customers`],
  overlap: 'Computed from live workspace data',
  trend: `Revenue potential ₹${(segment.revenuePotential || 0).toLocaleString('en-IN')}`
});

export default function SegmentsPage({ onNavigateToView, onGenerateCampaign, segments = [], isLoading = false }) {
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [expandedSegmentId, setExpandedSegmentId] = useState(null);
  
  const handleViewCustomers = (segment) => {
    onNavigateToView('customers');
  };

  const handleGenerateCampaign = (segment) => {
    const details = getSegmentDetails(segment);
    onGenerateCampaign(`Build a campaign for ${segment.name}: "${segment.description}" targeting expected conversion of ${segment.expectedConversion} using ${details.channel}.`);
  };

  if (isLoading && segments.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoading && segments.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-sm font-semibold text-gray-500">No segments found. Create a workspace to generate AI segments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div className="text-left">
          <h2 className="text-xl font-bold text-gray-950">Intelligent Segments Lab</h2>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">Define, configure, and generate AI campaigns tailored to distinct shopper behaviors.</p>
        </div>
        <button
          onClick={() => onGenerateCampaign("Identify a brand new customer segment that is likely to buy high-value jackets this winter.")}
          className="flex items-center gap-1.5 px-4 py-2 border border-indigo-200/60 hover:border-indigo-300 text-indigo-650 bg-indigo-50/40 hover:bg-indigo-50 rounded-xl shadow-xs transition-all hover:scale-[1.02] font-bold text-xs"
        >
          <span className="material-symbols-outlined text-[16px] text-indigo-500">add_circle</span>
          Create Custom Segment
        </button>
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {segments.map((segment) => {
          const details = getSegmentDetails(segment);
          const crmDetails = getSegmentCrmDetails(segment);

          const isHovered = hoveredCardId === segment.id;
          const isExpanded = expandedSegmentId === segment.id;

          return (
            <div
              key={segment.id}
              onMouseEnter={() => setHoveredCardId(segment.id)}
              onMouseLeave={() => setHoveredCardId(null)}
              className="bg-white border border-gray-200 p-6 rounded-[2.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-300 premium-hover-lift flex flex-col justify-between hover:shadow-[0_12px_30px_rgba(79,70,229,0.08)] hover:border-indigo-200"
            >
              <div>
                {/* Header Row */}
                <div className="flex justify-between items-start mb-4">
                  <div className="text-left space-y-1">
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${
                      details.source === 'AI Generated' 
                        ? 'bg-indigo-50 text-indigo-600' 
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {details.source}
                    </span>
                    <h3 className="text-base font-bold text-gray-950 pt-1">{segment.name}</h3>
                  </div>
                  
                  {/* Confidence Ring */}
                  <div className="relative w-11 h-11 shrink-0" title="AI Confidence Score">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path className="text-gray-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path 
                        className="text-indigo-600" 
                        strokeDasharray={`${segment.confidenceScore}, 100`} 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        stroke="currentColor" 
                        fill="none" 
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-gray-900">
                      {segment.confidenceScore}%
                    </div>
                  </div>
                </div>

                {/* Subtitle Details */}
                <p className="text-xs text-gray-500 leading-relaxed text-left font-medium mb-5">
                  {segment.description}
                </p>

                {/* Cohort Insights */}
                <div className="flex flex-col gap-3 mb-5 border-b border-gray-100/60 pb-5">
                  {/* Preview Members */}
                  <div className="flex flex-wrap gap-1.5 justify-start">
                    <span className="text-gray-400 font-bold block uppercase text-[8px] tracking-widest w-full text-left mb-0.5">Preview Members</span>
                    {crmDetails.members.map(m => (
                      <span key={m} className="bg-white border border-gray-200 px-2 py-0.5 rounded-md font-bold text-[9px] text-gray-600 shadow-sm">{m}</span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[9px] text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">join_inner</span>
                      {crmDetails.overlap}
                    </span>
                    <span className="font-extrabold text-[9px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">trending_up</span>
                      {crmDetails.trend}
                    </span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4 my-5 bg-gray-50/50 border border-gray-100 p-4 rounded-2xl text-left">
                  <div>
                    <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Revenue Opportunity</span>
                    <span className="text-xl font-extrabold text-indigo-700">₹{segment.revenuePotential.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Expected Conv.</span>
                    <span className="text-xl font-extrabold text-emerald-600">{segment.expectedConversion}</span>
                  </div>
                </div>

                {/* Why AI Discovered This Collapsed Section */}
                <div className="border-t border-gray-100 pt-4">
                  <button
                    onClick={() => setExpandedSegmentId(isExpanded ? null : segment.id)}
                    className="w-full flex items-center justify-between text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
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
                    <div className="mt-3.5 space-y-3 bg-indigo-50/10 border border-indigo-50 rounded-2xl p-4 text-left text-xs font-medium text-gray-600 animate-in slide-in-from-top-2 duration-300">
                      <p className="font-bold text-indigo-950 uppercase text-[9px] tracking-wider mb-1">AI Reasoning Logs</p>
                      <div className="flex gap-2 items-start">
                        <span className="text-emerald-500 font-bold">✔</span>
                        <span className="font-semibold text-gray-600 leading-relaxed italic">"{details.why}"</span>
                      </div>
                      
                      <div className="pt-2.5 border-t border-indigo-100/50 mt-1">
                        <p className="font-bold text-indigo-950 uppercase text-[9px] tracking-wider mb-1.5">Segment Logic Rule</p>
                        <code className="text-indigo-600 font-mono text-[10px] font-bold bg-white border border-indigo-100 px-2 py-1 rounded-md">{details.rule}</code>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => handleViewCustomers(segment)}
                  className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-[11px] transition-all hover:scale-[1.02] flex items-center gap-1.5 flex-1 justify-center"
                >
                  <span className="material-symbols-outlined text-[15px]">visibility</span>
                  View List
                </button>
                
                <button
                  onClick={() => handleGenerateCampaign(segment)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] shadow-md transition-all hover:scale-[1.02] flex items-center gap-1.5 flex-[1.5] justify-center"
                >
                  <span className="material-symbols-outlined text-[15px]">rocket_launch</span>
                  Draft Campaign
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
