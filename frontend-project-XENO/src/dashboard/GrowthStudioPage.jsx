import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const stages = [
  { id: 'goal', label: 'Goal', icon: 'flag' },
  { id: 'understanding', label: 'AI Understanding', icon: 'psychology' },
  { id: 'audience', label: 'Audience Selection', icon: 'group' },
  { id: 'channel', label: 'Channel Recommendation', icon: 'chat' },
  { id: 'generation', label: 'Message Generation', icon: 'edit_note' },
  { id: 'roi', label: 'ROI Prediction', icon: 'trending_up' },
  { id: 'approval', label: 'Launch Approval', icon: 'verified' }
];

export default function GrowthStudioPage({ initialPrompt, onLaunchCampaign, role = 'Admin' }) {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [successData, setSuccessData] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState(null);
  
  // Workflow step index: -1 = not started, 0-6 represent stages
  const [activeStageIndex, setActiveStageIndex] = useState(-1);
  const [stageProgressText, setStageProgressText] = useState('');

  // Custom message editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('We Miss You');
  const [editedMessage, setEditedMessage] = useState(
    "Hi Rahul 👋\n\nWe noticed you haven't shopped with us recently.\n\nUse WELCOME20 and enjoy 20% OFF on your next purchase.\n\nOffer expires in 7 days."
  );

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      triggerAISimulation(initialPrompt);
    }
  }, [initialPrompt]);

  const triggerAISimulation = (customPrompt) => {
    setThinking(true);
    setResult(null);
    setIsEditing(false);
    setActiveStageIndex(0);
    setStageProgressText('Parsing marketing prompt details...');

    const stageTexts = [
      'Understanding the marketer\'s objective...',
      'Running semantic parsing on customer behavior matrices...',
      'Filtering high-potential target segments...',
      'Evaluating channel conversion benchmarks (WhatsApp vs Email)...',
      'Generating context-aware campaign copy copies...',
      'Simulating conversion rates and calculating ROI probability...',
      'Assembling campaign proposal for launch review.'
    ];

    // Simulate multi-step progress bar sequentially
    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx++;
      if (currentIdx < stages.length) {
        setActiveStageIndex(currentIdx);
        setStageProgressText(stageTexts[currentIdx]);
      } else {
        clearInterval(interval);
        setThinking(false);
        
        const isVIP = customPrompt.toLowerCase().includes('vip') || customPrompt.toLowerCase().includes('spend');
        
        if (isVIP) {
          setEditedTitle('Exclusive VIP Privilege');
          setEditedMessage(
            "Hi Rahul 👋\n\nAs one of our top VIP shoppers, we are giving you exclusive early access to our Summer Clearance Sale!\n\nUse VIPSECRET at checkout for an extra 15% OFF everything.\n\nAccess expires in 48 hours."
          );
          setResult({
            audience: '150 Customers',
            reasoning: 'Spent over ₹10,000 in the past month.',
            channel: 'WhatsApp',
            channelReason: '98% delivery rate & 85% read rate within this VIP segment.',
            thoughtProcess: {
              detected: '150 high-spender VIP customers',
              historicalRecovery: '24%',
              bestChannel: 'WhatsApp',
              conversions: 42,
              revenue: 75000,
              roi: '6.2x'
            },
            metrics: {
              reach: 148,
              readRate: '85%',
              clickRate: '57%',
              conversions: 42,
              revenue: '₹75,000'
            }
          });
        } else {
          setEditedTitle('We Miss You');
          setEditedMessage(
            "Hi Rahul 👋\n\nWe noticed you haven't shopped with us recently.\n\nUse WELCOME20 and enjoy 20% OFF on your next purchase.\n\nOffer expires in 7 days."
          );
          setResult({
            audience: '324 Customers',
            reasoning: 'No purchases recorded in the last 90 days.',
            channel: 'WhatsApp',
            channelReason: 'WhatsApp exhibits the highest historical engagement for inactive cohorts.',
            thoughtProcess: {
              detected: '324 inactive customers (90+ days)',
              historicalRecovery: '14%',
              bestChannel: 'WhatsApp',
              conversions: 50,
              revenue: 120000,
              roi: '4.8x'
            },
            metrics: {
              reach: 290,
              readRate: '70%',
              clickRate: '35%',
              conversions: 30,
              revenue: '₹60,000'
            }
          });
        }
      }
    }, 450);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    triggerAISimulation(prompt);
  };

  const handleLaunch = () => {
    if (!result) return;
    if (role === 'Viewer') {
      alert("Permission Denied: Viewers cannot launch campaigns.");
      return;
    }
    if (role === 'Analyst') {
      alert("Permission Denied: Analysts are restricted to data modeling. Campaign creation is disabled.");
      return;
    }

    const generatedId = `CAMP-${Math.floor(Math.random() * 900) + 100}`;
    const audience = result.audience.includes('324') ? 'Inactive Customers' : 'VIP Customers';

    onLaunchCampaign({
      id: generatedId,
      name: `Growth Studio: ${editedTitle} Campaign`,
      segment: audience,
      channel: result.channel,
      status: 'Running',
      message: editedMessage,
      targetSize: parseInt(result.audience),
      createdBy: 'Growth Studio',
      predictedRoi: result.audience.includes('324') ? '4.8x' : '6.2x',
      expectedRevenue: result.thoughtProcess.revenue,
      metrics: {
        sent: parseInt(result.audience),
        delivered: result.metrics.reach,
        read: Math.floor(result.metrics.reach * parseFloat(result.metrics.readRate) / 100),
        clicked: Math.floor(result.metrics.reach * parseFloat(result.metrics.readRate) * parseFloat(result.metrics.clickRate) / 10000),
        converted: result.metrics.conversions,
        revenue: result.thoughtProcess.revenue
      }
    });

    setSuccessData({
      action: 'Launched',
      id: generatedId,
      audience: `${audience} (${result.audience})`,
      channel: result.channel,
      title: editedTitle
    });
  };

  const handleSchedule = () => {
    if (!result) return;
    if (role === 'Viewer') {
      alert("Permission Denied: Viewers cannot schedule campaigns.");
      return;
    }
    const generatedId = `CAMP-${Math.floor(Math.random() * 900) + 100}`;
    const audience = result.audience.includes('324') ? 'Inactive Customers' : 'VIP Customers';

    onLaunchCampaign({
      id: generatedId,
      name: `Growth Studio: ${editedTitle} Campaign`,
      segment: audience,
      channel: result.channel,
      status: 'Scheduled',
      message: editedMessage,
      targetSize: parseInt(result.audience),
      createdBy: 'Growth Studio',
      predictedRoi: result.audience.includes('324') ? '4.8x' : '6.2x',
      expectedRevenue: result.thoughtProcess.revenue,
      metrics: { sent: 0, delivered: 0, read: 0, clicked: 0, converted: 0, revenue: 0 }
    });

    setSuccessData({
      action: 'Scheduled',
      id: generatedId,
      audience: `${audience} (${result.audience})`,
      channel: result.channel,
      title: editedTitle
    });
  };

  const handleSaveDraft = () => {
    if (!result) return;
    if (role === 'Viewer') {
      alert("Permission Denied: Viewers cannot save drafts.");
      return;
    }
    const generatedId = `CAMP-${Math.floor(Math.random() * 900) + 100}`;
    const audience = result.audience.includes('324') ? 'Inactive Customers' : 'VIP Customers';

    onLaunchCampaign({
      id: generatedId,
      name: `Growth Studio: ${editedTitle} (Draft)`,
      segment: audience,
      channel: result.channel,
      status: 'Draft',
      message: editedMessage,
      targetSize: parseInt(result.audience),
      createdBy: 'Growth Studio',
      predictedRoi: result.audience.includes('324') ? '4.8x' : '6.2x',
      expectedRevenue: result.thoughtProcess.revenue,
      metrics: { sent: 0, delivered: 0, read: 0, clicked: 0, converted: 0, revenue: 0 }
    });

    setSuccessData({
      action: 'Saved Draft',
      id: generatedId,
      audience: `${audience} (${result.audience})`,
      channel: result.channel,
      title: editedTitle
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-left">
        <h2 className="text-xl font-bold text-gray-950">Growth Studio Workbench</h2>
        <p className="text-xs text-gray-400 font-semibold mt-0.5">Describe your marketing goal in plain text and Xeno AI will model segments, copywrite, and recommend optimal channels.</p>
      </div>

      {/* Input Prompt Panel */}
      <div className="bg-white/80 border border-gray-200/60 rounded-[2rem] p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-indigo-500 animate-pulse text-[18px]">smart_toy</span>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Describe your marketing goal...</label>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Bring back customers who have not purchased in 3 months."
              className="flex-1 px-4 py-3.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold"
            />
            <button
              type="submit"
              disabled={thinking || !prompt.trim() || role === 'Viewer'}
              className="w-full sm:w-auto justify-center px-6 py-3.5 creative-btn rounded-xl font-bold text-xs disabled:opacity-50 flex items-center gap-2"
            >
              {thinking ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                  Analyzing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                  Analyze Goal
                </>
              )}
            </button>
          </div>

          {/* Quick Suggestions */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-2">Suggestions:</span>
            <button
              type="button"
              onClick={() => {
                setPrompt("Bring back customers who have not purchased in 3 months.");
                triggerAISimulation("Bring back customers who have not purchased in 3 months.");
              }}
              className="px-3 py-1.5 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600 rounded-xl font-bold text-[10px] border border-indigo-100/50 transition-colors"
            >
              Re-engage 90-day inactive shoppers
            </button>
            <button
              type="button"
              onClick={() => {
                setPrompt("Promote early access sale to VIP customers who spent more than ₹10,000 last month.");
                triggerAISimulation("Promote early access sale to VIP customers who spent more than ₹10,000 last month.");
              }}
              className="px-3 py-1.5 bg-purple-50/50 hover:bg-purple-50 text-purple-600 rounded-xl font-bold text-[10px] border border-purple-100/50 transition-colors"
            >
              VIP high-spender campaign
            </button>
          </div>
        </form>
      </div>

      {/* Multi-Step Workflow Stepper */}
      {activeStageIndex >= 0 && (
        <div className="bg-white border border-gray-200/60 rounded-[2rem] p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {stages.map((stg, index) => {
              const isCompleted = index < activeStageIndex;
              const isActive = index === activeStageIndex;
              
              let stepStyle = 'bg-gray-100 border-gray-200 text-gray-400';
              if (isActive) stepStyle = 'bg-indigo-50 border-indigo-300 text-indigo-600 ring-4 ring-indigo-100';
              if (isCompleted) stepStyle = 'bg-emerald-50 border-emerald-200 text-emerald-600';

              return (
                <div key={stg.id} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs transition-all ${stepStyle}`}>
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">{stg.icon}</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold ${isActive ? 'text-indigo-950 font-black' : isCompleted ? 'text-emerald-700' : 'text-gray-400'}`}>
                    {stg.label}
                  </span>
                  {index < stages.length - 1 && (
                    <span className="material-symbols-outlined text-gray-300 text-[16px] hidden xl:block">chevron_right</span>
                  )}
                </div>
              );
            })}
          </div>

          {thinking && (
            <div className="mt-4 p-3 bg-indigo-50/15 border border-indigo-50 rounded-2xl flex items-center gap-2 animate-pulse text-[11px] text-indigo-700 font-bold justify-center">
              <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
              <span>{stageProgressText}</span>
            </div>
          )}
        </div>
      )}

      {/* AI Response Panel & Live Reasoning Panel */}
      {result && !thinking && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main Proposal Editor (Left) */}
          <div className="lg:col-span-8 bg-white border border-indigo-100 rounded-[2.5rem] p-8 shadow-xl shadow-indigo-100/20 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Segment & Channel Rec */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-indigo-50/20 border border-indigo-100/50 rounded-2xl p-4 text-left">
                  <span className="block text-[9px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Target Segment</span>
                  <span className="text-xs font-extrabold text-indigo-705 block">{result.audience}</span>
                  <p className="text-[10px] text-gray-500 font-semibold leading-relaxed mt-0.5">
                    {result.reasoning}
                  </p>
                </div>
                <div className="bg-emerald-50/20 border border-emerald-100/50 rounded-2xl p-4 text-left">
                  <span className="block text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Channel Recommendation</span>
                  <span className="text-xs font-extrabold text-emerald-700 block flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">chat</span>
                    {result.channel}
                  </span>
                  <p className="text-[10px] text-gray-500 font-semibold leading-relaxed mt-0.5">
                    {result.channelReason}
                  </p>
                </div>
              </div>

              {/* Message Content */}
              <div className="text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Growth Studio Campaign Copy</span>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-[10px] font-bold text-indigo-650 hover:underline flex items-center gap-0.5"
                  >
                    <span className="material-symbols-outlined text-[12px]">edit</span>
                    {isEditing ? 'Save Changes' : 'Customize Message'}
                  </button>
                </div>

                <div className="border border-gray-200 rounded-3xl overflow-hidden bg-gray-50/30">
                  <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600 text-[16px]">chat</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="font-bold text-xs bg-gray-50 border border-gray-250 px-2.5 py-1 rounded-lg focus:outline-none focus:bg-white w-full"
                      />
                    ) : (
                      <h4 className="font-bold text-xs text-gray-900">{editedTitle}</h4>
                    )}
                  </div>
                  
                  <div className="p-5">
                    {isEditing ? (
                      <textarea
                        value={editedMessage}
                        onChange={(e) => setEditedMessage(e.target.value)}
                        rows={4}
                        className="w-full text-xs bg-white border border-gray-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 font-semibold leading-relaxed"
                      />
                    ) : (
                      <div className="bg-emerald-50/20 max-w-sm rounded-2xl p-4 text-[11px] font-semibold leading-relaxed border border-emerald-100/30 whitespace-pre-line text-left">
                        {editedMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Predicted Metrics */}
              <div className="text-left border-t border-gray-100 pt-4">
                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Simulated Attributed Yields</span>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-white border border-gray-150 p-3 rounded-xl">
                    <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider">Reach</span>
                    <span className="text-xs font-black text-gray-900 block mt-0.5">{result.metrics.reach}</span>
                  </div>
                  <div className="bg-white border border-gray-150 p-3 rounded-xl">
                    <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider">Read Rate</span>
                    <span className="text-xs font-black text-indigo-650 block mt-0.5">{result.metrics.readRate}</span>
                  </div>
                  <div className="bg-white border border-gray-150 p-3 rounded-xl">
                    <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider">Click Rate</span>
                    <span className="text-xs font-black text-pink-500 block mt-0.5">{result.metrics.clickRate}</span>
                  </div>
                  <div className="bg-white border border-gray-150 p-3 rounded-xl">
                    <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider">Conversions</span>
                    <span className="text-xs font-black text-emerald-600 block mt-0.5">{result.metrics.conversions}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Launch CTA toolbar */}
            <div className="flex flex-col gap-5 border-t border-gray-200 pt-6 mt-6">
              <button
                onClick={() => triggerAISimulation(prompt)}
                className="w-fit text-[11px] font-bold text-gray-600 hover:text-indigo-600 transition-all flex items-center gap-2 hover:underline"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Re-predict
              </button>

              <div className="flex flex-wrap gap-3 justify-start pt-2">
                <button
                  onClick={handleSaveDraft}
                  disabled={role === 'Viewer'}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-xl font-bold text-xs transition-all disabled:opacity-40 hover:shadow-md active:scale-95"
                >
                  Save Draft
                </button>
                <button
                  onClick={handleSchedule}
                  disabled={role === 'Viewer'}
                  className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white border border-indigo-600 rounded-xl font-bold text-xs transition-all disabled:opacity-40 hover:shadow-lg active:scale-95"
                >
                  Schedule
                </button>
                <button
                  onClick={handleLaunch}
                  disabled={role === 'Viewer' || role === 'Analyst'}
                  className="px-7 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white border border-indigo-700 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2.5 disabled:opacity-40 hover:shadow-xl active:scale-95"
                >
                  <span className="material-symbols-outlined text-[17px]">rocket_launch</span>
                  <span>Approve & Launch</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI Reasoning Panel (Right) */}
          <div className="lg:col-span-4 bg-indigo-950 text-indigo-100 rounded-[2.5rem] p-6 shadow-xl flex flex-col justify-between text-left">
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-indigo-900 pb-4">
                <span className="material-symbols-outlined text-cyan-400 text-[20px] animate-pulse">smart_toy</span>
                <h3 className="text-xs font-black uppercase tracking-widest text-white">AI Thought Process</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="block text-[8px] font-bold text-indigo-400 uppercase tracking-widest">Detected Anomalies</span>
                  <p className="text-xs font-semibold text-white">{result.thoughtProcess.detected}</p>
                </div>
                <div className="space-y-1">
                  <span className="block text-[8px] font-bold text-indigo-400 uppercase tracking-widest">Historical Recovery Rate</span>
                  <p className="text-xs font-semibold text-white">{result.thoughtProcess.historicalRecovery}</p>
                </div>
                <div className="space-y-1">
                  <span className="block text-[8px] font-bold text-indigo-400 uppercase tracking-widest">Optimal channel route</span>
                  <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-cyan-400">chat</span>
                    {result.thoughtProcess.bestChannel}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="block text-[8px] font-bold text-indigo-400 uppercase tracking-widest">Expected Conversions</span>
                  <p className="text-xs font-semibold text-white">{result.thoughtProcess.conversions} purchasers</p>
                </div>
                <div className="space-y-1">
                  <span className="block text-[8px] font-bold text-indigo-400 uppercase tracking-widest">Predicted ROI yield</span>
                  <p className="text-sm font-black text-cyan-400">{result.thoughtProcess.roi} Gain</p>
                </div>
              </div>

              <div className="bg-indigo-900/40 border border-indigo-900 rounded-2xl p-4 text-[10px] text-indigo-200 leading-normal">
                <p className="font-bold text-white uppercase text-[8px] tracking-wider mb-1">Optimization Note</p>
                AI selected WhatsApp over Email as WhatsApp matches the preferred channel flags of 74% of the target group. Expected conversion is 15.4% returning ₹{result.thoughtProcess.revenue.toLocaleString()} in recoverable revenue.
              </div>
            </div>

            <div className="border-t border-indigo-900 pt-4 mt-6 flex justify-between items-center text-[9px] font-bold text-indigo-400">
              <span>Predictive Confidence: 94%</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
            </div>
          </div>

        </div>
      )}

      {/* Success Modal */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] border border-indigo-100 shadow-2xl p-8 max-w-md w-full text-center space-y-6 animate-in scale-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <span className="material-symbols-outlined text-[32px] font-bold">check_circle</span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-955">Campaign {successData.action}</h3>
              <p className="text-xs text-gray-400 font-semibold leading-relaxed">
                Your Growth Studio campaign proposal has been successfully registered and active in the console lifecycle.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 text-xs font-semibold text-gray-650 text-left space-y-2.5">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-455">Campaign ID</span>
                <span className="font-mono font-bold text-indigo-650">{successData.id}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-450">Target Audience</span>
                <span className="font-bold text-gray-900">{successData.audience}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-455">Channel Assigned</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">chat</span>
                  {successData.channel}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-455">Current Status</span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100/50">
                  {successData.action === 'Launched' ? 'Running' : successData.action === 'Scheduled' ? 'Scheduled' : 'Draft'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setSuccessData(null)}
                className="w-full py-3 border border-gray-200 hover:bg-gray-50 text-gray-705 rounded-xl font-bold text-xs transition-all animate-none"
              >
                Stay in Workbench
              </button>
              
              <button
                onClick={() => {
                  setSuccessData(null);
                  navigate('/dashboard/campaigns');
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
              >
                Go to Campaigns
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
