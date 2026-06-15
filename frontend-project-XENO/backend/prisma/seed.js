import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';
import { ensureAutoSegments, matchCustomersForRules } from '../src/services/segmentService.js';
import { recalculateCustomerMetrics } from '../src/services/customerMetricsService.js';

const prisma = new PrismaClient();

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow'];
const firstNames = ['Aarav', 'Vihaan', 'Ananya', 'Diya', 'Saisha', 'Aditya', 'Rohan', 'Neha', 'Rahul', 'Kabir', 'Riya', 'Karan'];
const lastNames = ['Sharma', 'Verma', 'Gupta', 'Patel', 'Reddy', 'Nair', 'Mehra', 'Singh', 'Kumar', 'Joshi', 'Shah', 'Pillai'];
const channels = ['WhatsApp', 'Email', 'SMS', 'RCS'];
const categories = ['Apparel', 'Beauty', 'Electronics', 'Coupon Promo', 'Home', 'Loyalty Discount'];

const randomItem = (items, index) => items[index % items.length];
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const main = async () => {
  const passwordHash = await hashPassword('XenoDemo123!');

  const user = await prisma.user.upsert({
    where: { email: 'demo@xeno.ai' },
    update: {},
    create: {
      email: 'demo@xeno.ai',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Sarah%20Jenkins',
      isEmailVerified: true,
      role: 'ADMIN',
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'apex-cosmetics' },
    update: {},
    create: {
      name: 'Apex Cosmetics',
      slug: 'apex-cosmetics',
      description: 'Demo D2C retail workspace for Xeno AI Campaign Console.',
      industry: 'Retail',
      businessType: 'D2C',
      primaryChannel: 'WhatsApp',
      monthlyCustomers: '25,000',
      memberships: {
        create: {
          userId: user.id,
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

  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
    update: { role: 'OWNER' },
    create: { userId: user.id, workspaceId: workspace.id, role: 'OWNER' },
  });

  const existingCustomers = await prisma.customer.count({ where: { workspaceId: workspace.id } });
  if (existingCustomers === 0) {
    for (let index = 0; index < 120; index += 1) {
      const firstName = randomItem(firstNames, index);
      const lastName = randomItem(lastNames, index + 3);
      const city = randomItem(cities, index + 5);
      const preferredChannel = randomItem(channels, index);
      const customer = await prisma.customer.create({
        data: {
          workspaceId: workspace.id,
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
            workspaceId: workspace.id,
            customerId: customer.id,
            externalOrderId: `ORD-${index}-${orderIndex}`,
            amount,
            purchaseDate: daysAgo(age),
            category,
            discountUsage: category.toLowerCase().includes('coupon') || category.toLowerCase().includes('discount'),
          },
        });
      }

      await recalculateCustomerMetrics(workspace.id, customer.id);
    }
  }

  await ensureAutoSegments(workspace.id, user.id);
  const segments = await prisma.segment.findMany({
    where: { workspaceId: workspace.id },
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

    const campaign = await prisma.campaign.upsert({
      where: {
        id:
          (await prisma.campaign.findFirst({ where: { workspaceId: workspace.id, name }, select: { id: true } }))?.id ||
          '00000000-0000-0000-0000-000000000000',
      },
      update: {},
      create: {
        workspaceId: workspace.id,
        createdBy: user.id,
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
      const customers = await matchCustomersForRules(workspace.id, segment.rules);
      for (const customer of customers.slice(0, 45)) {
        const roll = customer.totalOrders % 5;
        const deliveryStatus = roll === 0 ? 'CONVERTED' : roll === 1 ? 'CLICKED' : roll === 2 ? 'READ' : 'DELIVERED';
        const delivery = await prisma.campaignDelivery.upsert({
          where: { campaignId_customerId: { campaignId: campaign.id, customerId: customer.id } },
          update: {},
          create: {
            workspaceId: workspace.id,
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
          const exists = await prisma.order.findUnique({ where: { deliveryId: delivery.id } });
          if (!exists) {
            await prisma.order.create({
              data: {
                workspaceId: workspace.id,
                customerId: customer.id,
                campaignId: campaign.id,
                deliveryId: delivery.id,
                amount: 1200 + (customer.totalOrders % 8) * 275,
                purchaseDate: daysAgo(3),
                category: 'Campaign Conversion',
                source: 'SEED',
              },
            });
            await recalculateCustomerMetrics(workspace.id, customer.id);
          }
        }
      }
    }
  }

  await prisma.insight.createMany({
    data: [
      {
        workspaceId: workspace.id,
        title: 'AI found opportunity',
        description: 'Inactive Customers show high recoverable revenue if routed to WhatsApp with a limited-time discount.',
        category: 'SEGMENT',
        evidence: '90+ day inactive customers have strong prior CLV and recoverable purchase intent.',
        actionText: 'Draft Win-Back Campaign',
        suggestedPrompt: 'Bring back inactive customers with a WhatsApp coupon.',
      },
      {
        workspaceId: workspace.id,
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

  await prisma.notification.createMany({
    data: [
      {
        workspaceId: workspace.id,
        userId: user.id,
        type: 'SUCCESS',
        title: 'Seed data ready',
        message: 'Demo workspace seeded with customers, orders, campaigns, segments, and analytics.',
      },
      {
        workspaceId: workspace.id,
        userId: user.id,
        type: 'AI',
        title: 'AI found opportunity',
        message: 'Inactive customer recovery can unlock strong near-term revenue.',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.simulatorLog.createMany({
    data: [
      {
        workspaceId: workspace.id,
        type: 'Campaign Sent',
        channel: 'WhatsApp',
        message: 'Campaign "Summer Splash VIP Clearance" launched for VIP Customers.',
      },
      {
        workspaceId: workspace.id,
        type: 'Converted',
        channel: 'WhatsApp',
        message: 'Rahul Sharma converted! Order confirmed: ₹1,950 generated via WhatsApp.',
        metadata: { customerName: 'Rahul Sharma' },
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed complete: demo@xeno.ai / XenoDemo123!');
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
