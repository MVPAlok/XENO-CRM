const normalizeKey = (key) =>
  String(key).trim().replace(/\s+/g, '').replace(/_/g, '').toLowerCase();

export const CUSTOMER_FIELD_DEFS = [
  { key: 'customerId', label: 'Customer ID', aliases: ['customerid', 'id', 'externalid'] },
  { key: 'firstName', label: 'First Name', aliases: ['firstname', 'name', 'customername'] },
  { key: 'lastName', label: 'Last Name', aliases: ['lastname', 'surname'] },
  { key: 'email', label: 'Email', aliases: ['email', 'emailaddress', 'e-mail'] },
  { key: 'phone', label: 'Phone', aliases: ['phone', 'mobile', 'phonenumber'] },
  { key: 'city', label: 'City', aliases: ['city', 'location'] },
  { key: 'channel', label: 'Preferred Channel', aliases: ['channel', 'preferredchannel'] },
];

export const ORDER_FIELD_DEFS = [
  { key: 'orderId', label: 'Order ID', aliases: ['orderid', 'id', 'externalorderid'] },
  { key: 'customerId', label: 'Customer ID', aliases: ['customerid', 'customer_id'] },
  { key: 'email', label: 'Email', aliases: ['email'] },
  { key: 'phone', label: 'Phone', aliases: ['phone', 'mobile'] },
  { key: 'amount', label: 'Order Amount', aliases: ['amount', 'purchaseamount', 'ordervalue', 'value', 'total'] },
  { key: 'purchaseDate', label: 'Purchase Date', aliases: ['purchasedate', 'orderdate', 'date'] },
  { key: 'category', label: 'Category', aliases: ['category', 'productcategory'] },
];

export const detectFileType = (headers = [], fileName = '') => {
  const normalized = headers.map(normalizeKey);
  const name = fileName.toLowerCase();
  const orderSignals = ['orderid', 'ordervalue', 'purchaseamount', 'orderdate', 'purchaseamount'];
  const customerSignals = ['firstname', 'lastname', 'preferredchannel', 'customername'];

  const orderScore = normalized.filter((h) => orderSignals.some((s) => h.includes(s.replace(/\s/g, '')))).length;
  const customerScore = normalized.filter((h) => customerSignals.some((s) => h.includes(s))).length;

  if (name.includes('order')) return 'orders';
  if (name.includes('customer')) return 'customers';
  if (orderScore > customerScore && normalized.includes('amount')) return 'orders';
  if (customerScore >= orderScore) return 'customers';
  return normalized.includes('amount') || normalized.includes('ordervalue') ? 'orders' : 'customers';
};

export const autoMapColumns = (headers, fieldDefs) => {
  const mappings = {};
  for (const header of headers) {
    const norm = normalizeKey(header);
    const match = fieldDefs.find((def) =>
      def.aliases.some((alias) => norm === alias || norm.includes(alias) || alias.includes(norm))
    );
    mappings[header] = match?.key || '';
  }
  return mappings;
};

export const parseCsvText = (text, maxRows = 200) => {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const cells = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  };

  const headers = parseLine(lines[0]).map((h) => h.replace(/^"|"$/g, ''));
  const rows = lines.slice(1, maxRows + 1).map((line, index) => {
    const values = parseLine(line);
    const row = { _row: index + 2 };
    headers.forEach((header, i) => {
      row[header] = (values[i] || '').replace(/^"|"$/g, '');
    });
    return row;
  });

  return { headers, rows };
};

export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const buildSampleFiles = () => {
  const customersCsv = `Customer ID,First Name,Last Name,Email,Phone,City,Preferred Channel
CUST-001,Aarav,Sharma,aarav.sharma@email.com,+91 98765 43210,Mumbai,WhatsApp
CUST-002,Ananya,Verma,ananya.verma@email.com,+91 98765 43211,Delhi,Email
CUST-003,Rahul,Patel,rahul.patel@email.com,+91 98765 43212,Bangalore,SMS
CUST-004,Diya,Reddy,diya.reddy@email.com,+91 98765 43213,Hyderabad,WhatsApp
CUST-005,Karan,Mehta,karan.mehta@email.com,+91 98765 43214,Pune,RCS`;

  const ordersCsv = `Order ID,Customer ID,Order Value,Purchase Date,Product Category
ORD-1001,CUST-001,2499,2026-05-01,Beauty
ORD-1002,CUST-002,1890,2026-05-03,Coupon Promo
ORD-1003,CUST-003,4200,2026-04-15,Apparel
ORD-1004,CUST-001,1299,2026-05-10,Beauty
ORD-1005,CUST-004,3599,2026-03-20,Electronics`;

  const toFile = (name, content) => new File([content], name, { type: 'text/csv' });

  return {
    customers: toFile('customers_sample.csv', customersCsv),
    orders: toFile('orders_sample.csv', ordersCsv),
  };
};

export const getMappingScore = (mappings, fieldDefs) => {
  const required = fieldDefs.filter((f) => ['email', 'amount', 'customerId'].includes(f.key));
  const mappedKeys = new Set(Object.values(mappings).filter(Boolean));
  const matched = required.filter((f) => mappedKeys.has(f.key)).length;
  return Math.round((matched / Math.max(required.length, 1)) * 100);
};
