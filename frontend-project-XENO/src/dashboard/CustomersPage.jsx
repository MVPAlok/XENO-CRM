import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { customerAPI } from '../utils/api';

export default function CustomersPage({ workspaceId, activeCustomerId, clearActiveCustomerId }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter states — initialized from URL params if present
  const [inputValue, setInputValue] = useState(searchParams.get('search') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [cityFilter, setCityFilter] = useState(searchParams.get('city') || '');
  const [frequencyFilter, setFrequencyFilter] = useState(searchParams.get('frequency') || '');
  const [spendFilter, setSpendFilter] = useState(searchParams.get('spend') || '');
  const [dateFilter, setDateFilter] = useState(searchParams.get('date') || '');
  const [channelFilter, setChannelFilter] = useState(searchParams.get('channel') || '');

  // Segment filter from URL (when clicking "View List" from SegmentsPage)
  const segmentId = searchParams.get('segmentId') || '';

  // Server data states
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [aggregates, setAggregates] = useState(null);
  const [segmentInfo, setSegmentInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [page, setPage] = useState(1);

  // Selected customer for the timeline drawer
  const [selectedCust, setSelectedCust] = useState(null);

  const abortRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(inputValue);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Build filter params from UI state
  const filterParams = useMemo(() => {
    const params = { page, limit: 25 };

    if (segmentId) {
      params.segmentId = segmentId;
      return params;
    }

    if (search) params.search = search;
    if (cityFilter) params.city = cityFilter;
    if (channelFilter) params.channel = channelFilter;

    // Map frequency presets to ordersMin/ordersMax
    if (frequencyFilter === 'low') {
      params.ordersMax = '5';
    } else if (frequencyFilter === 'medium') {
      params.ordersMin = '6';
      params.ordersMax = '15';
    } else if (frequencyFilter === 'high') {
      params.ordersMin = '16';
    }

    // Map spend presets to spendMin/spendMax
    if (spendFilter === 'low') {
      params.spendMax = '5000';
    } else if (spendFilter === 'medium') {
      params.spendMin = '5000';
      params.spendMax = '20000';
    } else if (spendFilter === 'high') {
      params.spendMin = '20000';
    }

    // Map date presets to lastPurchaseWithin/lastPurchaseOver
    if (dateFilter === '30') {
      params.lastPurchaseWithin = '30';
    } else if (dateFilter === '60') {
      params.lastPurchaseWithin = '60';
    } else if (dateFilter === '90') {
      params.lastPurchaseWithin = '90';
    } else if (dateFilter === 'over90') {
      params.lastPurchaseOver = '90';
    }

    return params;
  }, [search, cityFilter, frequencyFilter, spendFilter, dateFilter, channelFilter, segmentId, page]);

  // Fetch customers from backend whenever filters change
  const fetchCustomers = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);

    try {
      const data = await customerAPI.filter(workspaceId, filterParams);
      if (data.success) {
        setCustomers(data.customers || []);
        setPagination(data.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
        if (data.aggregates) setAggregates(data.aggregates);
        if (data.segment) setSegmentInfo(data.segment);
        else setSegmentInfo(null);

        // Extract unique cities from current results (for city dropdown)
        if (!cityFilter && data.customers?.length) {
          const newCities = [...new Set(data.customers.map(c => c.city).filter(Boolean))].sort();
          setCities(prev => {
            const merged = [...new Set([...prev, ...newCities])].sort();
            return merged;
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch filtered customers', err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, filterParams, cityFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Load all cities on initial mount for the dropdown
  useEffect(() => {
    if (!workspaceId) return;
    customerAPI.filter(workspaceId, { limit: 1 }).then(data => {
      // We'll populate cities as they come in from different filter results
    }).catch(() => {});
    // Also fetch a larger set just for city values
    customerAPI.filter(workspaceId, { limit: 100 }).then(data => {
      if (data.success && data.customers) {
        const allCities = [...new Set(data.customers.map(c => c.city).filter(Boolean))].sort();
        setCities(prev => [...new Set([...prev, ...allCities])].sort());
      }
    }).catch(() => {});
  }, [workspaceId]);

  // Handle activeCustomerId deep link from simulator
  useEffect(() => {
    if (activeCustomerId && workspaceId) {
      customerAPI.get(workspaceId, activeCustomerId).then(data => {
        if (data.success && data.customer) {
          setSelectedCust(data.customer);
        }
      }).catch(() => {});
      if (clearActiveCustomerId) clearActiveCustomerId();
    }
  }, [activeCustomerId, workspaceId, clearActiveCustomerId]);

  const handleClearSegment = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('segmentId');
    setSearchParams(newParams);
    setSegmentInfo(null);
    setPage(1);
  };

  const handleClearAllFilters = () => {
    setInputValue('');
    setSearch('');
    setCityFilter('');
    setFrequencyFilter('');
    setSpendFilter('');
    setDateFilter('');
    setChannelFilter('');
    setPage(1);
    handleClearSegment();
  };

  const hasActiveFilters = inputValue || search || cityFilter || frequencyFilter || spendFilter || dateFilter || channelFilter || segmentId;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-950">Customer Intelligence Center</h2>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">
            Filter, search, and view complete communication timelines for your shoppers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold">
              <div className="w-3.5 h-3.5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              Filtering...
            </div>
          )}
          <span className="text-xs text-indigo-650 font-bold bg-indigo-50 border border-indigo-100/60 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-indigo-500">database</span>
            {pagination.total.toLocaleString()} Customers{hasActiveFilters ? ' matched' : ' total'}
          </span>
        </div>
      </div>

      {/* Segment Banner */}
      {segmentInfo && (
        <div className="bg-indigo-50/80 border border-indigo-200/60 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center">
              <span className="material-symbols-outlined text-indigo-600 text-[18px]">filter_alt</span>
            </div>
            <div>
              <p className="text-xs font-black text-indigo-900">
                Viewing segment: <span className="text-indigo-600">{segmentInfo.name}</span>
              </p>
              {segmentInfo.description && (
                <p className="text-[10px] text-indigo-700/70 font-semibold mt-0.5">{segmentInfo.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleClearSegment}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 px-3 py-1.5 border border-indigo-200 rounded-xl hover:bg-indigo-100/50"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
            Clear Segment
          </button>
        </div>
      )}

      {/* Aggregates Bar */}
      {aggregates && hasActiveFilters && (
        <div className="grid grid-cols-3 gap-4 animate-in fade-in duration-300">
          <div className="bg-white/80 border border-gray-200/60 rounded-2xl p-4 text-left">
            <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Spend (Filtered)</span>
            <span className="text-lg font-extrabold text-indigo-700">₹{aggregates.totalSpend?.toLocaleString('en-IN') || '0'}</span>
          </div>
          <div className="bg-white/80 border border-gray-200/60 rounded-2xl p-4 text-left">
            <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Avg Order Value</span>
            <span className="text-lg font-extrabold text-emerald-600">₹{aggregates.avgOrderValue?.toLocaleString('en-IN') || '0'}</span>
          </div>
          <div className="bg-white/80 border border-gray-200/60 rounded-2xl p-4 text-left">
            <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Avg Recency (Days)</span>
            <span className="text-lg font-extrabold text-amber-600">{aggregates.avgRecencyDays ?? '—'}</span>
          </div>
        </div>
      )}

      {/* Dynamic Filters Section */}
      {!segmentId && (
        <div className="bg-white/80 border border-gray-200/60 rounded-[2rem] p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Search Input */}
            <div className="relative flex items-center col-span-1 md:col-span-2 lg:col-span-2">
              <span className="material-symbols-outlined absolute left-3 text-[18px] text-gray-400">search</span>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search by name, email, ID..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold"
              />
            </div>

            {/* City Filter */}
            <div>
              <select
                value={cityFilter}
                onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold text-gray-650"
              >
                <option value="">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Frequency Filter */}
            <div>
              <select
                value={frequencyFilter}
                onChange={(e) => { setFrequencyFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold text-gray-650"
              >
                <option value="">Order Frequency</option>
                <option value="low">Low (≤ 5 orders)</option>
                <option value="medium">Medium (6 - 15 orders)</option>
                <option value="high">High (&gt; 15 orders)</option>
              </select>
            </div>

            {/* Spend Filter */}
            <div>
              <select
                value={spendFilter}
                onChange={(e) => { setSpendFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold text-gray-650"
              >
                <option value="">Total Spend</option>
                <option value="low">Budget (&lt; ₹5,000)</option>
                <option value="medium">Average (₹5,000 - ₹20,000)</option>
                <option value="high">VIP (&gt; ₹20,000)</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold text-gray-650"
              >
                <option value="">Last Purchase</option>
                <option value="30">Within 30 Days</option>
                <option value="60">Within 60 Days</option>
                <option value="90">Within 90 Days</option>
                <option value="over90">Over 90 Days (Inactive)</option>
              </select>
            </div>

            {/* Channel Preference */}
            <div>
              <select
                value={channelFilter}
                onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold text-gray-650"
              >
                <option value="">Preferred Channel</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Email">Email</option>
                <option value="SMS">SMS</option>
                <option value="RCS">RCS</option>
              </select>
            </div>

            {/* Clear Filters button */}
            {hasActiveFilters && (
              <div className="col-span-1 md:col-span-3 lg:col-span-6 flex justify-end">
                <button
                  onClick={handleClearAllFilters}
                  className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">filter_alt_off</span>
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customers Data Table */}
      <div className="bg-white border border-gray-200/60 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Customer ID & Name</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-center">Orders</th>
                <th className="px-6 py-4">Total Spend</th>
                <th className="px-6 py-4">CLV</th>
                <th className="px-6 py-4">Last Purchase</th>
                <th className="px-6 py-4">Preferred Channel</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-750">
              {isLoading && customers.length === 0 ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-${i}`} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded-lg w-32" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded-lg w-28" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded-lg w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded-lg w-8 mx-auto" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded-lg w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded-lg w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded-lg w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded-lg w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded-lg w-14" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded-lg w-16 mx-auto" /></td>
                  </tr>
                ))
              ) : customers.length > 0 ? (
                customers.map((cust) => {
                  let statusBadge = 'bg-blue-50 text-blue-700 border-blue-100';
                  if (cust.status === 'VIP') statusBadge = 'bg-purple-50 text-purple-700 border-purple-100';
                  if (cust.status === 'INACTIVE') statusBadge = 'bg-amber-50 text-amber-700 border-amber-100';
                  if (cust.status === 'AT_RISK') statusBadge = 'bg-rose-50 text-rose-700 border-rose-100';

                  let channelIcon = 'chat';
                  let channelColor = 'text-emerald-500';
                  if (cust.preferredChannel === 'Email') { channelIcon = 'mail'; channelColor = 'text-indigo-500'; }
                  else if (cust.preferredChannel === 'SMS') { channelIcon = 'sms'; channelColor = 'text-amber-500'; }
                  else if (cust.preferredChannel === 'RCS') { channelIcon = 'forum'; channelColor = 'text-pink-500'; }

                  return (
                    <tr key={cust.id} className={`hover:bg-gray-50/50 transition-colors ${isLoading ? 'opacity-50' : ''}`}>
                       <td className="px-6 py-4 max-w-[200px]">
                        <div className="flex items-center gap-3">
                          <img
                            alt={cust.name}
                            className="w-8 h-8 rounded-full bg-indigo-50 border border-gray-150 object-cover shrink-0"
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${cust.name}`}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate" title={cust.name}>{cust.name}</p>
                            <span className="text-[10px] text-gray-400 font-bold uppercase block truncate">{cust.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[180px]">
                        <p className="truncate font-semibold text-gray-700" title={cust.email}>{cust.email}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{cust.phone}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{cust.city}</td>
                      <td className="px-6 py-4 text-center font-bold text-gray-900">{cust.totalOrders}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">₹{cust.totalSpend?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-gray-550">₹{cust.clv?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-gray-500">{cust.lastPurchaseDate}</td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 font-bold">
                          <span className={`material-symbols-outlined text-[16px] ${channelColor}`}>{channelIcon}</span>
                          <span>{cust.preferredChannel}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 border text-[10px] font-bold rounded-full ${statusBadge}`}>
                          {cust.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedCust(cust)}
                          className="px-3 py-1.5 border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/30 text-indigo-650 rounded-xl transition-all font-bold text-[10px]"
                        >
                          View Timeline
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-400 font-semibold">
                    {isLoading ? 'Loading...' : 'No customers found matching the selected filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-[11px] text-gray-500 font-semibold">
              Page <span className="font-bold text-gray-900">{pagination.page}</span> of{' '}
              <span className="font-bold text-gray-900">{pagination.totalPages}</span>
              {' · '}
              <span className="text-gray-400">{pagination.total.toLocaleString()} total results</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1 || isLoading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-xl hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                Previous
              </button>

              {/* Page number pills */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      disabled={isLoading}
                      className={`w-8 h-8 rounded-lg text-[11px] font-bold transition-all ${
                        pageNum === pagination.page
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={pagination.page >= pagination.totalPages || isLoading}
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-xl hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Drawer: Communication Timeline */}
      {selectedCust && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-300"
          >
            {/* Drawer Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-5 mb-5">
              <div className="flex items-center gap-3">
                <img
                  alt={selectedCust.name}
                  className="w-12 h-12 rounded-full border border-gray-150"
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedCust.name}`}
                />
                <div>
                  <h3 className="text-base font-bold text-gray-900">{selectedCust.name}</h3>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">{selectedCust.id} • {selectedCust.city}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCust(null)}
                className="p-1.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-700 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            {/* Profile Overview */}
            <div className="bg-gray-50/50 border border-gray-100 rounded-[1.5rem] p-5 mb-6 space-y-4 text-left">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">CRM PROFILE OVERVIEW</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Lifetime Value (LTV)</span>
                  <span className="text-base font-extrabold text-indigo-700">₹{selectedCust.clv ? selectedCust.clv.toLocaleString() : '8,450'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total Revenue</span>
                  <span className="text-base font-extrabold text-gray-900">₹{selectedCust.totalSpend?.toLocaleString() || 0}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total Purchases</span>
                  <span className="text-sm font-bold text-gray-800">{selectedCust.totalOrders} Orders</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Preferred Channel</span>
                  <span className="text-sm font-bold text-gray-850 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-indigo-500">
                      {selectedCust.preferredChannel === 'Email' ? 'mail' : selectedCust.preferredChannel === 'SMS' ? 'sms' : selectedCust.preferredChannel === 'RCS' ? 'forum' : 'chat'}
                    </span>
                    {selectedCust.preferredChannel}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Segment Membership</span>
                  <span className="inline-block px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-[9px] rounded-full mt-0.5 uppercase">
                    {selectedCust.status} Cohort
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Campaign Engagement</span>
                  <span className="text-sm font-bold text-gray-850">{selectedCust.timeline ? selectedCust.timeline.length : 0} dispatches</span>
                </div>
              </div>
            </div>

            {/* Journey Timeline */}
            <div className="text-left flex-1">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-indigo-500 text-[18px]">history</span>
                Chronological Journey Timeline
              </h4>

              <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-150">
                {/* Latest Churn / Inactive Segment State */}
                {selectedCust.status === 'INACTIVE' && (
                  <div className="relative pl-8">
                    <div className="absolute left-0.5 top-0.5 w-6 h-6 rounded-full flex items-center justify-center bg-amber-50 border border-amber-200 text-amber-700 shadow-xs">
                      <span className="material-symbols-outlined text-[13px] font-bold">hourglass_empty</span>
                    </div>
                    <div className="bg-amber-50/15 border border-amber-100 rounded-2xl p-4 space-y-1 shadow-xs">
                      <div className="flex justify-between items-center text-[10px] font-bold text-amber-800">
                        <span>Entered Inactive Segment</span>
                        <span>90 Days Inactive</span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                        Customer exceeded the purchase interval gap of 95 days. Flagged for revenue recovery campaign.
                      </p>
                    </div>
                  </div>
                )}

                {selectedCust.status === 'AT_RISK' && (
                  <div className="relative pl-8">
                    <div className="absolute left-0.5 top-0.5 w-6 h-6 rounded-full flex items-center justify-center bg-rose-50 border border-rose-200 text-rose-700 shadow-xs">
                      <span className="material-symbols-outlined text-[13px] font-bold">warning</span>
                    </div>
                    <div className="bg-rose-50/15 border border-rose-100 rounded-2xl p-4 space-y-1 shadow-xs">
                      <div className="flex justify-between items-center text-[10px] font-bold text-rose-805">
                        <span>Entered Churn Risk Cohort</span>
                        <span>60 Days Inactive</span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                        Purchase intervals dropped by 45%. Similarity to historical churn trends triggered at-risk flag.
                      </p>
                    </div>
                  </div>
                )}

                {/* Campaign Touchpoints */}
                {selectedCust.timeline && selectedCust.timeline.map((campaignBlock) => {
                  let channelIcon = 'chat';
                  let channelBg = 'bg-emerald-500 text-white';
                  if (campaignBlock.channel === 'Email') { channelIcon = 'mail'; channelBg = 'bg-indigo-500 text-white'; }
                  else if (campaignBlock.channel === 'SMS') { channelIcon = 'sms'; channelBg = 'bg-amber-500 text-white'; }
                  else if (campaignBlock.channel === 'RCS') { channelIcon = 'forum'; channelBg = 'bg-pink-500 text-white'; }

                  return (
                    <div key={campaignBlock.id} className="relative pl-8">
                      <div className={`absolute left-0.5 top-0.5 w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${channelBg}`}>
                        <span className="material-symbols-outlined text-[14px]">{channelIcon}</span>
                      </div>

                      <div className="bg-white border border-gray-150 rounded-2xl p-4 space-y-3 shadow-xs hover:border-indigo-150 transition-colors text-left">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-gray-900">{campaignBlock.campaignName}</p>
                            <span className="text-[10px] text-gray-400 font-semibold">{campaignBlock.channel} Outbound</span>
                          </div>
                          <span className="text-[9px] text-gray-400 font-bold">
                            {new Date(campaignBlock.events[0].timestamp).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="space-y-2 border-t border-gray-100 pt-2.5">
                          {campaignBlock.events.map((evt, eIdx) => {
                            let statusColor = 'text-indigo-650';
                            let iconName = 'circle';
                            if (evt.type.includes('Sent')) { statusColor = 'text-gray-500'; iconName = 'arrow_forward'; }
                            else if (evt.type.includes('Delivered')) { statusColor = 'text-blue-500'; iconName = 'mark_email_read'; }
                            else if (evt.type.includes('Opened') || evt.type.includes('Read')) { statusColor = 'text-amber-500'; iconName = 'visibility'; }
                            else if (evt.type.includes('Clicked')) { statusColor = 'text-pink-500'; iconName = 'ads_click'; }
                            else if (evt.type.includes('Converted')) { statusColor = 'text-emerald-600'; iconName = 'local_mall'; }

                            return (
                              <div key={eIdx} className="flex justify-between items-center text-[10px]">
                                <span className="flex items-center gap-1.5 font-bold">
                                  <span className="material-symbols-outlined text-[12px] text-gray-400">{iconName}</span>
                                  <span className={statusColor}>{evt.type}</span>
                                  {evt.value && (
                                    <span className="bg-emerald-50 text-emerald-700 px-1 py-0.2 rounded font-extrabold border border-emerald-100/50">
                                      {evt.value}
                                    </span>
                                  )}
                                </span>
                                <span className="text-gray-400 font-medium">
                                  {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Profile Inception Milestone */}
                <div className="relative pl-8">
                  <div className="absolute left-0.5 top-0.5 w-6 h-6 rounded-full flex items-center justify-center bg-indigo-50 border border-indigo-200 text-indigo-650 shadow-xs">
                    <span className="material-symbols-outlined text-[13px] font-bold">person_add</span>
                  </div>
                  <div className="bg-white border border-gray-150 rounded-2xl p-4 space-y-1 shadow-xs">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                      <span>Customer Profile Ingested</span>
                      <span>Initial Registration</span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                      Customer data successfully mapped and behavioral parameters indexed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
