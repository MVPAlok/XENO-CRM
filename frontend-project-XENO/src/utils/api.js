const API_ROOT =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api/v1' : 'https://xeno-crm-fcjc.onrender.com/api/v1');
const AUTH_BASE = `${API_ROOT}/auth`;

// --- OFFLINE DEMO MODE DATA & HANDLERS ---
const WS_KEY = 'xeno_demo_workspaces';
const CAMP_KEY = 'xeno_demo_campaigns';
const SEG_KEY = 'xeno_demo_segments';
const NOTIF_KEY = 'xeno_demo_notifications';
const LOGS_KEY = 'xeno_demo_sim_logs';
const METRICS_KEY = 'xeno_demo_sim_metrics';
const CONTROL_KEY = 'xeno_demo_sim_control';

const getDemoWorkspaces = () => {
  const list = localStorage.getItem(WS_KEY);
  if (!list) {
    const defaultList = [
      {
        id: "demo-ws-1",
        brandName: "Apex Cosmetics (Demo)",
        industry: "Beauty & Personal Care",
        businessType: "E-commerce",
        primaryChannel: "WhatsApp",
        monthlyCustomers: "10k - 50k",
        isArchived: false,
        stats: {
          customers: 25432,
          orders: 58201
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(WS_KEY, JSON.stringify(defaultList));
    return defaultList;
  }
  return JSON.parse(list);
};

const saveDemoWorkspaces = (list) => {
  localStorage.setItem(WS_KEY, JSON.stringify(list));
};

const getDemoCampaigns = () => {
  const list = localStorage.getItem(CAMP_KEY);
  if (!list) {
    const defaultList = [
      { id: 'camp-1', name: 'VIP Early Access Promo', segment: 'VIP Customers', segmentId: 'seg-1', channel: 'WhatsApp', status: 'Running', sentCount: 1240, deliveryRate: 98.4, openRate: 88.2, clickRate: 45.6, conversionRate: 15.3, revenueGenerated: 320000, messageBody: 'Hey {{firstName}}, you are a VIP! Enjoy 20% off.', createdBy: 'Demo User', createdAt: '2026-06-15T09:00:00Z' },
      { id: 'camp-2', name: 'Win-back Cohort B', segment: 'Inactive Customers', segmentId: 'seg-2', channel: 'Email', status: 'Completed', sentCount: 852, deliveryRate: 99.1, openRate: 35.4, clickRate: 12.8, conversionRate: 4.2, revenueGenerated: 85000, messageBody: 'We miss you, {{firstName}}! Here is a special gift.', createdBy: 'Demo User', createdAt: '2026-06-10T10:00:00Z' },
      { id: 'camp-3', name: 'Retention Discount', segment: 'At Risk Customers', segmentId: 'seg-3', channel: 'WhatsApp', status: 'Paused', sentCount: 420, deliveryRate: 97.6, openRate: 72.1, clickRate: 28.5, conversionRate: 8.7, revenueGenerated: 142000, messageBody: 'Hey {{firstName}}, long time no see! Here is 10% off.', createdBy: 'Demo User', createdAt: '2026-06-12T11:30:00Z' }
    ];
    localStorage.setItem(CAMP_KEY, JSON.stringify(defaultList));
    return defaultList;
  }
  return JSON.parse(list);
};

const saveDemoCampaigns = (list) => {
  localStorage.setItem(CAMP_KEY, JSON.stringify(list));
};

const getDemoSegments = () => {
  const list = localStorage.getItem(SEG_KEY);
  if (!list) {
    const defaultList = [
      { id: 'seg-1', name: 'VIP Customers', count: 12, revenuePotential: 125000, expectedConversion: '18%', confidenceScore: 98, rules: [{ field: 'spend', operator: 'gte', value: 25000 }] },
      { id: 'seg-2', name: 'Inactive Customers', count: 85, revenuePotential: 48000, expectedConversion: '12%', confidenceScore: 94, rules: [{ field: 'lastPurchase', operator: 'lt_days', value: 90 }] },
      { id: 'seg-3', name: 'At Risk Customers', count: 42, revenuePotential: 35000, expectedConversion: '8%', confidenceScore: 82, rules: [{ field: 'status', operator: 'eq', value: 'At Risk' }] },
      { id: 'seg-4', name: 'Recent Buyers', count: 154, revenuePotential: 0, expectedConversion: '0%', confidenceScore: 95, rules: [] }
    ];
    localStorage.setItem(SEG_KEY, JSON.stringify(defaultList));
    return defaultList;
  }
  return JSON.parse(list);
};

const saveDemoSegments = (list) => {
  localStorage.setItem(SEG_KEY, JSON.stringify(list));
};

const getDemoNotifications = () => {
  const list = localStorage.getItem(NOTIF_KEY);
  if (!list) {
    const defaultList = [
      { id: 'n1', text: 'AI Campaign "VIP Early Access Promo" hit 15.3% conversion target!', time: '10 mins today', read: false, type: 'success' },
      { id: 'n2', text: 'Dataset ingestion complete: 25,432 customers added.', time: '1 hour today', read: true, type: 'info' }
    ];
    localStorage.setItem(NOTIF_KEY, JSON.stringify(defaultList));
    return defaultList;
  }
  return JSON.parse(list);
};

const saveDemoNotifications = (list) => {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(list));
};

const getDemoSimLogs = () => {
  const list = localStorage.getItem(LOGS_KEY);
  if (!list) {
    const defaultList = [
      { id: 'log-1', type: 'Sent', message: 'Campaign VIP Early Access Promo sent to Priya Nair via WhatsApp', timestamp: new Date().toISOString() },
      { id: 'log-2', type: 'Delivered', message: 'Campaign VIP Early Access Promo delivered to Priya Nair', timestamp: new Date().toISOString() },
      { id: 'log-3', type: 'Read', message: 'Campaign VIP Early Access Promo read by Priya Nair', timestamp: new Date().toISOString() },
      { id: 'log-4', type: 'Converted', message: 'Priya Nair converted! Purchase of ₹4,500 attributed to VIP Early Access Promo', timestamp: new Date().toISOString() }
    ];
    localStorage.setItem(LOGS_KEY, JSON.stringify(defaultList));
    return defaultList;
  }
  return JSON.parse(list);
};

const saveDemoSimLogs = (list) => {
  localStorage.setItem(LOGS_KEY, JSON.stringify(list));
};

const getDemoSimMetrics = () => {
  const data = localStorage.getItem(METRICS_KEY);
  if (!data) {
    const defaultData = {
      sent: 1240,
      delivered: 1210,
      failed: 30,
      read: 980,
      clicked: 540,
      converted: 180
    };
    localStorage.setItem(METRICS_KEY, JSON.stringify(defaultData));
    return defaultData;
  }
  return JSON.parse(data);
};

const saveDemoSimMetrics = (data) => {
  localStorage.setItem(METRICS_KEY, JSON.stringify(data));
};

const getDemoSimControl = () => {
  const data = localStorage.getItem(CONTROL_KEY);
  if (!data) {
    const defaultData = { isPaused: true, speed: 4 };
    localStorage.setItem(CONTROL_KEY, JSON.stringify(defaultData));
    return defaultData;
  }
  return JSON.parse(data);
};

const saveDemoSimControl = (data) => {
  localStorage.setItem(CONTROL_KEY, JSON.stringify(data));
};

const demoCustomers = [
  { id: 'c1', firstName: 'Aarav', lastName: 'Mehta', email: 'aarav.mehta@gmail.com', phone: '+91 98765 43210', city: 'Mumbai', spend: 28500, orders: 14, status: 'Active', channel: 'WhatsApp', lastPurchase: '2026-06-15T10:30:00Z', createdAt: '2026-01-15T10:30:00Z' },
  { id: 'c2', firstName: 'Priya', lastName: 'Nair', email: 'priya.nair@yahoo.com', phone: '+91 98123 45678', city: 'Bengaluru', spend: 32000, orders: 18, status: 'Active', channel: 'WhatsApp', lastPurchase: '2026-06-16T14:20:00Z', createdAt: '2026-01-10T14:20:00Z' },
  { id: 'c3', firstName: 'Rohan', lastName: 'Gupta', email: 'rohan.gupta@outlook.com', phone: '+91 97654 32109', city: 'Delhi', spend: 1850, orders: 1, status: 'Inactive', channel: 'Email', lastPurchase: '2026-02-10T11:15:00Z', createdAt: '2026-02-10T11:15:00Z' },
  { id: 'c4', firstName: 'Sneha', lastName: 'Reddy', email: 'sneha.reddy@gmail.com', phone: '+91 95432 10987', city: 'Hyderabad', spend: 12400, orders: 6, status: 'Active', channel: 'Email', lastPurchase: '2026-05-20T09:00:00Z', createdAt: '2026-02-20T09:00:00Z' },
  { id: 'c5', firstName: 'Amit', lastName: 'Sharma', email: 'amit.sharma@gmail.com', phone: '+91 91234 56789', city: 'Mumbai', spend: 450, orders: 1, status: 'Inactive', channel: 'SMS', lastPurchase: '2025-12-05T16:45:00Z', createdAt: '2025-12-05T16:45:00Z' },
  { id: 'c6', firstName: 'Ananya', lastName: 'Desai', email: 'ananya.desai@gmail.com', phone: '+91 93210 98765', city: 'Pune', spend: 27800, orders: 12, status: 'Active', channel: 'WhatsApp', lastPurchase: '2026-06-12T13:10:00Z', createdAt: '2026-03-12T13:10:00Z' },
  { id: 'c7', firstName: 'Vikram', lastName: 'Singh', email: 'vikram.singh@gmail.com', phone: '+91 94321 09876', city: 'Jaipur', spend: 4300, orders: 3, status: 'At Risk', channel: 'Email', lastPurchase: '2026-04-01T10:00:00Z', createdAt: '2026-03-01T10:00:00Z' },
  { id: 'c8', firstName: 'Kavya', lastName: 'Joshi', email: 'kavya.joshi@gmail.com', phone: '+91 99887 76655', city: 'Ahmedabad', spend: 9500, orders: 5, status: 'Active', channel: 'WhatsApp', lastPurchase: '2026-06-05T15:30:00Z', createdAt: '2026-04-05T15:30:00Z' },
  { id: 'c9', firstName: 'Kabir', lastName: 'Kapoor', email: 'kabir.kapoor@gmail.com', phone: '+91 98765 12345', city: 'Mumbai', spend: 15400, orders: 8, status: 'Active', channel: 'WhatsApp', lastPurchase: '2026-06-14T18:00:00Z', createdAt: '2026-04-14T18:00:00Z' },
  { id: 'c10', firstName: 'Neha', lastName: 'Patel', email: 'neha.patel@gmail.com', phone: '+91 97654 87654', city: 'Surat', spend: 2400, orders: 2, status: 'At Risk', channel: 'SMS', lastPurchase: '2026-03-25T11:40:00Z', createdAt: '2026-03-25T11:40:00Z' }
];

const maybeProgressSimulation = () => {
  const control = getDemoSimControl();
  if (control.isPaused) return;

  const logs = getDemoSimLogs();
  const metrics = getDemoSimMetrics();

  const eventTypes = ['Sent', 'Delivered', 'Read', 'Clicked', 'Converted'];
  const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const names = ['Aarav Mehta', 'Priya Nair', 'Rohan Gupta', 'Sneha Reddy', 'Amit Sharma', 'Ananya Desai', 'Vikram Singh', 'Kavya Joshi'];
  const name = names[Math.floor(Math.random() * names.length)];
  let message = '';
  
  if (randomType === 'Sent') {
    metrics.sent += 1;
    message = `Campaign VIP Early Access Promo sent to ${name} via WhatsApp`;
  } else if (randomType === 'Delivered') {
    metrics.delivered += 1;
    message = `Campaign VIP Early Access Promo delivered to ${name}`;
  } else if (randomType === 'Read') {
    metrics.read += 1;
    message = `Campaign VIP Early Access Promo read by ${name}`;
  } else if (randomType === 'Clicked') {
    metrics.clicked += 1;
    message = `${name} clicked the link in VIP Early Access Promo message`;
  } else if (randomType === 'Converted') {
    metrics.converted += 1;
    const amt = Math.floor(Math.random() * 3000) + 500;
    message = `${name} converted! Purchase of ₹${amt} attributed to VIP Early Access Promo`;
  }

  const newLog = {
    id: `log-${Date.now()}`,
    type: randomType,
    message,
    timestamp: new Date().toISOString()
  };

  saveDemoSimLogs([newLog, ...logs].slice(0, 50));
  saveDemoSimMetrics(metrics);
};

const handleDemoMockRequest = async (path, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  const cleanPath = path.split('?')[0];

  // Soft delay for smooth visual transitions
  await new Promise(resolve => setTimeout(resolve, 300));

  // Workspaces endpoint
  if (cleanPath === '/workspaces') {
    if (method === 'GET') {
      return { success: true, workspaces: getDemoWorkspaces() };
    }
    if (method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const newWs = {
        id: `demo-ws-${Date.now()}`,
        brandName: body.brandName || "New Brand",
        industry: body.industry || "Other",
        businessType: body.businessType || "Other",
        primaryChannel: body.primaryChannel || "Email",
        monthlyCustomers: body.monthlyCustomers || "0-1000",
        isArchived: false,
        stats: { customers: 25432, orders: 58201 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const list = [...getDemoWorkspaces(), newWs];
      saveDemoWorkspaces(list);
      return { success: true, workspace: newWs };
    }
  }

  // Workspaces specific Match /workspaces/:id
  const wsMatch = cleanPath.match(/^\/workspaces\/([^\/]+)$/);
  if (wsMatch) {
    const wsId = wsMatch[1];
    if (method === 'GET') {
      const ws = getDemoWorkspaces().find(w => w.id === wsId);
      if (!ws) throw new Error("Workspace not found");
      return { success: true, workspace: ws };
    }
    if (method === 'PATCH') {
      const body = JSON.parse(options.body || '{}');
      const list = getDemoWorkspaces().map(w => {
        if (w.id === wsId) {
          return { ...w, ...body, updatedAt: new Date().toISOString() };
        }
        return w;
      });
      saveDemoWorkspaces(list);
      const updated = list.find(w => w.id === wsId);
      return { success: true, workspace: updated };
    }
    if (method === 'DELETE') {
      const list = getDemoWorkspaces().filter(w => w.id !== wsId);
      saveDemoWorkspaces(list);
      return { success: true };
    }
  }

  // Duplication Match /workspaces/:id/duplicate
  const wsDuplicateMatch = cleanPath.match(/^\/workspaces\/([^\/]+)\/duplicate$/);
  if (wsDuplicateMatch && method === 'POST') {
    const wsId = wsDuplicateMatch[1];
    const ws = getDemoWorkspaces().find(w => w.id === wsId);
    if (!ws) throw new Error("Workspace not found");
    const duplicate = {
      ...ws,
      id: `demo-ws-${Date.now()}`,
      brandName: `${ws.brandName} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const list = [...getDemoWorkspaces(), duplicate];
    saveDemoWorkspaces(list);
    return { success: true, workspace: duplicate };
  }

  // Customers Match /workspaces/:id/customers
  const custMatch = cleanPath.match(/^\/workspaces\/([^\/]+)\/customers$/);
  if (custMatch && method === 'GET') {
    let filtered = [...demoCustomers];
    const searchParams = new URL(path, 'http://dummy.com').searchParams;
    const search = searchParams.get('search');
    if (search) {
      const low = search.toLowerCase();
      filtered = filtered.filter(c => 
        c.firstName.toLowerCase().includes(low) || 
        c.lastName.toLowerCase().includes(low) || 
        c.email.toLowerCase().includes(low)
      );
    }
    return { success: true, customers: filtered };
  }

  // Customer detailed match
  const custGetMatch = cleanPath.match(/^\/workspaces\/([^\/]+)\/customers\/([^\/]+)$/);
  if (custGetMatch && method === 'GET') {
    const custId = custGetMatch[2];
    const customer = demoCustomers.find(c => c.id === custId);
    if (!customer) throw new Error("Customer not found");
    const mockOrders = [
      { id: 'o1', orderNumber: 'ORD-1024', amount: customer.spend * 0.4, status: 'Delivered', purchaseDate: '2026-06-12T10:00:00Z' },
      { id: 'o2', orderNumber: 'ORD-1011', amount: customer.spend * 0.6, status: 'Delivered', purchaseDate: '2026-05-15T14:30:00Z' }
    ];
    return { success: true, customer: { ...customer, orders: mockOrders } };
  }

  // Campaigns Match /workspaces/:id/campaigns
  const campMatch = cleanPath.match(/^\/workspaces\/([^\/]+)\/campaigns$/);
  if (campMatch) {
    if (method === 'GET') {
      return { success: true, campaigns: getDemoCampaigns() };
    }
    if (method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const newCamp = {
        id: `camp-${Date.now()}`,
        name: body.name || 'Untitled Campaign',
        segment: body.segment || 'All Customers',
        segmentId: body.segmentId || 'seg-all',
        channel: body.channel || 'WhatsApp',
        status: body.status || 'Running',
        sentCount: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        conversionRate: 0,
        revenueGenerated: 0,
        messageBody: body.messageBody || '',
        createdBy: 'Demo User',
        createdAt: new Date().toISOString()
      };
      const list = [newCamp, ...getDemoCampaigns()];
      saveDemoCampaigns(list);
      return { success: true, campaign: newCamp };
    }
  }

  // Segments Match /workspaces/:id/segments
  const segMatch = cleanPath.match(/^\/workspaces\/([^\/]+)\/segments$/);
  if (segMatch) {
    if (method === 'GET') {
      return { success: true, segments: getDemoSegments() };
    }
    if (method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const newSeg = {
        id: `seg-${Date.now()}`,
        name: body.name || 'Custom Segment',
        count: Math.floor(Math.random() * 50) + 10,
        revenuePotential: Math.floor(Math.random() * 80000) + 10000,
        expectedConversion: `${Math.floor(Math.random() * 15) + 5}%`,
        confidenceScore: Math.floor(Math.random() * 10) + 88,
        rules: body.rules || []
      };
      const list = [...getDemoSegments(), newSeg];
      saveDemoSegments(list);
      return { success: true, segment: newSeg };
    }
  }

  // Segments preview
  const segPreviewMatch = cleanPath.match(/^\/workspaces\/([^\/]+)\/segments\/preview$/);
  if (segPreviewMatch && method === 'POST') {
    return {
      success: true,
      count: Math.floor(Math.random() * 15) + 5,
      customers: demoCustomers.slice(0, 5)
    };
  }

  // Analytics Match /workspaces/:id/analytics/overview
  const analyticsMatch = cleanPath.match(/^\/workspaces\/([^\/]+)\/analytics\/overview$/);
  if (analyticsMatch && method === 'GET') {
    const campaigns = getDemoCampaigns();
    const segments = getDemoSegments();
    const inactiveSegment = segments.find(s => s.name === 'Inactive Customers') || { revenuePotential: 48000 };
    return {
      success: true,
      kpis: {
        totalCustomers: { value: '25,432', change: '+12.4%', isPositive: true, label: 'Total Customers' },
        totalRevenue: { value: '₹12,45,200', change: '+8.2%', isPositive: true, label: 'Total Revenue' },
        activeCampaigns: { value: String(campaigns.filter(c => c.status === 'Running').length), change: '+1', isPositive: true, label: 'Active Campaigns' },
        conversionRate: { value: '14.2%', change: '+2.4%', isPositive: true, label: 'Conversion Rate' },
        customerLifetimeValue: { value: '₹4,230', change: '+5.1%', isPositive: true, label: 'Avg Customer CLV' },
        campaignRevenue: { value: `₹${(campaigns.reduce((sum, c) => sum + c.revenueGenerated, 0)).toLocaleString('en-IN')}`, change: '+14.6%', isPositive: true, label: 'Campaign Attributed Rev' }
      },
      insights: [
        { id: 'ins-1', title: 'Win-back spike detected', description: `Inactive customers show high propensity to purchase if reached via WhatsApp. Projected recovery of ₹${inactiveSegment.revenuePotential.toLocaleString('en-IN')}.` },
        { id: 'ins-2', title: 'LTV Uplift', description: 'VIP customers are responding 20% better to exclusive early access campaigns.' }
      ]
    };
  }

  // Simulator Logs Match /workspaces/:id/campaigns/simulator/logs
  const simLogsMatch = cleanPath.match(/^\/workspaces\/([^\/]+)\/campaigns\/simulator\/logs$/);
  if (simLogsMatch && method === 'GET') {
    maybeProgressSimulation();
    return { success: true, logs: getDemoSimLogs() };
  }

  // Simulator Metrics Match /workspaces/:id/campaigns/simulator/metrics
  const simMetricsMatch = cleanPath.match(/^\/workspaces\/([^\/]+)\/campaigns\/simulator\/metrics$/);
  if (simMetricsMatch && method === 'GET') {
    return { success: true, metrics: getDemoSimMetrics() };
  }

  // Simulator Control Match /workspaces/:id/campaigns/simulator/control
  const simControlMatch = cleanPath.match(/^\/workspaces\/([^\/]+)\/campaigns\/simulator\/control$/);
  if (simControlMatch && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const control = getDemoSimControl();
    if (body.isPaused !== undefined) control.isPaused = body.isPaused;
    if (body.speed !== undefined) control.speed = body.speed;
    saveDemoSimControl(control);
    return { success: true, settings: control };
  }

  // Notifications Match /workspaces/:id/notifications
  const notifMatch = cleanPath.match(/^\/workspaces\/([^\/]+)\/notifications$/);
  if (notifMatch && method === 'GET') {
    return { success: true, notifications: getDemoNotifications() };
  }

  // Notifications Unread Count Match /workspaces/:id/notifications/unread-count
  const notifUnreadMatch = cleanPath.match(/^\/workspaces\/([^\/]+)\/notifications\/unread-count$/);
  if (notifUnreadMatch && method === 'GET') {
    return { success: true, count: getDemoNotifications().filter(n => !n.read).length };
  }

  // Notifications Read Match /workspaces/:id/notifications/read
  const notifReadMatch = cleanPath.match(/^\/workspaces\/([^\/]+)\/notifications\/read$/);
  if (notifReadMatch && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const ids = body.ids || [];
    const list = getDemoNotifications().map(n => ids.includes(n.id) ? { ...n, read: true } : n);
    saveDemoNotifications(list);
    return { success: true };
  }

  // Copilot Chats Match /workspaces/:id/chats/conversations
  const copilotConvMatch = cleanPath.match(/^\/workspaces\/([^\/]+)\/chats\/conversations$/);
  if (copilotConvMatch) {
    if (method === 'GET') {
      return { success: true, conversations: [{ id: 'conv-demo', title: 'Xeno AI Assistant' }] };
    }
    if (method === 'POST') {
      return { success: true, conversation: { id: 'conv-demo', title: 'Xeno AI Assistant' } };
    }
  }

  // Copilot Message Send Match /workspaces/:id/chats/conversations/:convId/messages
  const copilotMsgMatch = cleanPath.match(/^\/workspaces\/([^\/]+)\/chats\/conversations\/([^\/]+)\/messages$/);
  if (copilotMsgMatch && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const text = (body.text || '').toLowerCase();
    
    let reply = "I'm here to help you design campaign flows, create customer cohorts, or view analytical insights. Ask me about your VIP segments or launching a win-back campaign!";
    let action = null;

    if (text.includes('win-back') || text.includes('inactive')) {
      const segments = getDemoSegments();
      const inactiveSegment = segments.find(s => s.name === 'Inactive Customers') || { count: 85, revenuePotential: 48000 };
      reply = `I've analyzed your disengaged audience and structured a smart Win-back WhatsApp outreach targeting ${inactiveSegment.count} inactive customers. You can execute this directly from the Growth Studio.`;
      action = { type: 'suggest_campaign', prompt: 'Bring back inactive customers with a win-back offer.' };
    } else if (text.includes('vip') || text.includes('early access')) {
      reply = "Your VIP tier shows high potential. I suggest offering early access to new personal care arrivals. Would you like to create this campaign now?";
      action = { type: 'suggest_campaign', prompt: 'Draft an early access campaign for VIP customers.' };
    } else if (text.includes('segment') || text.includes('cohort')) {
      reply = "You currently have 4 active cohorts: VIP Customers, Inactive Customers, At Risk Customers, and Recent Buyers. You can explore them in detail on the Segments tab.";
    }

    return {
      success: true,
      message: {
        id: `msg-${Date.now()}`,
        text: reply,
        sender: 'ai',
        action,
        timestamp: new Date().toISOString()
      }
    };
  }

  return { success: true };
};

export const getSessionTokens = () => {
  return {
    accessToken: localStorage.getItem('xeno_access_token'),
    refreshToken: localStorage.getItem('xeno_refresh_token'),
  };
};

export const setSessionTokens = (accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem('xeno_access_token', accessToken);
  if (refreshToken) localStorage.setItem('xeno_refresh_token', refreshToken);
};

export const clearSessionTokens = () => {
  localStorage.removeItem('xeno_access_token');
  localStorage.removeItem('xeno_refresh_token');
};

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (accessToken) => {
  refreshSubscribers.forEach((cb) => cb(accessToken));
  refreshSubscribers = [];
};

async function baseRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const { accessToken } = getSessionTokens();
  if (accessToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    const error = new Error(
      'Cannot reach the API server. Make sure the backend is running (port 5000) and try again.'
    );
    error.status = 0;
    throw error;
  }

  if (response.status === 204) {
    return { success: true };
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.detail || data.message || data.title || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function apiRequest(path, options = {}) {
  const { accessToken } = getSessionTokens();
  if (accessToken === 'demo_access_token') {
    return handleDemoMockRequest(path, options);
  }

  const url = path.startsWith('http') ? path : `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`;
  try {
    return await baseRequest(url, options);
  } catch (error) {
    const { refreshToken } = getSessionTokens();
    if (error.status === 401 && refreshToken && !options._retry) {
      options._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshData = await baseRequest(`${AUTH_BASE}/refresh`, {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
          });
          if (refreshData.success && refreshData.accessToken) {
            setSessionTokens(refreshData.accessToken, refreshData.refreshToken);
            onTokenRefreshed(refreshData.accessToken);
            isRefreshing = false;
          } else {
            throw new Error('Refresh failed');
          }
        } catch (refreshErr) {
          clearSessionTokens();
          isRefreshing = false;
          window.dispatchEvent(new Event('xeno_auth_expired'));
          throw refreshErr;
        }
      }

      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newAccessToken) => {
          const retryOptions = {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newAccessToken}`,
            },
          };
          resolve(baseRequest(url, retryOptions));
        });
        setTimeout(() => reject(error), 15000);
      });
    }
    throw error;
  }
}


// Authentication API
export const authAPI = {
  signup: (userData) =>
    apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  verifyEmail: (token) =>
    apiRequest(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: 'POST',
    }),

  login: (credentials) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getMe: () =>
    apiRequest('/auth/me', {
      method: 'GET',
    }),

  forgotPassword: (email) =>
    apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token, password) =>
    apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),

  logout: () =>
    apiRequest('/auth/logout', {
      method: 'POST',
    }).finally(() => {
      clearSessionTokens();
    }),

  logoutAll: () =>
    apiRequest('/auth/logout-all', {
      method: 'POST',
    }).finally(() => {
      clearSessionTokens();
    }),
};

export const workspaceAPI = {
  list: () => apiRequest('/workspaces', { method: 'GET' }),
  create: (data) => apiRequest('/workspaces', { method: 'POST', body: JSON.stringify(data) }),
  get: (id) => apiRequest(`/workspaces/${id}`, { method: 'GET' }),
  patch: (id, data) => apiRequest(`/workspaces/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  duplicate: (id) => apiRequest(`/workspaces/${id}/duplicate`, { method: 'POST' }),
  delete: (id) => apiRequest(`/workspaces/${id}`, { method: 'DELETE' }),
};

export const customerAPI = {
  list: (wsId, query = '') => apiRequest(`/workspaces/${wsId}/customers${query}`, { method: 'GET' }),
  get: (wsId, custId) => apiRequest(`/workspaces/${wsId}/customers/${custId}`, { method: 'GET' }),
  filter: (wsId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.search) params.set('search', filters.search);
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.order) params.set('order', filters.order);
    if (filters.status) params.set('status', filters.status);
    if (filters.city) params.set('city', filters.city);
    if (filters.channel) params.set('channel', filters.channel);
    if (filters.spendMin) params.set('spendMin', String(filters.spendMin));
    if (filters.spendMax) params.set('spendMax', String(filters.spendMax));
    if (filters.ordersMin) params.set('ordersMin', String(filters.ordersMin));
    if (filters.ordersMax) params.set('ordersMax', String(filters.ordersMax));
    if (filters.lastPurchaseWithin) params.set('lastPurchaseWithin', String(filters.lastPurchaseWithin));
    if (filters.lastPurchaseOver) params.set('lastPurchaseOver', String(filters.lastPurchaseOver));
    if (filters.segmentId) params.set('segmentId', filters.segmentId);
    const qs = params.toString();
    return apiRequest(`/workspaces/${wsId}/customers${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
};

export const segmentAPI = {
  list: (wsId) => apiRequest(`/workspaces/${wsId}/segments`, { method: 'GET' }),
  create: (wsId, data) => apiRequest(`/workspaces/${wsId}/segments`, { method: 'POST', body: JSON.stringify(data) }),
  preview: (wsId, rules, page = 1, limit = 25) =>
    apiRequest(`/workspaces/${wsId}/segments/preview`, {
      method: 'POST',
      body: JSON.stringify({ rules, page, limit }),
    }),
};

export const campaignAPI = {
  list: (wsId, query = '') => apiRequest(`/workspaces/${wsId}/campaigns${query}`, { method: 'GET' }),
  create: (wsId, data) => apiRequest(`/workspaces/${wsId}/campaigns`, { method: 'POST', body: JSON.stringify(data) }),
};

export const analyticsAPI = {
  getOverview: (wsId) => apiRequest(`/workspaces/${wsId}/analytics/overview`, { method: 'GET' }),
};

export const simulatorAPI = {
  getLogs: (wsId, query = '') => apiRequest(`/workspaces/${wsId}/campaigns/simulator/logs${query}`, { method: 'GET' }),
  getMetrics: (wsId) => apiRequest(`/workspaces/${wsId}/campaigns/simulator/metrics`, { method: 'GET' }),
  control: (wsId, settings) =>
    apiRequest(`/workspaces/${wsId}/campaigns/simulator/control`, {
      method: 'POST',
      body: JSON.stringify(settings),
    }),
};

export const copilotAPI = {
  listConversations: (wsId) => apiRequest(`/workspaces/${wsId}/chats/conversations`, { method: 'GET' }),
  createConversation: (wsId, title) =>
    apiRequest(`/workspaces/${wsId}/chats/conversations`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
  sendMessage: (wsId, convId, text) =>
    apiRequest(`/workspaces/${wsId}/chats/conversations/${convId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
};

export const notificationAPI = {
  list: (wsId, query = '') => apiRequest(`/workspaces/${wsId}/notifications${query}`, { method: 'GET' }),
  unreadCount: (wsId) => apiRequest(`/workspaces/${wsId}/notifications/unread-count`, { method: 'GET' }),
  markRead: (wsId, ids) =>
    apiRequest(`/workspaces/${wsId}/notifications/read`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
};

export const importAPI = {
  uploadCsv: async (wsId, formData) => {
    const { accessToken } = getSessionTokens();
    if (accessToken === 'demo_access_token') {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, message: 'Mock CSV uploaded successfully in demo mode' };
    }
    const response = await fetch(`${API_ROOT}/workspaces/${wsId}/imports`, {
      method: 'POST',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || data.detail || 'Import failed');
      error.status = response.status;
      throw error;
    }
    return data;
  },
};
