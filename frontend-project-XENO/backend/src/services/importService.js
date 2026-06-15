import { parse } from 'csv-parse/sync';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { stableHash } from '../utils/crypto.js';
import { recalculateCustomerMetrics } from './customerMetricsService.js';
import { ensureAutoSegments } from './segmentService.js';
import { createNotification } from './notificationService.js';

const parseCsv = (buffer) =>
  parse(buffer.toString('utf8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

const normalizeRow = (row) => {
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = key
      .trim()
      .replace(/\s+/g, '')
      .replace(/_/g, '')
      .toLowerCase();
    normalized[normalizedKey] = typeof value === 'string' ? value.trim() : value;
  }
  return normalized;
};

const pick = (row, ...keys) => {
  for (const key of keys) {
    const normalized = key.toLowerCase().replace(/\s+/g, '').replace(/_/g, '');
    if (row[normalized] !== undefined && row[normalized] !== '') return row[normalized];
  }
  return undefined;
};

const isCustomersFile = (file) => file.originalname.toLowerCase().includes('customer') || file.fieldname === 'customers';
const isOrdersFile = (file) => file.originalname.toLowerCase().includes('order') || file.fieldname === 'orders';

const upsertCustomerFromRow = async (workspaceId, row, tx = prisma) => {
  const externalId = pick(row, 'customerId', 'externalId', 'id');
  const email = pick(row, 'email');
  const phone = pick(row, 'phone');
  const firstName = pick(row, 'firstName', 'first_name', 'name') || 'Unknown';
  const lastName = pick(row, 'lastName', 'last_name') || '';
  const city = pick(row, 'city') || '';

  let existing = null;
  if (email) existing = await tx.customer.findUnique({ where: { workspaceId_email: { workspaceId, email } } });
  if (!existing && phone) existing = await tx.customer.findUnique({ where: { workspaceId_phone: { workspaceId, phone } } });
  if (!existing && externalId) {
    existing = await tx.customer.findUnique({ where: { workspaceId_externalId: { workspaceId, externalId } } });
  }

  if (existing) {
    return tx.customer.update({
      where: { id: existing.id },
      data: {
        externalId: existing.externalId || externalId,
        firstName,
        lastName,
        email: email || existing.email,
        phone: phone || existing.phone,
        city: city || existing.city,
      },
    });
  }

  return tx.customer.create({
    data: {
      workspaceId,
      externalId,
      firstName,
      lastName,
      email,
      phone,
      city,
    },
  });
};

const findCustomerForOrder = async (workspaceId, row, tx = prisma) => {
  const customerId = pick(row, 'customerId', 'customer_id', 'externalId');
  const email = pick(row, 'email');
  const phone = pick(row, 'phone');

  let customer = null;
  if (customerId) {
    customer = await tx.customer.findFirst({
      where: {
        workspaceId,
        OR: [{ id: customerId }, { externalId: customerId }],
      },
    });
  }
  if (!customer && email) customer = await tx.customer.findUnique({ where: { workspaceId_email: { workspaceId, email } } });
  if (!customer && phone) customer = await tx.customer.findUnique({ where: { workspaceId_phone: { workspaceId, phone } } });

  if (customer) return customer;

  return tx.customer.create({
    data: {
      workspaceId,
      externalId: customerId,
      firstName: pick(row, 'firstName') || 'Imported',
      lastName: pick(row, 'lastName') || 'Customer',
      email,
      phone,
      city: pick(row, 'city') || '',
    },
  });
};

const upsertOrderFromRow = async (workspaceId, row, tx = prisma) => {
  const customer = await findCustomerForOrder(workspaceId, row, tx);
  const amount = Number(pick(row, 'amount', 'purchaseAmount', 'orderAmount'));
  const purchaseDateRaw = pick(row, 'purchaseDate', 'orderDate', 'date');
  const category = pick(row, 'category') || 'General';

  if (!Number.isFinite(amount) || amount < 0) throw new Error('Invalid amount');
  const purchaseDate = purchaseDateRaw ? new Date(purchaseDateRaw) : new Date();
  if (Number.isNaN(purchaseDate.getTime())) throw new Error('Invalid purchaseDate');

  const externalOrderId =
    pick(row, 'orderId', 'externalOrderId') ||
    stableHash(`${workspaceId}:${customer.id}:${purchaseDate.toISOString()}:${amount}:${category}`).slice(0, 32);
  const discountUsage = ['coupon', 'discount', 'promo', 'offer'].some((token) =>
    String(category).toLowerCase().includes(token)
  );

  const order = await tx.order.upsert({
    where: {
      workspaceId_externalOrderId: {
        workspaceId,
        externalOrderId,
      },
    },
    update: {
      amount,
      purchaseDate,
      category,
      discountUsage,
    },
    create: {
      workspaceId,
      customerId: customer.id,
      externalOrderId,
      amount,
      purchaseDate,
      category,
      discountUsage,
    },
  });

  return { order, customerId: customer.id };
};

export const ingestCsvFiles = async ({ workspaceId, userId, files }) => {
  if (!files?.length) throw new ApiError(400, 'Upload customers.csv, orders.csv, or both');

  const importJob = await prisma.importJob.create({
    data: {
      workspaceId,
      uploadedBy: userId,
      fileName: files.map((file) => file.originalname).join(', '),
      status: 'PROCESSING',
    },
  });

  let totalRows = 0;
  let successfulRows = 0;
  let failedRows = 0;
  const touchedCustomerIds = new Set();
  const errors = [];

  try {
    const customerFiles = files.filter(isCustomersFile);
    const orderFiles = files.filter(isOrdersFile);

    for (const file of customerFiles) {
      const rows = parseCsv(file.buffer).map(normalizeRow);
      totalRows += rows.length;
      for (const [index, row] of rows.entries()) {
        try {
          const customer = await upsertCustomerFromRow(workspaceId, row);
          touchedCustomerIds.add(customer.id);
          successfulRows += 1;
        } catch (error) {
          failedRows += 1;
          errors.push({ file: file.originalname, row: index + 2, message: error.message });
        }
      }
    }

    for (const file of orderFiles) {
      const rows = parseCsv(file.buffer).map(normalizeRow);
      totalRows += rows.length;
      for (const [index, row] of rows.entries()) {
        try {
          const result = await upsertOrderFromRow(workspaceId, row);
          touchedCustomerIds.add(result.customerId);
          successfulRows += 1;
        } catch (error) {
          failedRows += 1;
          errors.push({ file: file.originalname, row: index + 2, message: error.message });
        }
      }
    }

    for (const customerId of touchedCustomerIds) {
      await recalculateCustomerMetrics(workspaceId, customerId);
    }

    await ensureAutoSegments(workspaceId, userId);

    const completedJob = await prisma.importJob.update({
      where: { id: importJob.id },
      data: {
        status: failedRows > 0 && successfulRows === 0 ? 'FAILED' : 'COMPLETED',
        totalRows,
        processedRows: totalRows,
        successfulRows,
        failedRows,
        errorMessage: errors.length ? JSON.stringify(errors.slice(0, 10)) : null,
        completedAt: new Date(),
        previewData: errors.slice(0, 25),
      },
    });

    await createNotification({
      workspaceId,
      userId,
      type: 'IMPORT',
      title: 'Import completed',
      message: `Imported ${successfulRows} rows from ${files.map((file) => file.originalname).join(', ')}.`,
      data: { importJobId: completedJob.id, successfulRows, failedRows },
    });

    return completedJob;
  } catch (error) {
    await prisma.importJob.update({
      where: { id: importJob.id },
      data: {
        status: 'FAILED',
        totalRows,
        processedRows: totalRows,
        successfulRows,
        failedRows,
        errorMessage: error.message,
        completedAt: new Date(),
      },
    });
    throw error;
  }
};
