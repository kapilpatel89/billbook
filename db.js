// Pro Billbook - IndexedDB Database Layer
// Version: 1.0

const DB_NAME = 'ProBillbook';
const DB_VERSION = 1;

class BillbookDB {
  constructor() {
    this.db = null;
    this.stores = {
      company: 'company',
      parties: 'parties',
      items: 'items',
      hsn: 'hsn',
      invoices: 'invoices',
      purchases: 'purchases',
      payments: 'payments',
      ledger: 'ledger',
      settings: 'settings',
      ewaybills: 'ewaybills',
      einvoices: 'einvoices',
      stockLedger: 'stockLedger',
      sequences: 'sequences',
    };
  }

  async init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        // Company
        if (!db.objectStoreNames.contains('company')) {
          db.createObjectStore('company', { keyPath: 'id' });
        }
        // Parties
        if (!db.objectStoreNames.contains('parties')) {
          const ps = db.createObjectStore('parties', { keyPath: 'id', autoIncrement: true });
          ps.createIndex('gstin', 'gstin', { unique: false });
          ps.createIndex('name', 'name', { unique: false });
          ps.createIndex('type', 'type', { unique: false });
        }
        // Items/Stock
        if (!db.objectStoreNames.contains('items')) {
          const is = db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
          is.createIndex('hsn', 'hsn', { unique: false });
          is.createIndex('name', 'name', { unique: false });
        }
        // HSN Master
        if (!db.objectStoreNames.contains('hsn')) {
          const hs = db.createObjectStore('hsn', { keyPath: 'id', autoIncrement: true });
          hs.createIndex('code', 'hsn', { unique: false });
        }
        // Sales Invoices
        if (!db.objectStoreNames.contains('invoices')) {
          const inv = db.createObjectStore('invoices', { keyPath: 'id', autoIncrement: true });
          inv.createIndex('invoiceNo', 'invoiceNo', { unique: true });
          inv.createIndex('partyId', 'partyId', { unique: false });
          inv.createIndex('date', 'date', { unique: false });
          inv.createIndex('status', 'status', { unique: false });
          inv.createIndex('fyear', 'fyear', { unique: false });
        }
        // Purchase Entries
        if (!db.objectStoreNames.contains('purchases')) {
          const pu = db.createObjectStore('purchases', { keyPath: 'id', autoIncrement: true });
          pu.createIndex('billNo', 'billNo', { unique: false });
          pu.createIndex('partyId', 'partyId', { unique: false });
          pu.createIndex('date', 'date', { unique: false });
        }
        // Payments
        if (!db.objectStoreNames.contains('payments')) {
          const pay = db.createObjectStore('payments', { keyPath: 'id', autoIncrement: true });
          pay.createIndex('partyId', 'partyId', { unique: false });
          pay.createIndex('date', 'date', { unique: false });
          pay.createIndex('type', 'type', { unique: false });
        }
        // Ledger entries
        if (!db.objectStoreNames.contains('ledger')) {
          const led = db.createObjectStore('ledger', { keyPath: 'id', autoIncrement: true });
          led.createIndex('partyId', 'partyId', { unique: false });
          led.createIndex('date', 'date', { unique: false });
          led.createIndex('type', 'type', { unique: false });
          led.createIndex('refId', 'refId', { unique: false });
        }
        // Settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        // E-Way Bills
        if (!db.objectStoreNames.contains('ewaybills')) {
          const ewb = db.createObjectStore('ewaybills', { keyPath: 'id', autoIncrement: true });
          ewb.createIndex('invoiceId', 'invoiceId', { unique: false });
        }
        // E-Invoices
        if (!db.objectStoreNames.contains('einvoices')) {
          const ei = db.createObjectStore('einvoices', { keyPath: 'id', autoIncrement: true });
          ei.createIndex('invoiceId', 'invoiceId', { unique: false });
          ei.createIndex('irn', 'irn', { unique: false });
        }
        // Stock Ledger
        if (!db.objectStoreNames.contains('stockLedger')) {
          const sl = db.createObjectStore('stockLedger', { keyPath: 'id', autoIncrement: true });
          sl.createIndex('itemId', 'itemId', { unique: false });
          sl.createIndex('date', 'date', { unique: false });
        }
        // Sequences (for auto numbering)
        if (!db.objectStoreNames.contains('sequences')) {
          db.createObjectStore('sequences', { keyPath: 'name' });
        }
      };
      req.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  // Generic CRUD
  async add(store, data) {
    return this._tx(store, 'readwrite', s => s.add(data));
  }
  async put(store, data) {
    return this._tx(store, 'readwrite', s => s.put(data));
  }
  async get(store, key) {
    return this._tx(store, 'readonly', s => s.get(key));
  }
  async getAll(store) {
    return this._tx(store, 'readonly', s => s.getAll());
  }
  async delete(store, key) {
    return this._tx(store, 'readwrite', s => s.delete(key));
  }
  async clear(store) {
    return this._tx(store, 'readwrite', s => s.clear());
  }
  async getByIndex(store, index, value) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readonly');
      const req = tx.objectStore(store).index(index).getAll(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async getAllByRange(store, index, lower, upper) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readonly');
      const range = IDBKeyRange.bound(lower, upper);
      const req = tx.objectStore(store).index(index).getAll(range);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async count(store) {
    return this._tx(store, 'readonly', s => s.count());
  }

  _tx(store, mode, fn) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, mode);
      const req = fn(tx.objectStore(store));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Sequence management (auto-increment numbering)
  async getNextSequence(name) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('sequences', 'readwrite');
      const store = tx.objectStore('sequences');
      const req = store.get(name);
      req.onsuccess = () => {
        const current = req.result ? req.result.value : 0;
        const next = current + 1;
        store.put({ name, value: next });
        resolve(next);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async resetSequence(name, value = 0) {
    return this.put('sequences', { name, value });
  }

  // Company
  async getCompany() { return this.get('company', 1); }
  async saveCompany(data) { return this.put('company', { ...data, id: 1 }); }

  // Settings
  async getSetting(key, def = null) {
    const r = await this.get('settings', key);
    return r ? r.value : def;
  }
  async setSetting(key, value) {
    return this.put('settings', { key, value });
  }

  // Party outstanding balance
  async getPartyBalance(partyId) {
    const all = await this.getByIndex('ledger', 'partyId', partyId);
    return all.reduce((sum, e) => {
      if (e.side === 'DR') return sum + (e.amount || 0);
      if (e.side === 'CR') return sum - (e.amount || 0);
      return sum;
    }, 0);
  }

  // Ledger entry helper
  async addLedgerEntry(entry) {
    return this.add('ledger', {
      ...entry,
      createdAt: new Date().toISOString()
    });
  }

  // Stock update helper
  async updateStock(itemId, qty, type, refId, date) {
    const item = await this.get('items', itemId);
    if (!item) return;
    const newStock = type === 'IN' ? (item.stock || 0) + qty : (item.stock || 0) - qty;
    await this.put('items', { ...item, stock: newStock });
    await this.add('stockLedger', {
      itemId, qty, type, refId, date,
      stockAfter: newStock,
      createdAt: new Date().toISOString()
    });
    return newStock;
  }

  // Bulk insert HSN data
  async seedHSN(hsnData) {
    const count = await this.count('hsn');
    if (count > 0) return; // Already seeded
    const tx = this.db.transaction('hsn', 'readwrite');
    const store = tx.objectStore('hsn');
    for (const h of hsnData) store.add(h);
    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  }

  // Export all data
  async exportAll() {
    const data = {};
    for (const store of Object.values(this.stores)) {
      data[store] = await this.getAll(store);
    }
    return data;
  }

  // Import data
  async importAll(data) {
    for (const [store, records] of Object.entries(data)) {
      await this.clear(store);
      if (records && records.length) {
        const tx = this.db.transaction(store, 'readwrite');
        const s = tx.objectStore(store);
        for (const r of records) s.put(r);
        await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
      }
    }
  }
}

const db = new BillbookDB();
