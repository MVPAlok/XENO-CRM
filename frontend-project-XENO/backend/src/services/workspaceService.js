import { prisma } from '../config/prisma.js';
import { slugify } from '../utils/slugify.js';
import { ensureAutoSegments, matchCustomersForRules } from './segmentService.js';
import { createNotification } from './notificationService.js';
import { recalculateCustomerMetrics } from './customerMetricsService.js';

const uniqueSlug = async (name) => {
  const base = slugify(name) || 'workspace';
  let slug = base;
  let suffix = 1;

  while (await prisma.workspace.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  return slug;
};

export const serializeWorkspace = async (workspace, role = undefined) => {
  const [customers, orders] = await Promise.all([
    prisma.customer.count({ where: { workspaceId: workspace.id, deletedAt: null } }),
    prisma.order.count({ where: { workspaceId: workspace.id } }),
  ]);

  return {
    id: workspace.id,
    name: workspace.name,
    brandName: workspace.name,
    slug: workspace.slug,
    description: workspace.description,
    industry: workspace.industry || 'Retail',
    businessType: workspace.businessType || 'D2C',
    primaryChannel: workspace.primaryChannel || 'WhatsApp',
    monthlyCustomers: workspace.monthlyCustomers || '10,000',
    isArchived: workspace.isArchived,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
    role,
    stats: {
      customers: customers.toLocaleString('en-IN'),
      orders: orders.toLocaleString('en-IN'),
    },
  };
};

export const createWorkspaceForUser = async ({ userId, name, description, industry, businessType, primaryChannel, monthlyCustomers }) => {
  const slug = await uniqueSlug(name);
  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug,
      description,
      industry,
      businessType,
      primaryChannel,
      monthlyCustomers,
      memberships: {
        create: {
          userId,
          role: 'OWNER',
        },
      },
      simulatorControls: {
        create: {
          isPaused: false,
          speed: 4,
        },
      },
    },
  });

  await ensureAutoSegments(workspace.id, userId);

  // Seed the workspace with initial rich generated data to make the CRM fully working out-of-the-box
  await seedWorkspaceData(workspace.id, userId, primaryChannel);

  await createNotification({
    workspaceId: workspace.id,
    userId,
    type: 'SUCCESS',
    title: 'Workspace created',
    message: `Workspace "${name}" is ready.`,
  });

  return await serializeWorkspace(workspace, 'OWNER');
};

export const duplicateWorkspace = async ({ workspaceId, userId }) => {
  const source = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      segments: {
        include: { rules: true },
      },
    },
  });

  const slug = await uniqueSlug(`${source.name} Copy`);
  const clone = await prisma.workspace.create({
    data: {
      name: `${source.name} - Copy`,
      slug,
      description: source.description,
      industry: source.industry,
      businessType: source.businessType,
      primaryChannel: source.primaryChannel,
      monthlyCustomers: source.monthlyCustomers,
      memberships: {
        create: {
          userId,
          role: 'OWNER',
        },
      },
      simulatorControls: {
        create: {
          isPaused: true,
          speed: 4,
        },
      },
      segments: {
        create: source.segments.map((segment) => ({
          name: segment.name,
          description: segment.description,
          type: segment.type,
          createdBy: userId,
          rules: {
            create: segment.rules.map((rule) => ({
              field: rule.field,
              operator: rule.operator,
              value: rule.value,
            })),
          },
        })),
      },
    },
  });

  await createNotification({
    workspaceId: clone.id,
    userId,
    type: 'SUCCESS',
    title: 'Workspace duplicated',
    message: `Duplicate of "${source.name}".`,
  });

  return await serializeWorkspace(clone, 'OWNER');
};

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow'];
const firstNames = ['Aarav', 'Vihaan', 'Ananya', 'Diya', 'Saisha', 'Aditya', 'Rohan', 'Neha', 'Rahul', 'Kabir', 'Riya', 'Karan'];
const lastNames = ['Sharma', 'Verma', 'Gupta', 'Patel', 'Reddy', 'Nair', 'Mehra', 'Singh', 'Kumar', 'Joshi', 'Shah', 'Pillai'];
const channels = ['WhatsApp', 'Email', 'SMS', 'RCS'];
const categories = ['Apparel', 'Beauty', 'Electronics', 'Coupon Promo', 'Home', 'Loyalty Discount'];

const randomItem = (items, index) => items[index % items.length];
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

