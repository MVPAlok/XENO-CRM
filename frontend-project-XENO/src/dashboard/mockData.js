// Centralized Realistic Mock Data Generator for Xeno AI Campaign Manager
// Simulates 25,000+ scale by providing detailed mock sets, summaries, and analytical aggregates.

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow'];
const CHANNELS = ['WhatsApp', 'Email', 'SMS', 'RCS'];
const FIRST_NAMES = ['Aarav', 'Vihaan', 'Vivaan', 'Ananya', 'Diya', 'Saisha', 'Aditya', 'Rohan', 'Neha', 'Pooja', 'Rahul', 'Arjun', 'Kabir', 'Riya', 'Karan', 'Siddharth', 'Ishaan', 'Aanya', 'Kiara', 'Dev'];
const LAST_NAMES = ['Sharma', 'Verma', 'Gupta', 'Patel', 'Reddy', 'Rao', 'Nair', 'Mehra', 'Singh', 'Kumar', 'Joshi', 'Choudhury', 'Iyer', 'Sinha', 'Banerjee', 'Shah', 'Kapoor', 'Deshmukh', 'Pillai', 'Rani'];

// Helper to get random item
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
// Helper to get random number in range
const randomRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate 200 detailed customers
export const generateCustomers = () => {
  const list = [];
  const now = new Date();
  
  for (let i = 1; i <= 200; i++) {
    const firstName = randomItem(FIRST_NAMES);
    const lastName = randomItem(LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomRange(10, 99)}@gmail.com`;
    const phone = `+91 ${randomRange(70000, 99999)} ${randomRange(10000, 99999)}`;
    const city = randomItem(CITIES);
    const totalOrders = randomRange(1, 45);
    const totalSpend = totalOrders * randomRange(450, 2200);
    const clv = Math.floor(totalSpend * 1.3);
    const preferredChannel = randomItem(CHANNELS);
    
    // Last purchase date within last 180 days
    const lastPurchaseDaysAgo = randomRange(2, 180);
    const lastPurchaseDate = new Date();
    lastPurchaseDate.setDate(now.getDate() - lastPurchaseDaysAgo);
    
    // Status based on last purchase
    let status = 'ACTIVE';
    if (lastPurchaseDaysAgo > 90) {
      status = 'INACTIVE';
    } else if (totalSpend > 25000) {
      status = 'VIP';
    } else if (lastPurchaseDaysAgo > 60) {
      status = 'AT_RISK';
    }

    // Generate simulated timeline communication events
    const timeline = [];
    const eventCount = randomRange(3, 8);
    for (let e = 0; e < eventCount; e++) {
      const eventDate = new Date(lastPurchaseDate);
      eventDate.setDate(eventDate.getDate() - randomRange(1, 30));
      const channel = randomItem(CHANNELS);
      const isConverted = Math.random() > 0.7;
      const isClicked = isConverted || Math.random() > 0.5;
      const isRead = isClicked || Math.random() > 0.2;
      
      const events = [
        { type: 'Message Sent', timestamp: new Date(eventDate.getTime()).toISOString(), status: 'completed' },
        { type: 'Delivered', timestamp: new Date(eventDate.getTime() + 2000).toISOString(), status: 'completed' }
      ];

      if (isRead) {
        events.push({ type: 'Opened/Read', timestamp: new Date(eventDate.getTime() + 60000 * randomRange(2, 120)).toISOString(), status: 'completed' });
      }
      if (isClicked) {
        events.push({ type: 'Clicked Link', timestamp: new Date(eventDate.getTime() + 60000 * randomRange(5, 240)).toISOString(), status: 'completed' });
      }
      if (isConverted) {
        events.push({ type: 'Converted Order', timestamp: new Date(eventDate.getTime() + 60000 * randomRange(10, 360)).toISOString(), status: 'completed', value: `₹${randomRange(500, 3000)}` });
      }
      
      timeline.push({
        id: `event-${i}-${e}`,
        campaignName: `${randomItem(['Summer Splash', 'Weekend Bonanza', 'Cart Abandonment', 'Festive Offer', 'VIP Exclusive'])} ${channel}`,
        channel,
        events: events.reverse() // latest event first
      });
    }

    list.push({
      id: `CUST-${1000 + i}`,
      name,
      email,
      phone,
      city,
      totalOrders,
      totalSpend,
      clv,
      lastPurchaseDate: lastPurchaseDate.toISOString().split('T')[0],
      preferredChannel,
      status,
      timeline
    });
  }
  return list;
};

// Global KPIs & Meta Statistics
export const dashboardKPIs = {
  totalCustomers: { value: '25,432', change: '+12.5%', isPositive: true, label: 'Total Customers' },
  totalRevenue: { value: '₹12,45,000', change: '+18.2%', isPositive: true, label: 'Total Revenue' },
  activeCampaigns: { value: '8', change: '+2', isPositive: true, label: 'Active Campaigns' },
  conversionRate: { value: '12.4%', change: '+1.4%', isPositive: true, label: 'Conversion Rate' },
  customerLifetimeValue: { value: '₹8,450', change: '+5.7%', isPositive: true, label: 'Avg Customer CLV' },
  campaignRevenue: { value: '₹3,40,000', change: '+22.4%', isPositive: true, label: 'Campaign Attributed Rev' },
};

// Default Segments list
export const mockSegments = [
  {
    id: 'seg-1',
    name: 'Inactive Customers',
    description: 'Customers who have not purchased in over 90 days.',
    count: 324,
    revenuePotential: 120000,
    expectedConversion: '15.4%',
    confidenceScore: 94,
    color: '#F59E0B'
  },
  {
    id: 'seg-2',
    name: 'VIP Customers',
    description: 'Customers who spent more than ₹10,000 during the last month.',
    count: 150,
    revenuePotential: 75000,
    expectedConversion: '28.6%',
    confidenceScore: 98,
    color: '#8B5CF6'
  },
  {
    id: 'seg-3',
    name: 'Recent Buyers',
    description: 'Purchased within the last 14 days. Highly engaged.',
    count: 540,
    revenuePotential: 210000,
    expectedConversion: '22.1%',
    confidenceScore: 89,
    color: '#10B981'
  },
  {
    id: 'seg-4',
    name: 'Frequent Shoppers',
    description: 'Ordered more than 8 times in their lifecycle.',
    count: 420,
    revenuePotential: 185000,
    expectedConversion: '31.2%',
    confidenceScore: 95,
    color: '#3B82F6'
  },
  {
    id: 'seg-5',
    name: 'Coupon Sensitive Customers',
    description: 'Only purchase when promotional coupons are active.',
    count: 680,
    revenuePotential: 140000,
    expectedConversion: '18.9%',
    confidenceScore: 87,
    color: '#EC4899'
  },
  {
    id: 'seg-6',
    name: 'At Risk Customers',
    description: 'High-value cohorts with decreasing purchase frequency.',
    count: 185,
    revenuePotential: 95000,
    expectedConversion: '12.8%',
    confidenceScore: 82,
    color: '#EF4444'
  }
];

// Campaigns list
export const initialCampaigns = [
  {
    id: 'CAMP-001',
    name: 'Summer Splash VIP Clearance',
    segment: 'VIP Customers',
    channel: 'WhatsApp',
    status: 'Running',
    createdBy: 'Sarah Jenkins',
    createdDate: '2026-06-05',
    metrics: { sent: 150, delivered: 148, read: 132, clicked: 85, converted: 42, revenue: 84000 }
  },
  {
    id: 'CAMP-002',
    name: '90-Day Win-Back Promo',
    segment: 'Inactive Customers',
    channel: 'Email',
    status: 'Completed',
    createdBy: 'Sarah Jenkins',
    createdDate: '2026-05-12',
    metrics: { sent: 324, delivered: 310, read: 145, clicked: 52, converted: 18, revenue: 54000 }
  },
  {
    id: 'CAMP-003',
    name: 'Festival Bonanza Launch',
    segment: 'Frequent Shoppers',
    channel: 'SMS',
    status: 'Completed',
    createdBy: 'Dev User',
    createdDate: '2026-05-28',
    metrics: { sent: 420, delivered: 418, read: 380, clicked: 92, converted: 35, revenue: 72000 }
  },
  {
    id: 'CAMP-004',
    name: 'Weekend Surprise Coupon',
    segment: 'Coupon Sensitive Customers',
    channel: 'RCS',
    status: 'Scheduled',
    createdBy: 'Dev User',
    createdDate: '2026-06-09',
    metrics: { sent: 0, delivered: 0, read: 0, clicked: 0, converted: 0, revenue: 0 }
  },
  {
    id: 'CAMP-005',
    name: 'New Arrivals Re-Engagement',
    segment: 'Recent Buyers',
    channel: 'WhatsApp',
    status: 'Draft',
    createdBy: 'Sarah Jenkins',
    createdDate: '2026-06-10',
    metrics: { sent: 0, delivered: 0, read: 0, clicked: 0, converted: 0, revenue: 0 }
  },
  {
    id: 'CAMP-006',
    name: 'Churn Prevention Campaign',
    segment: 'At Risk Customers',
    channel: 'Email',
    status: 'Failed',
    createdBy: 'Sarah Jenkins',
    createdDate: '2026-05-01',
    metrics: { sent: 185, delivered: 180, read: 40, clicked: 5, converted: 0, revenue: 0 }
  }
];

// Recharts analytical assets
export const funnelData = [
  { name: 'Sent', value: 1000, percentage: '100%' },
  { name: 'Delivered', value: 960, percentage: '96%' },
  { name: 'Opened/Read', value: 720, percentage: '72%' },
  { name: 'Clicked', value: 360, percentage: '36%' },
  { name: 'Converted', value: 124, percentage: '12.4%' }
];

export const revenueAttributionData = [
  { name: 'Summer Splash VIP', revenue: 84000, roi: '4.2x', conversions: 42 },
  { name: '90-Day Win-Back', revenue: 54000, roi: '3.1x', conversions: 18 },
  { name: 'Festival Bonanza', revenue: 72000, roi: '5.6x', conversions: 35 },
  { name: 'Weekend Coupon', revenue: 65000, roi: '3.8x', conversions: 29 },
  { name: 'At Risk Engagement', revenue: 25000, roi: '2.2x', conversions: 11 },
];

export const channelPerformanceData = [
  { channel: 'WhatsApp', deliveryRate: 98, readRate: 85, clickRate: 48, conversionRate: 15.6, revenue: 165000 },
  { channel: 'Email', deliveryRate: 95, readRate: 22, clickRate: 4.5, conversionRate: 1.8, revenue: 45000 },
  { channel: 'SMS', deliveryRate: 99, readRate: 90, clickRate: 8.2, conversionRate: 3.5, revenue: 80000 },
  { channel: 'RCS', deliveryRate: 97, readRate: 65, clickRate: 18.5, conversionRate: 6.2, revenue: 50000 },
];

export const trendPerformanceData = [
  { date: 'May 1', campaigns: 1, revenue: 15000, conversions: 12, growth: 25100 },
  { date: 'May 7', campaigns: 2, revenue: 32000, conversions: 24, growth: 25150 },
  { date: 'May 14', campaigns: 2, revenue: 48000, conversions: 38, growth: 25200 },
  { date: 'May 21', campaigns: 3, revenue: 75000, conversions: 55, growth: 25280 },
  { date: 'May 28', campaigns: 4, revenue: 112000, conversions: 89, growth: 25350 },
  { date: 'June 4', campaigns: 5, revenue: 185000, conversions: 142, growth: 25400 },
  { date: 'June 10', campaigns: 8, revenue: 340000, conversions: 260, growth: 25432 },
];
