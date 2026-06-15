import React, { useState, useEffect } from 'react';
import CsvIngestionCenter from './CsvIngestionCenter';

export default function OnboardingWizard({ onComplete, initialStep = 1, onCancel, isSubmitting = false, error = null }) {
  const [step, setStep] = useState(initialStep);
  
  // Step 1: Brand details
  const [brandName, setBrandName] = useState('Apex Cosmetics');
  const [industry, setIndustry] = useState('Beauty & Personal Care');
  const [businessType, setBusinessType] = useState('D2C / E-commerce');
  const [primaryChannel, setPrimaryChannel] = useState('WhatsApp');
  const [monthlyCustomers, setMonthlyCustomers] = useState('25,000 - 50,000');

  // Step 2: staged import files (actual File objects for post-create upload)
  const [pendingImport, setPendingImport] = useState(null);
  const [customerFile, setCustomerFile] = useState(null);
  const [orderFile, setOrderFile] = useState(null);

  // Step 3: AI Analysis progress
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [customersProcessed, setCustomersProcessed] = useState(0);
  const [ordersProcessed, setOrdersProcessed] = useState(0);
  const [logs, setLogs] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(120);
  const [totalOrders, setTotalOrders] = useState(780);
  
  const allLogs = [
    'Initializing AI modeling engine...',
    'Reading Customer Profiles (matching columns: Customer ID, Name, Email)...',
    'Processing Orders & Transactions (matching columns: Order ID, Value, Category)...',
    'Calculating Customer Lifetime Value (CLV)...',
    'Detecting Purchase Patterns & churn intervals...',
    'Identifying VIP High-Spender Clusters...',
    'Predicting Churn Risks & Coupon Sensitivity...',
    'Identifying High Opportunity Segments...',
    'Predicting Channel Receptivity (WhatsApp vs Email vs SMS)...',
    'Generating optimal Campaign Opportunities...',
    'Calculating potential Recoverable Revenue...'
  ];

  // Drag & Drop simulates
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      if (type === 'customers') {
        setCustomerFile({ name: file.name, size: `${(file.size / 1024).toFixed(1)} KB` });
      } else {
        setOrderFile({ name: file.name, size: `${(file.size / 1024).toFixed(1)} KB` });
      }
    }
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === 'customers') {
        setCustomerFile({ name: file.name, size: `${(file.size / 1024).toFixed(1)} KB` });
      } else {
        setOrderFile({ name: file.name, size: `${(file.size / 1024).toFixed(1)} KB` });
      }
    }
  };

  const loadSampleData = () => {
    setCustomerFile({ name: 'customers_production.csv', size: '2.4 MB' });
    setOrderFile({ name: 'orders_retail_2026.csv', size: '5.8 MB' });
  };

  // Run AI Analysis logic
  useEffect(() => {
    if (step !== 3) return;

    let progressInterval;
    let logIndex = 0;
    
    // Add logs periodically
    const logInterval = setInterval(() => {
      if (logIndex < allLogs.length) {
        setLogs((prev) => [...prev, allLogs[logIndex]]);
        logIndex++;
      }
    }, 450);

    // Increment progress and processed counts
    progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          clearInterval(logInterval);
          setTimeout(() => {
            setStep(4);
          }, 800);
          return 100;
        }
        const nextProgress = prev + 2;
        setCustomersProcessed(Math.min(totalCustomers, Math.floor((nextProgress / 100) * totalCustomers)));
        setOrdersProcessed(Math.min(totalOrders, Math.floor((nextProgress / 100) * totalOrders)));
        return nextProgress;
      });
    }, 80);

    return () => {
      clearInterval(progressInterval);
      clearInterval(logInterval);
    };
  }, [step]);

  const estimatedRevenue = totalOrders * 1245;
  const estimatedClv = totalCustomers > 0 ? Math.round((estimatedRevenue * 1.3) / totalCustomers) : 0;

  const handleLaunch = () => {
    if (isSubmitting) return;
    onComplete({
      brandName,
      industry,
      businessType,
      primaryChannel,
      monthlyCustomers,
      customerFile,
      orderFile,
      stats: {
        customers: totalCustomers.toLocaleString(),
        orders: totalOrders.toLocaleString(),
        revenue: `₹${estimatedRevenue.toLocaleString('en-IN')}`,
        clv: `₹${estimatedClv.toLocaleString('en-IN')}`
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center p-6 select-none font-sans relative overflow-hidden">
      
      {/* Background Ambient Glow Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-250/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-200/25 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-4xl bg-white/80 backdrop-blur-2xl border border-indigo-50 shadow-2xl rounded-[3rem] p-8 md:p-12 relative z-10 transition-all duration-500 min-h-[550px] flex flex-col justify-between">
        
        {/* Top Progress Track */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl">
              <span className="material-symbols-outlined text-indigo-650 font-bold text-[22px]">insights</span>
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-900 leading-tight">Xeno AI</h1>
              <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Campaign Console</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div 
                  key={s}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    step === s 
                      ? 'w-8 bg-indigo-600' 
                      : step > s 
                        ? 'w-4 bg-emerald-500' 
                        : 'w-2.5 bg-gray-200'
                  }`}
                />
              ))}
            </div>
            {onCancel && (
              <button 
                onClick={onCancel}
                className="p-1.5 hover:bg-gray-150 rounded-xl text-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center border border-gray-200"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* STEP 1: BRAND SETUP */}
        {step === 1 && (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-950">Welcome to Xeno AI</h2>
              <p className="text-xs text-gray-400 font-semibold leading-relaxed">
                Create a Brand Workspace to automatically parse customer behavioral models, optimize channels, and generate campaigns.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Brand Name</label>
                <input 
                  type="text" 
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g., Apex Cosmetics"
                  className="w-full px-4 py-3.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Industry Sector</label>
                <select 
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-3.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold text-gray-700"
                >
                  <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                  <option value="Fashion & Apparel">Fashion & Apparel</option>
                  <option value="Food & Beverages">Food & Beverages</option>
                  <option value="Electronics & Tech">Electronics & Tech</option>
                  <option value="Fitness & Health">Fitness & Health</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Business Type</label>
                <select 
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-4 py-3.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold text-gray-700"
                >
                  <option value="D2C / E-commerce">D2C / E-commerce</option>
                  <option value="Retail & Storefront">Retail & Storefront</option>
                  <option value="B2B Services">B2B Services</option>
                  <option value="Subscription Product">Subscription Product</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Primary Channel</label>
                <select 
                  value={primaryChannel}
                  onChange={(e) => setPrimaryChannel(e.target.value)}
                  className="w-full px-4 py-3.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold text-gray-700"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Email">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="RCS">RCS</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left md:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Monthly Active Customers</label>
                <select 
                  value={monthlyCustomers}
                  onChange={(e) => setMonthlyCustomers(e.target.value)}
                  className="w-full px-4 py-3.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold text-gray-700"
                >
                  <option value="Under 10,000">Under 10,000</option>
                  <option value="10,000 - 25,000">10,000 - 25,000</option>
                  <option value="25,000 - 50,000">25,000 - 50,000</option>
                  <option value="50,000 - 100,000">50,000 - 100,000</option>
                  <option value="Over 100,000">Over 100,000</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-100">
              <button
                onClick={() => setStep(2)}
                disabled={!brandName.trim()}
                className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-xs shadow-lg hover:shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
              >
                Create Workspace
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DATA INGESTION CENTER */}
        {step === 2 && (
          <div className="flex-1 flex flex-col justify-between">
            <CsvIngestionCenter
              compact={true}
              showCancel={true}
              continueLabel="Analyze Datasets"
              onContinue={({ customersFile, ordersFile, stagedFiles }) => {
                setCustomerFile(customersFile);
                setOrderFile(ordersFile);
                const custStaged = stagedFiles.find(f => f.type === 'customers');
                const orderStaged = stagedFiles.find(f => f.type === 'orders');
                setTotalCustomers(custStaged ? custStaged.totalRows : 120);
                setTotalOrders(orderStaged ? orderStaged.totalRows : 780);
                setStep(3);
              }}
              onCancel={() => setStep(1)}
            />
          </div>
        )}

        {/* STEP 3: AI ANALYSIS EXPERIENCE */}
        {step === 3 && (
          <div className="space-y-6 flex-1 flex flex-col justify-between py-2">
            <div className="text-center space-y-2">
              <div className="relative w-20 h-20 mx-auto mb-2 flex items-center justify-center">
                {/* Glowing Spinner */}
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-650 animate-spin" />
                <span className="material-symbols-outlined text-indigo-600 text-[32px] animate-pulse">auto_awesome</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-950">Building Customer Intelligence</h2>
              <p className="text-xs text-gray-400 font-semibold">
                Xeno AI models are mapping purchase cycles, calculating customer lifespans, and segmenting attributes.
              </p>
            </div>

            {/* Counts progress */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto py-2">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
                <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-1">Customers Processed</span>
                <span className="text-xl font-extrabold text-indigo-650">{customersProcessed.toLocaleString()}</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
                <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-1">Orders Processed</span>
                <span className="text-xl font-extrabold text-purple-600">{ordersProcessed.toLocaleString()}</span>
              </div>
            </div>

            {/* Loading Bar */}
            <div className="space-y-2 max-w-xl mx-auto w-full">
              <div className="flex justify-between text-[10px] font-bold text-gray-500">
                <span>Progress: {analysisProgress}%</span>
                <span>Calculating Cluster Thresholds...</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-100" style={{ width: `${analysisProgress}%` }} />
              </div>
            </div>

            {/* Simulated Logs Terminal */}
            <div className="bg-gray-950 border border-gray-800 rounded-2xl p-5 text-left font-mono text-[10px] text-gray-400 max-h-[160px] overflow-y-auto custom-scrollbar space-y-1.5">
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-2.5 items-start">
                  <span className="text-emerald-500 font-bold">✔</span>
                  <span className="text-gray-300 font-semibold">{log}</span>
                </div>
              ))}
              <div className="flex gap-2.5 items-center text-indigo-400">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                <span>Running cognitive analytics logic...</span>
              </div>
            </div>

            <div className="pt-4 text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                DO NOT REFRESH OR CLOSE THIS SESSION
              </span>
            </div>
          </div>
        )}

        {/* STEP 4: AI INTELLIGENCE SUMMARY */}
        {step === 4 && (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-1.5 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-[24px]">verified</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-955">Customer Intelligence Ready</h2>
              <p className="text-xs text-gray-400 font-semibold">
                Analysis complete. We detected 6 core behavior segments representing ₹2.1L in immediate opportunities.
              </p>
            </div>

            {/* Dashboard aggregates summary row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
              <div className="bg-white border border-gray-200 p-4 rounded-2xl text-center">
                <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider">Customer Count</span>
                <span className="text-lg font-black text-gray-900 mt-1 block">{totalCustomers.toLocaleString()}</span>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-2xl text-center">
                <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider">Order Count</span>
                <span className="text-lg font-black text-gray-900 mt-1 block">{totalOrders.toLocaleString()}</span>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-2xl text-center">
                <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider">Revenue Processed</span>
                <span className="text-lg font-black text-emerald-650 mt-1 block">₹{estimatedRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-2xl text-center">
                <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider">Average CLV</span>
                <span className="text-lg font-black text-indigo-650 mt-1 block">₹{estimatedClv.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* AI Discoveries & Revenue Potential */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-2">
              
              {/* Discoveries list */}
              <div className="md:col-span-7 bg-gray-50/50 border border-gray-150 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-indigo-500 text-[18px]">psychology</span>
                  AI Segment Discoveries
                </h3>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white border border-gray-100 p-3 rounded-xl flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div>
                      <p className="font-extrabold text-gray-900">324 Customers</p>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">Inactive</span>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-100 p-3 rounded-xl flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <div>
                      <p className="font-extrabold text-gray-900">150 Customers</p>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">VIP</span>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-100 p-3 rounded-xl flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <div>
                      <p className="font-extrabold text-gray-900">185 Customers</p>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">At Risk</span>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-100 p-3 rounded-xl flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                    <div>
                      <p className="font-extrabold text-gray-900">680 Customers</p>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">Coupon Sensitive</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Opportunities list */}
              <div className="md:col-span-5 bg-indigo-50/15 border border-indigo-100/50 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-indigo-500 text-[18px]">polyline</span>
                  Predicted Revenue Opportunities
                </h3>
                
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-gray-500 font-bold">Recover Revenue</span>
                    <span className="font-extrabold text-amber-600">₹1,20,000</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-gray-500 font-bold">VIP Expansion</span>
                    <span className="font-extrabold text-indigo-650">₹75,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-bold">Channel Optimization</span>
                    <span className="font-extrabold text-emerald-600">+18% ROI</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex flex-col items-end gap-3 pt-6 border-t border-gray-100">
              {error && (
                <div className="w-full bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl px-4 py-3 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                  <span>{error}</span>
                </div>
              )}
              <button
                onClick={handleLaunch}
                disabled={isSubmitting}
                className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-xs shadow-lg hover:shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Workspace...
                  </>
                ) : (
                  <>
                    Launch AI Workspace
                    <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