export const seedWorkspaceData = async (workspaceId, userId, primaryChannel = 'WhatsApp') => {
  for (let index = 0; index < 120; index += 1) {
    const firstName = randomItem(firstNames, index);
    const lastName = randomItem(lastNames, index + 3);
    const city = randomItem(cities, index + 5);
    const preferredChannel = index % 3 === 0 ? primaryChannel : randomItem(channels, index);
    
    const customer = await prisma.customer.create({
      data: {
        workspaceId,
        externalId: `CUST-${1000 + index}`,
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@example.com`,
        phone: `+91${7000000000 + index}`,
        city,
        preferredChannel,
      },
    });

    const orderCount = (index % 12) + 1;
    for (let orderIndex = 0; orderIndex < orderCount; orderIndex += 1) {
      const amount = 550 + ((index * 257 + orderIndex * 199) % 3600);
      const age = (index * 7 + orderIndex * 13) % 150;
      const category = randomItem(categories, index + orderIndex);
      await prisma.order.create({
        data: {
          workspaceId,
          customerId: customer.id,
          externalOrderId: `ORD-${index}-${orderIndex}-${Math.random().toString(36).substring(2, 7)}`,
          amount,
          purchaseDate: daysAgo(age),
          category,
          discountUsage: category.toLowerCase().includes('coupon') || category.toLowerCase().includes('discount'),
        },
      });
    }

    await recalculateCustomerMetrics(workspaceId, customer.id);
  }

  await ensureAutoSegments(workspaceId, userId);
  const segments = await prisma.segment.findMany({
    where: { workspaceId },
    include: { rules: true },
  });

  const campaignSpecs = [
    ['Summer Splash VIP Clearance', 'VIP Customers', 'WhatsApp', 'RUNNING', 'VIPSECRET'],
    ['90-Day Win-Back Promo', 'Inactive Customers', 'Email', 'COMPLETED', 'WELCOME20'],
    ['Festival Bonanza Launch', 'Frequent Shoppers', 'SMS', 'COMPLETED', 'FESTIVE15'],
    ['Weekend Surprise Coupon', 'Coupon Sensitive Customers', 'RCS', 'SCHEDULED', 'COUPON10'],
    ['New Arrivals Re-Engagement', 'Recent Buyers', 'WhatsApp', 'DRAFT', 'NEWNOW'],
  ];

  for (const [name, segmentName, channel, status, code] of campaignSpecs) {
    const segment = segments.find((item) => item.name === segmentName);
    if (!segment) continue;

    const campaign = await prisma.campaign.create({
      data: {
        workspaceId,
        createdBy: userId,
        segmentId: segment.id,
        name,
        channel,
        status,
        launchedAt: status === 'RUNNING' || status === 'COMPLETED' ? daysAgo(7) : null,
        completedAt: status === 'COMPLETED' ? daysAgo(2) : null,
        messageSubject: name,
        messageBody: `Hi {{firstName}}, use ${code} for a personalized Xeno offer this week.`,
      },
    });

    if (status !== 'DRAFT' && status !== 'SCHEDULED') {
      const customers = await matchCustomersForRules(workspaceId, segment.rules);
      for (const customer of customers.slice(0, 45)) {
        const roll = customer.totalOrders % 5;
        const deliveryStatus = roll === 0 ? 'CONVERTED' : roll === 1 ? 'CLICKED' : roll === 2 ? 'READ' : 'DELIVERED';
        const delivery = await prisma.campaignDelivery.create({
          data: {
            workspaceId,
            campaignId: campaign.id,
            customerId: customer.id,
            status: deliveryStatus,
            deliveredAt: daysAgo(6),
            readAt: ['READ', 'CLICKED', 'CONVERTED'].includes(deliveryStatus) ? daysAgo(5) : null,
            clickedAt: ['CLICKED', 'CONVERTED'].includes(deliveryStatus) ? daysAgo(4) : null,
            convertedAt: deliveryStatus === 'CONVERTED' ? daysAgo(3) : null,
            messageSubject: name,
            messageBody: `Hi ${customer.firstName}, use ${code} for a personalized Xeno offer this week.`,
          },
        });

        if (deliveryStatus === 'CONVERTED') {
          await prisma.order.create({
            data: {
              workspaceId,
              customerId: customer.id,
              campaignId: campaign.id,
              deliveryId: delivery.id,
              amount: 1200 + (customer.totalOrders % 8) * 275,
              purchaseDate: daysAgo(3),
              category: 'Campaign Conversion',
              source: 'SEED',
            },
          });
          await recalculateCustomerMetrics(workspaceId, customer.id);
        }
      }
    }
  }

  await prisma.insight.createMany({
    data: [
      {
        workspaceId,
        title: 'AI found opportunity',
        description: 'Inactive Customers show high recoverable revenue if routed to WhatsApp with a limited-time discount.',
        category: 'SEGMENT',
        evidence: '90+ day inactive customers have strong prior CLV and recoverable purchase intent.',
        actionText: 'Draft Win-Back Campaign',
        suggestedPrompt: 'Bring back inactive customers with a WhatsApp coupon.',
      },
      {
        workspaceId,
        title: 'VIP upsell window',
        description: 'VIP Customers have high order frequency and respond strongly to early access copy.',
        category: 'CAMPAIGN',
        evidence: 'VIP customers exceed ₹25,000 spend and drive high repeat purchase rates.',
        actionText: 'Launch VIP Campaign',
        suggestedPrompt: 'Create a VIP early-access sale campaign.',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.simulatorLog.createMany({
    data: [
      {
        workspaceId,
        type: 'Campaign Sent',
        channel: 'WhatsApp',
        message: 'Campaign "Summer Splash VIP Clearance" launched for VIP Customers.',
      },
      {
        workspaceId,
        type: 'Converted',
        channel: 'WhatsApp',
        message: 'Rahul Sharma converted! Order confirmed: ₹1,950 generated via WhatsApp.',
        metadata: { customerName: 'Rahul Sharma' },
      },
    ],
    skipDuplicates: true,
  });
};
