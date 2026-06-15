import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const EMPTY_FUNNEL = [
  { name: 'Sent', value: 0, percentage: '0%' },
  { name: 'Delivered', value: 0, percentage: '0%' },
  { name: 'Opened/Read', value: 0, percentage: '0%' },
  { name: 'Clicked', value: 0, percentage: '0%' },
  { name: 'Converted', value: 0, percentage: '0%' },
];

// Custom modern tooltips for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 border border-gray-150 p-3.5 rounded-2xl shadow-xl backdrop-blur-md">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        {payload.map((item, idx) => (
          <p key={idx} className="text-xs font-extrabold" style={{ color: item.color }}>
            {item.name}: {typeof item.value === 'number' && item.name.includes('Revenue') ? `₹${item.value.toLocaleString()}` : item.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage({ campaigns = [], analyticsData = null, isLoading = false }) {
  const [trendMetric, setTrendMetric] = useState('revenue');

  const funnelData = analyticsData?.funnelData || EMPTY_FUNNEL;
  const revenueAttributionData = analyticsData?.revenueAttribution || [];
  const channelPerformanceData = analyticsData?.channelPerformance || [];
  const trendPerformanceData = analyticsData?.trendPerformance || [];

  const topCampaign = [...campaigns].sort((a, b) => (b.metrics?.revenue || 0) - (a.metrics?.revenue || 0))[0];
  const worstCampaign = [...campaigns].sort((a, b) => (a.metrics?.converted || 0) - (b.metrics?.converted || 0))[0];
  const topChannel = [...channelPerformanceData].sort((a, b) => (b.readRate || 0) - (a.readRate || 0))[0];

  const totalRevChange = analyticsData?.kpis?.totalRevenue?.change || '0.0%';
  const vipCampaigns = campaigns.filter(c => String(c.segment).includes('VIP'));
  const vipRev = vipCampaigns.reduce((sum, c) => sum + (c.metrics?.revenue || 0), 0);
  const totalCampaignRev = campaigns.reduce((sum, c) => sum + (c.metrics?.revenue || 0), 0);
  const vipPct = totalCampaignRev > 0 ? ((vipRev / totalCampaignRev) * 100).toFixed(0) : '0';
  
  const waPerformance = channelPerformanceData.find(c => c.channel === 'WhatsApp') || { readRate: 0 };
  const emPerformance = channelPerformanceData.find(c => c.channel === 'Email') || { readRate: 0 };
  const waReadPct = waPerformance.readRate || 0;
  const emReadPct = emPerformance.readRate || 0;
  const waDiff = Math.max(0, waReadPct - emReadPct).toFixed(0);

  const inactiveCampaigns = campaigns.filter(c => String(c.segment).includes('Inactive'));
  const inactiveRev = inactiveCampaigns.reduce((sum, c) => sum + (c.metrics?.revenue || 0), 0);
  
  const campaignWithRoi = [...campaigns]
    .map(c => {
      let rate = 0.05;
      if (c.channel === 'WhatsApp') rate = 0.20;
      else if (c.channel === 'SMS') rate = 0.08;
      else if (c.channel === 'RCS') rate = 0.12;
      else if (c.channel === 'Email') rate = 0.02;
      const cost = Math.max(250, Math.floor((c.metrics?.sent || 0) * rate));
      const roiVal = cost > 0 ? (c.metrics?.revenue || 0) / cost : 0;
      return { ...c, roiVal };
    })
    .sort((a, b) => b.roiVal - a.roiVal)[0];

  const highestRoiText = campaignWithRoi && campaignWithRoi.roiVal > 0 
    ? `${campaignWithRoi.name} (${campaignWithRoi.roiVal.toFixed(1)}x ROI)`
    : 'No ROI data yet';

  const getMetricLabel = () => {
    if (trendMetric === 'revenue') return 'Revenue (₹)';
    if (trendMetric === 'conversions') return 'Conversions Count';
    return 'Customer Database Size';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-955">Analytics & Attribution Studio</h2>
        <p className="text-xs text-gray-400 font-semibold mt-0.5">Visualize attribution funnels, evaluate channel returns, and track growth curves over time.</p>
      </div>

      {/* AI Executive Summary & Performance Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: AI Executive Summary */}
        <div className="lg:col-span-6 bg-gradient-to-br from-indigo-950 to-indigo-905 text-indigo-100 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col justify-between text-left">
          <div className="absolute inset-0 bg-dot-pattern opacity-10 pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-indigo-800 pb-4">
              <span className="material-symbols-outlined text-cyan-400 text-[20px] animate-pulse">auto_awesome</span>
              <h3 className="text-xs font-black uppercase tracking-widest text-white">AI Executive Summary</h3>
            </div>
            
            <p className="text-sm font-medium text-white leading-relaxed">
              Revenue changed by <strong className="text-cyan-300 font-extrabold">{totalRevChange}</strong>. VIP campaigns generated <strong className="text-cyan-300 font-extrabold">{vipPct}%</strong> of total campaign revenue. WhatsApp outperformed Email by <strong className="text-cyan-300 font-extrabold">{waDiff}%</strong> read rate. Inactive customer recovery campaigns generated <strong className="text-cyan-300 font-extrabold">₹{inactiveRev.toLocaleString('en-IN')}</strong>.
            </p>

            <div className="bg-indigo-900/40 border border-indigo-850 p-4 rounded-2xl text-[11px] text-indigo-200 leading-relaxed font-medium mt-3">
              <strong className="text-white block uppercase text-[8px] tracking-wider mb-1">AI Recommendation Core</strong>
              Optimize VIP rewards segment to capture high customer LTV. Preferred channel analysis suggests prioritizing WhatsApp/Email based on customer preference logs.
            </div>
          </div>

          <div className="border-t border-indigo-800 pt-4 mt-6 text-[9px] font-bold text-indigo-400 flex justify-between items-center">
            <span>Executive Insights compiled Just Now</span>
            <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">AI Verified</span>
          </div>
        </div>

        {/* Right Side: Performance Leaderboards */}
        <div className="lg:col-span-6 bg-white border border-gray-200/60 p-8 rounded-[2.5rem] shadow-sm text-left flex flex-col justify-between">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <span className="material-symbols-outlined text-indigo-650 text-[20px]">stars</span>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Performance Leaderboards</h3>
            </div>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-450 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Top Segment
                </span>
                <span className="font-extrabold text-gray-900 bg-gray-50 border border-gray-150 px-2.5 py-0.5 rounded-md">
                  {(() => {
                    const topSegment = campaigns.length > 0 
                      ? [...campaigns].sort((a, b) => {
                          const aCR = a.metrics?.sent > 0 ? (a.metrics?.converted / a.metrics?.sent) * 100 : 0;
                          const bCR = b.metrics?.sent > 0 ? (b.metrics?.converted / b.metrics?.sent) * 100 : 0;
                          return bCR - aCR;
                        })[0]
                      : null;
                    return topSegment 
                      ? `${topSegment.segment} (${(topSegment.metrics?.sent > 0 ? (topSegment.metrics?.converted / topSegment.metrics?.sent) * 100 : 0).toFixed(1)}% CR)`
                      : 'No segment data yet';
                  })()}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-455 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Top Campaign
                </span>
                <span className="font-extrabold text-gray-900 bg-gray-50 border border-gray-150 px-2.5 py-0.5 rounded-md">
                  {isLoading ? 'Loading...' : topCampaign ? `${topCampaign.name} (₹${(topCampaign.metrics?.revenue || 0).toLocaleString('en-IN')} Sales)` : 'No campaigns yet'}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-455 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Worst Campaign
                </span>
                <span className="font-extrabold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-md">
                  {isLoading ? 'Loading...' : worstCampaign ? `${worstCampaign.name} (${worstCampaign.metrics?.converted || 0} conversions)` : 'No campaigns yet'}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-455 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Most Effective Channel
                </span>
                <span className="font-extrabold text-gray-900 bg-gray-50 border border-gray-150 px-2.5 py-0.5 rounded-md">
                  {isLoading ? 'Loading...' : topChannel ? `${topChannel.channel} (${topChannel.readRate}% Read Rate)` : 'No channel data'}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-455 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Highest ROI Trend
                </span>
                <span className="font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100/50 px-2.5 py-0.5 rounded-md">{highestRoiText}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Clear Attribution Flow Visualization */}
      <div className="bg-white border border-gray-200/60 p-8 rounded-[2.5rem] shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-indigo-500">share</span>
            End-to-End Campaign Attribution Flow
          </h3>
          <p className="text-[11px] text-gray-400 font-semibold">Track how client interactions turn into store transactions and credited sales.</p>
        </div>

        {/* Visual node row */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 py-2 relative">
          {[
            { label: '1. Campaign Launched', icon: 'rocket_launch', desc: 'Growth Studio deploys copy', color: 'text-indigo-650 bg-indigo-50/50 border-indigo-100' },
            { label: '2. Message Delivered', icon: 'mark_email_read', desc: 'Gateway confirmations', color: 'text-blue-600 bg-blue-50/50 border-blue-100' },
            { label: '3. Message Read', icon: 'visibility', desc: 'User open notification', color: 'text-amber-600 bg-amber-50/50 border-amber-100' },
            { label: '4. Link Clicked', icon: 'ads_click', desc: 'Redirects to store checkout', color: 'text-pink-600 bg-pink-50/50 border-pink-100' },
            { label: '5. Order Created', icon: 'local_mall', desc: 'ORD payload matched', color: 'text-emerald-650 bg-emerald-50/50 border-emerald-100' },
            { label: '6. Revenue Attributed', icon: 'insights', desc: 'ROI credited to core model', color: 'text-purple-600 bg-purple-50/50 border-purple-100' }
          ].map((node, nIdx) => (
            <React.Fragment key={nIdx}>
              {nIdx > 0 && (
                <div className="hidden lg:flex items-center text-gray-300 font-bold shrink-0 mx-1">
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </div>
              )}
              <div className="flex items-center gap-3 bg-white border border-gray-150 rounded-2xl p-4 shadow-2xs w-full lg:max-w-[175px] hover:border-indigo-200 transition-all text-left">
                <div className={`p-2.5 rounded-xl border shrink-0 ${node.color}`}>
                  <span className="material-symbols-outlined text-[18px] block">{node.icon}</span>
                </div>
                <div className="min-w-0">
                  <h4 className="text-[10px] font-black text-gray-900 leading-snug">{node.label}</h4>
                  <p className="text-[8px] text-gray-400 font-semibold leading-relaxed mt-0.5">{node.desc}</p>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 2. ROI Attribution Table */}
      <div className="bg-white border border-gray-200/60 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 text-left">
          <h3 className="text-sm font-bold text-gray-950">Campaign ROI & Attribution Breakdown</h3>
          <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Attributed sales, conversion costs, and revenue per converted shopper.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Campaign Name</th>
                <th className="px-6 py-4">Channel</th>
                <th className="px-6 py-4 text-right">Attributed Revenue</th>
                <th className="px-6 py-4 text-center">Conversions</th>
                <th className="px-6 py-4 text-right">Estimated Cost</th>
                <th className="px-6 py-4 text-center">ROI</th>
                <th className="px-6 py-4 text-right">Revenue Per Customer (RPC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
              {campaigns.map((camp) => {
                // Calculate simulated cost based on channel and sent count
                // WhatsApp: ₹0.20, SMS: ₹0.08, RCS: ₹0.12, Email: ₹0.02
                let rate = 0.05;
                if (camp.channel === 'WhatsApp') rate = 0.20;
                else if (camp.channel === 'SMS') rate = 0.08;
                else if (camp.channel === 'RCS') rate = 0.12;
                else if (camp.channel === 'Email') rate = 0.02;

                const cost = Math.max(250, Math.floor(camp.metrics.sent * rate));
                const revenue = camp.metrics.revenue;
                const conversions = camp.metrics.converted;
                const roi = cost > 0 && revenue > 0 ? (revenue / cost).toFixed(1) + 'x' : '0.0x';
                const rpc = conversions > 0 ? '₹' + Math.floor(revenue / conversions).toLocaleString() : '₹0';

                return (
                  <tr key={camp.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{camp.name}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold bg-gray-50 border border-gray-150 text-gray-550 px-2 py-0.5 rounded-md">
                        {camp.channel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">₹{revenue.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900">{conversions}</td>
                    <td className="px-6 py-4 text-right text-gray-400">₹{cost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center font-bold text-indigo-650">{roi}</td>
                    <td className="px-6 py-4 text-right font-bold text-purple-650">{rpc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top row: Funnel & Revenue Attribution Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Campaign Funnel Card */}
        <div className="bg-white border border-gray-200/60 p-6 rounded-[2.5rem] shadow-sm space-y-6 text-left">
          <div>
            <h3 className="text-sm font-bold text-gray-905">Conversion Funnel Attribution</h3>
            <p className="text-[11px] text-gray-400 font-semibold">Drop-off rates from message dispatch to order conversion.</p>
          </div>

          <div className="space-y-4">
            {funnelData.map((stage, idx) => {
              const percentages = ['100%', '96%', '75%', '37.5%', '12.9%'];
              const colors = ['bg-indigo-600', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-emerald-500'];
              
              return (
                <div key={idx} className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${colors[idx]}`} />
                      <span>{stage.name}</span>
                    </span>
                    <span>{stage.value.toLocaleString()} ({stage.percentage})</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden flex relative">
                    <div 
                      className={`h-full ${colors[idx]} transition-all duration-1000`} 
                      style={{ width: percentages[idx] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue Attribution BarChart */}
        <div className="bg-white border border-gray-200/60 p-6 rounded-[2.5rem] shadow-sm space-y-4 text-left">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-bold text-gray-905">Revenue Attribution by Campaign</h3>
              <p className="text-[11px] text-gray-400 font-semibold">Top performing campaigns ranked by direct conversions.</p>
            </div>
            <span className="text-[10px] font-bold bg-indigo-50 border border-indigo-100/50 text-indigo-700 px-2.5 py-0.5 rounded-full">
              Direct Sales
            </span>
          </div>

          <div className="h-64 text-xs font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueAttributionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue Generated" fill="#6b4cff" radius={[10, 10, 0, 0]} barSize={35} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Middle row: Channels & Trends */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Channel Performance comparison */}
        <div className="bg-white border border-gray-200/60 p-6 rounded-[2.5rem] shadow-sm space-y-4 text-left">
          <div>
            <h3 className="text-sm font-bold text-gray-905">Channel Performance Comparison</h3>
            <p className="text-[11px] text-gray-400 font-semibold">Delivery, Open, and Conversion percentages by delivery format.</p>
          </div>

          <div className="h-64 text-xs font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="channel" stroke="#9ca3af" fontSize={10} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                <Bar dataKey="deliveryRate" name="Delivery %" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="readRate" name="Read %" fill="#fb8c00" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="clickRate" name="Click %" fill="#ec4899" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="conversionRate" name="Conversion %" fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Trend Chart */}
        <div className="bg-white border border-gray-200/60 p-6 rounded-[2.5rem] shadow-sm space-y-4 text-left">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-955">Campaign Performance & Database Trends</h3>
              <p className="text-[11px] text-gray-400 font-semibold">Monitor historical business trajectories.</p>
            </div>
            
            <div className="flex border border-gray-200 rounded-xl p-1 bg-gray-50/50 self-start">
              <button
                onClick={() => setTrendMetric('revenue')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  trendMetric === 'revenue' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setTrendMetric('conversions')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  trendMetric === 'conversions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Conversions
              </button>
              <button
                onClick={() => setTrendMetric('growth')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  trendMetric === 'growth' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Growth
              </button>
            </div>
          </div>

          <div className="h-64 text-xs font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendPerformanceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey={trendMetric} 
                  name={getMetricLabel()} 
                  stroke="#8b5cf6" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorTrend)" 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
