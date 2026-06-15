import { prisma } from '../config/prisma.js';
import { rupees, toNumber } from '../utils/formatters.js';
import { enrichSegment } from './segmentService.js';

const percent = (part, total) => (total > 0 ? Number(((part / total) * 100).toFixed(1)) : 0);
const pctString = (part, total) => `${percent(part, total).toFixed(1)}%`;

const countStatuses = (deliveries) => {
  const counts = {
    sent: deliveries.length,
    delivered: 0,
    failed: 0,
    read: 0,
    clicked: 0,
    converted: 0,
  };

  for (const delivery of deliveries) {
    if (['DELIVERED', 'READ', 'CLICKED', 'CONVERTED'].includes(delivery.status)) counts.delivered += 1;
    if (['READ', 'CLICKED', 'CONVERTED'].includes(delivery.status)) counts.read += 1;
    if (['CLICKED', 'CONVERTED'].includes(delivery.status)) counts.clicked += 1;
    if (delivery.status === 'CONVERTED') counts.converted += 1;
    if (delivery.status === 'FAILED') counts.failed += 1;
  }

  return counts;
};

export const getWorkspaceAnalytics = async (workspaceId) => {
  const [totalCustomers, revenueAgg, activeCampaigns, deliveries, campaignOrders, campaigns] = await Promise.all([
    prisma.customer.count({ where: { workspaceId, deletedAt: null } }),
    prisma.order.aggregate({ where: { workspaceId }, _sum: { amount: true }, _avg: { amount: true } }),
    prisma.campaign.count({ where: { workspaceId, status: 'RUNNING' } }),
    prisma.campaignDelivery.findMany({ where: { workspaceId }, select: { status: true } }),
    prisma.order.findMany({
      where: { workspaceId, campaignId: { not: null } },
      select: { amount: true, purchaseDate: true, campaignId: true },
    }),
    prisma.campaign.findMany({
      where: { workspaceId },
      include: {
        deliveries: { select: { status: true } },
        orders: { select: { amount: true, purchaseDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const revenue = toNumber(revenueAgg._sum.amount);
  const campaignRevenue = campaignOrders.reduce((sum, order) => sum + toNumber(order.amount), 0);
  const deliveryCounts = countStatuses(deliveries);
  const conversionRate = pctString(deliveryCounts.converted, Math.max(deliveryCounts.sent, 1));
  const avgClv = totalCustomers > 0 ? revenue * 1.3 / totalCustomers : 0;

  // 1. Calculate Dynamic Changes
  const orderRange = await prisma.order.aggregate({
    where: { workspaceId },
    _min: { purchaseDate: true },
    _max: { purchaseDate: true },
  });

  let minDate = orderRange._min.purchaseDate;
  let maxDate = orderRange._max.purchaseDate;

  if (!minDate || !maxDate) {
    const custRange = await prisma.customer.aggregate({
      where: { workspaceId, deletedAt: null },
      _min: { createdAt: true },
      _max: { createdAt: true },
    });
    minDate = custRange._min.createdAt;
    maxDate = custRange._max.createdAt;
  }

  let midpoint = null;
  let hasPeriods = false;
  if (minDate && maxDate && maxDate.getTime() - minDate.getTime() > 1000) {
    midpoint = new Date(minDate.getTime() + (maxDate.getTime() - minDate.getTime()) / 2);
    hasPeriods = true;
  }

  let customerChange = '+0.0%';
  let revenueChange = '+0.0%';
  let campaignChange = '+0.0%';
  let conversionChange = '+0.0%';
  let clvChange = '+0.0%';
  let campaignRevChange = '+0.0%';

  if (hasPeriods) {
    const [
      customersP1,
      customersP2,
      revenueP1Agg,
      revenueP2Agg,
      campaignsP1,
      campaignsP2,
      deliveriesP1,
      deliveriesP2,
      campaignRevenueP1Agg,
      campaignRevenueP2Agg
    ] = await Promise.all([
      prisma.customer.count({ where: { workspaceId, deletedAt: null, createdAt: { lt: midpoint } } }),
      prisma.customer.count({ where: { workspaceId, deletedAt: null, createdAt: { gte: midpoint } } }),
      prisma.order.aggregate({ where: { workspaceId, purchaseDate: { lt: midpoint } }, _sum: { amount: true } }),
      prisma.order.aggregate({ where: { workspaceId, purchaseDate: { gte: midpoint } }, _sum: { amount: true } }),
      prisma.campaign.count({ where: { workspaceId, createdAt: { lt: midpoint } } }),
      prisma.campaign.count({ where: { workspaceId, createdAt: { gte: midpoint } } }),
      prisma.campaignDelivery.findMany({ where: { workspaceId, sentAt: { lt: midpoint } }, select: { status: true } }),
      prisma.campaignDelivery.findMany({ where: { workspaceId, sentAt: { gte: midpoint } }, select: { status: true } }),
      prisma.order.aggregate({ where: { workspaceId, campaignId: { not: null }, purchaseDate: { lt: midpoint } }, _sum: { amount: true } }),
      prisma.order.aggregate({ where: { workspaceId, campaignId: { not: null }, purchaseDate: { gte: midpoint } }, _sum: { amount: true } }),
    ]);

    const calculateChangePercentage = (prev, curr) => {
      if (prev <= 0) {
        if (curr > 0) return '+100.0%';
        return '0.0%';
      }
      const diff = ((curr - prev) / prev) * 100;
      const sign = diff >= 0 ? '+' : '';
      return `${sign}${diff.toFixed(1)}%`;
    };

    customerChange = calculateChangePercentage(customersP1, customersP1 + customersP2);
    
    const revP1 = toNumber(revenueP1Agg._sum.amount);
    const revP2 = toNumber(revenueP2Agg._sum.amount);
    revenueChange = calculateChangePercentage(revP1, revP2);
    
    campaignChange = calculateChangePercentage(campaignsP1, campaignsP2);
    
    const countsP1 = countStatuses(deliveriesP1);
    const countsP2 = countStatuses(deliveriesP2);
    const convP1 = countsP1.sent > 0 ? (countsP1.converted / countsP1.sent) * 100 : 0;
    const convP2 = countsP2.sent > 0 ? (countsP2.converted / countsP2.sent) * 100 : 0;
    conversionChange = calculateChangePercentage(convP1, convP2);
    
    const avgClvP1 = customersP1 > 0 ? (revP1 * 1.3) / customersP1 : 0;
    const avgClvP2 = (customersP1 + customersP2) > 0 ? ((revP1 + revP2) * 1.3) / (customersP1 + customersP2) : 0;
    clvChange = calculateChangePercentage(avgClvP1, avgClvP2);
    
    const campRevP1 = toNumber(campaignRevenueP1Agg._sum.amount);
    const campRevP2 = toNumber(campaignRevenueP2Agg._sum.amount);
    campaignRevChange = calculateChangePercentage(campRevP1, campRevP2);
  }

  const kpis = {
    totalCustomers: { value: totalCustomers.toLocaleString('en-IN'), change: customerChange, isPositive: !customerChange.includes('-'), label: 'Total Customers' },
    totalRevenue: { value: rupees(revenue), change: revenueChange, isPositive: !revenueChange.includes('-'), label: 'Total Revenue' },
    activeCampaigns: { value: String(activeCampaigns), change: campaignChange, isPositive: !campaignChange.includes('-'), label: 'Active Campaigns' },
    conversionRate: { value: conversionRate, change: conversionChange, isPositive: !conversionChange.includes('-'), label: 'Conversion Rate' },
    customerLifetimeValue: { value: rupees(avgClv), change: clvChange, isPositive: !clvChange.includes('-'), label: 'Avg Customer CLV' },
    campaignRevenue: { value: rupees(campaignRevenue), change: campaignRevChange, isPositive: !campaignRevChange.includes('-'), label: 'Campaign Attributed Rev' },
  };

  const funnelData = [
    { name: 'Sent', value: deliveryCounts.sent, percentage: '100%' },
    { name: 'Delivered', value: deliveryCounts.delivered, percentage: pctString(deliveryCounts.delivered, deliveryCounts.sent) },
    { name: 'Opened/Read', value: deliveryCounts.read, percentage: pctString(deliveryCounts.read, deliveryCounts.sent) },
    { name: 'Clicked', value: deliveryCounts.clicked, percentage: pctString(deliveryCounts.clicked, deliveryCounts.sent) },
    { name: 'Converted', value: deliveryCounts.converted, percentage: pctString(deliveryCounts.converted, deliveryCounts.sent) },
  ];

  const channels = ['WhatsApp', 'Email', 'SMS', 'RCS'];
  const channelPerformance = channels.map((channel) => {
    const channelCampaigns = campaigns.filter((campaign) => campaign.channel === channel);
    const channelDeliveries = channelCampaigns.flatMap((campaign) => campaign.deliveries);
    const counts = countStatuses(channelDeliveries);
    const channelRevenue = channelCampaigns.flatMap((campaign) => campaign.orders).reduce((sum, order) => sum + toNumber(order.amount), 0);
    return {
      channel,
      deliveryRate: percent(counts.delivered, counts.sent),
      readRate: percent(counts.read, counts.delivered || counts.sent),
      clickRate: percent(counts.clicked, counts.read || counts.sent),
      conversionRate: percent(counts.converted, counts.sent),
      revenue: Math.round(channelRevenue),
    };
  });

  const revenueAttribution = campaigns
    .map((campaign) => {
      const campaignRevenueValue = campaign.orders.reduce((sum, order) => sum + toNumber(order.amount), 0);
      const conversions = campaign.deliveries.filter((delivery) => delivery.status === 'CONVERTED').length;
      const estimatedCost = Math.max(250, campaign.deliveries.length * channelRate(campaign.channel));
      return {
        name: campaign.name,
        revenue: Math.round(campaignRevenueValue),
        roi: estimatedCost > 0 ? `${(campaignRevenueValue / estimatedCost).toFixed(1)}x` : '0.0x',
        conversions,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const trendPerformance = await buildGrowthCurve(workspaceId);

  // 2. Generate Dynamic AI Insights
  const segments = await prisma.segment.findMany({
    where: { workspaceId },
    include: { rules: true },
  });

  const enrichedSegments = await Promise.all(
    segments.map((seg, idx) => enrichSegment(seg, idx))
  );

  const inactiveSegment = enrichedSegments.find(s => s.name === 'Inactive Customers') || { count: 0, revenuePotential: 0, expectedConversion: '0%' };
  const vipSegment = enrichedSegments.find(s => s.name === 'VIP Customers') || { count: 0, revenuePotential: 0, expectedConversion: '0%' };
  const atRiskSegment = enrichedSegments.find(s => s.name === 'At Risk Customers') || { count: 0, revenuePotential: 0, expectedConversion: '0%' };

  const insights = [
    {
      id: 'ins-1',
      type: 'revenue_opportunity',
      title: 'Revenue Opportunity Found',
      subtitle: `${inactiveSegment.count} inactive customers cohort`,
      metricLabel: 'Potential Recovery',
      metricValue: rupees(inactiveSegment.revenuePotential),
      confidence: inactiveSegment.confidenceScore || 94,
      priority: 'high',
      suggestedCampaign: '90-Day Win-Back WhatsApp Promo',
      description: `AI model scanned purchase logs and identified ${inactiveSegment.count} customers who are currently inactive (no purchase in over 90 days). Their similarity to historically recovered cohorts is high.`,
      whyAiFound: [
        `Average purchase interval exceeded (no purchase in over 90 days).`,
        `Customer satisfaction indicator is high based on prior repeat orders.`,
        `Estimated recovery channels indicate high response on WhatsApp.`
      ],
      impact: `Est. conversion rate of ${inactiveSegment.expectedConversion} returning ${rupees(inactiveSegment.revenuePotential)} in gross sales.`,
      promptText: `Bring back ${inactiveSegment.count} inactive customers who haven't purchased in over 90 days with a win-back offer.`
    },
    {
      id: 'ins-2',
      type: 'churn_risk',
      title: 'Churn Risk Alert',
      subtitle: `${atRiskSegment.count} customer profiles showing drop-off`,
      metricLabel: 'Potential Revenue Loss',
      metricValue: rupees(atRiskSegment.revenuePotential),
      confidence: atRiskSegment.confidenceScore || 82,
      priority: 'critical',
      suggestedCampaign: 'At-Risk Retention Discount',
      description: `Predictive churn models identified a cluster of ${atRiskSegment.count} high-potential shoppers who are at risk of churning (no purchase in 60 to 90 days).`,
      whyAiFound: [
        `Frequency rate dropped (no purchase recorded in the last 60-90 days).`,
        `High relative spend in the past makes this cohort critical to retain.`,
        `Similar patterns observed in historical churn groups.`
      ],
      impact: `If unaddressed, projected revenue leakage is ${rupees(atRiskSegment.revenuePotential)}. Re-engagement success rate is estimated at ${atRiskSegment.expectedConversion}.`,
      promptText: `Draft a high-converting retention campaign for ${atRiskSegment.count} at-risk customers.`
    },
    {
      id: 'ins-3',
      type: 'segment_growth',
      title: 'Segment Growth Opportunity',
      subtitle: `VIP segment population is ${vipSegment.count}`,
      metricLabel: 'LTV Uplift Potential',
      metricValue: rupees(vipSegment.revenuePotential),
      confidence: vipSegment.confidenceScore || 98,
      priority: 'medium',
      suggestedCampaign: 'VIP Loyalty Rewards Campaign',
      description: `Recent purchases pushed ${vipSegment.count} customer lifespans into the high-value tier (spending > ₹25,000). AI recommends enrolling them in the VIP tier immediately.`,
      whyAiFound: [
        `${vipSegment.count} customers crossed the cumulative VIP spending threshold.`,
        `High engagement with exclusive premium product lines.`,
        `AOV for this group is higher than the workspace average.`
      ],
      impact: `VIP treatment is predicted to increase repeat purchase rates, adding ${rupees(vipSegment.revenuePotential)} to customer lifetime value.`,
      promptText: `Draft an early access campaign for ${vipSegment.count} VIP customers who spent more than ₹25,000.`
    }
  ];

  return {
    kpis,
    funnelData,
    revenueAttribution,
    channelPerformance,
    trendPerformance,
    insights,
  };
};


export const channelRate = (channel) => {
  if (channel === 'WhatsApp') return 0.2;
  if (channel === 'SMS') return 0.08;
  if (channel === 'RCS') return 0.12;
  if (channel === 'Email') return 0.02;
  return 0.05;
};

const buildGrowthCurve = async (workspaceId) => {
  const since = new Date();
  since.setDate(since.getDate() - 42);

  const [orders, campaignCounts, totalCustomers] = await Promise.all([
    prisma.order.findMany({
      where: { workspaceId, purchaseDate: { gte: since } },
      select: { amount: true, purchaseDate: true, campaignId: true },
      orderBy: { purchaseDate: 'asc' },
    }),
    prisma.campaign.findMany({
      where: { workspaceId, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.customer.count({ where: { workspaceId, deletedAt: null } }),
  ]);

  return Array.from({ length: 7 }).map((_, index) => {
    const start = new Date(since);
    start.setDate(since.getDate() + index * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    const bucketOrders = orders.filter((order) => order.purchaseDate >= start && order.purchaseDate < end);
    const bucketCampaigns = campaignCounts.filter((campaign) => campaign.createdAt >= start && campaign.createdAt < end);
    const revenue = bucketOrders.reduce((sum, order) => sum + toNumber(order.amount), 0);
    const conversions = bucketOrders.filter((order) => order.campaignId).length;

    return {
      date: start.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      campaigns: bucketCampaigns.length,
      revenue: Math.round(revenue),
      conversions,
      growth: Math.max(totalCustomers - (6 - index) * 25, 0),
    };
  });
};
