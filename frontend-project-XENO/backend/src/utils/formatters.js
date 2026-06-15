export const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && typeof value.toNumber === 'function') return value.toNumber();
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const rupees = (value) => `₹${Math.round(toNumber(value)).toLocaleString('en-IN')}`;

export const titleCaseStatus = (status) => {
  if (!status) return status;
  return String(status)
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export const campaignStatusToUi = (status) => {
  const map = {
    DRAFT: 'Draft',
    SCHEDULED: 'Scheduled',
    RUNNING: 'Running',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
  };
  return map[status] || titleCaseStatus(status);
};

export const campaignStatusToDb = (status = 'DRAFT') => {
  const normalized = String(status).trim().toUpperCase().replace(/\s+/g, '_');
  const aliases = {
    RUNNING: 'RUNNING',
    LAUNCHED: 'RUNNING',
    DRAFT: 'DRAFT',
    SCHEDULED: 'SCHEDULED',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
  };
  return aliases[normalized] || 'DRAFT';
};

export const customerName = (customer) =>
  [customer?.firstName, customer?.lastName].filter(Boolean).join(' ').trim() || 'Unknown Customer';
