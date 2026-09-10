// ============================================================
// Pro Billbook - Database Layer (Hybrid Local Disk Filesystem + IndexedDB)
// 100% Offline Local Windows Solution - No Online Database
// Saves all data physically into e:\Pro Billbook\database\ & data\
// ============================================================

const DB_NAME = 'ProBillbook';
const DB_VERSION = 1;

class BillbookDB {
  constructor() {
    this.db = null;
    this.isServerOnline = false;
    this.serverInfo = null;
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
    // 1. Initialize browser IndexedDB as local engine/cache
    await this._initIndexedDB();

    // 2. Check if local Windows file server is running
    await this.checkServerStatus();

    // 3. If local file server is online, pull existing disk data to synchronize
    if (this.isServerOnline) {
      console.log('✅ Connected to Local Windows Disk Database:', this.serverInfo.databaseDir);
      await this._syncFromDisk();
    } else {
      console.log('ℹ️ Running in Browser IndexedDB Offline Mode');
    }

    return this;
  }

  // Check connection to local server API
  async checkServerStatus() {
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'online') {
          this.isServerOnline = true;
          this.serverInfo = data;
          return true;
        }
      }
    } catch (_) {
      // Server not reachable (static preview or file:// mode)
    }
    this.isServerOnline = false;
    this.serverInfo = null;
    return false;
  }

  // Synchronize from local disk JSON files into IndexedDB cache
  async _syncFromDisk() {
    try {
      for (const store of Object.values(this.stores)) {
        if (store === 'company') {
          const res = await fetch('/api/company', { cache: 'no-store' });
          if (res.ok) {
            const co = await res.json();
            if (co && co.name) {
              await this._idbPut('company', { ...co, id: 1 });
            }
          }
        } else if (store === 'sequences') {
          // sequences handled via API
        } else {
          const res = await fetch(`/api/${store}`, { cache: 'no-store' });
          if (res.ok) {
            const items = await res.json();
            if (Array.isArray(items) && items.length > 0) {
              for (const item of items) {
                await this._idbPut(store, item);
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Initial sync from disk caught error:', err);
    }
  }

  _initIndexedDB() {
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

  // Internal IndexedDB helpers
  _idbTx(store, mode, fn) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, mode);
      const req = fn(tx.objectStore(store));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  _idbPut(store, data) {
    return this._idbTx(store, 'readwrite', s => s.put(data));
  }
  _idbAdd(store, data) {
    return this._idbTx(store, 'readwrite', s => s.add(data));
  }
  _idbGet(store, key) {
    return this._idbTx(store, 'readonly', s => s.get(key));
  }
  _idbGetAll(store) {
    return this._idbTx(store, 'readonly', s => s.getAll());
  }
  _idbDelete(store, key) {
    return this._idbTx(store, 'readwrite', s => s.delete(key));
  }

  // Unified CRUD: Saves to local disk files AND mirrors to IndexedDB
  async add(store, data) {
    let saved = data;
    if (this.isServerOnline) {
      try {
        const res = await fetch(`/api/${store}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          saved = await res.json();
        }
      } catch (err) {
        console.warn(`[Local Server] add ${store} fallback to IDB:`, err);
      }
    }
    // Update local IDB cache
    try {
      await this._idbPut(store, saved);
    } catch (_) {
      try { await this._idbAdd(store, saved); } catch (_) {}
    }
    return saved.id || saved;
  }

  async put(store, data) {
    let saved = data;
    const key = data.id || data.key || (store === 'company' ? 1 : null);
    if (this.isServerOnline && key !== null) {
      try {
        const res = await fetch(`/api/${store}/${key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          saved = await res.json();
        }
      } catch (err) {
        console.warn(`[Local Server] put ${store} fallback to IDB:`, err);
      }
    }
    await this._idbPut(store, saved);
    return saved;
  }

  async get(store, key) {
    if (this.isServerOnline) {
      try {
        const res = await fetch(`/api/${store}/${key}`, { cache: 'no-store' });
        if (res.ok) {
          const item = await res.json();
          if (item) {
            await this._idbPut(store, item);
            return item;
          }
        }
      } catch (err) {
        // Fall back to IDB
      }
    }
    return this._idbGet(store, key);
  }

  async getAll(store) {
    if (this.isServerOnline) {
      try {
        const res = await fetch(`/api/${store}`, { cache: 'no-store' });
        if (res.ok) {
          const items = await res.json();
          if (Array.isArray(items)) {
            // Update local IDB mirror
            for (const item of items) {
              await this._idbPut(store, item).catch(() => {});
            }
            return items;
          }
        }
      } catch (err) {
        console.warn(`[Local Server] getAll ${store} fallback:`, err);
      }
    }
    return this._idbGetAll(store);
  }

  async delete(store, key) {
    if (this.isServerOnline) {
      try {
        await fetch(`/api/${store}/${key}`, { method: 'DELETE' });
      } catch (err) {
        console.warn(`[Local Server] delete ${store} error:`, err);
      }
    }
    return this._idbDelete(store, key);
  }

  async clear(store) {
    return this._idbTx(store, 'readwrite', s => s.clear());
  }

  async getByIndex(store, index, value) {
    // If online, can filter from getAll
    if (this.isServerOnline) {
      const all = await this.getAll(store);
      return all.filter(item => String(item[index]) === String(value));
    }
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readonly');
      const req = tx.objectStore(store).index(index).getAll(value);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getAllByRange(store, index, lower, upper) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readonly');
      const range = IDBKeyRange.bound(lower, upper);
      const req = tx.objectStore(store).index(index).getAll(range);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async count(store) {
    if (this.isServerOnline) {
      const all = await this.getAll(store);
      return all.length;
    }
    return this._idbTx(store, 'readonly', s => s.count());
  }

  // Sequence management (auto-increment numbering)
  async getNextSequence(name) {
    if (this.isServerOnline) {
      try {
        const res = await fetch(`/api/sequence/${name}`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          await this._idbPut('sequences', { name, value: data.value });
          return data.value;
        }
      } catch (err) {
        console.warn('Fallback sequence to IDB:', err);
      }
    }
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

  // Company Profile
  async getCompany() {
    if (this.isServerOnline) {
      try {
        const res = await fetch('/api/company', { cache: 'no-store' });
        if (res.ok) {
          const co = await res.json();
          if (co && co.name) {
            await this._idbPut('company', { ...co, id: 1 });
            return co;
          }
        }
      } catch (err) {}
    }
    return this._idbGet('company', 1);
  }

  async saveCompany(data) {
    const payload = { ...data, id: 1 };
    if (this.isServerOnline) {
      try {
        const res = await fetch('/api/company', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const saved = await res.json();
          await this._idbPut('company', saved);
          return saved;
        }
      } catch (err) {
        console.warn('saveCompany fallback to IDB:', err);
      }
    }
    return this._idbPut('company', payload);
  }

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
    if (this.isServerOnline) {
      try {
        await fetch('/api/seed-hsn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hsn: hsnData }),
        });
      } catch (_) {}
    }
    const tx = this.db.transaction('hsn', 'readwrite');
    const store = tx.objectStore('hsn');
    for (const h of hsnData) store.add(h);
    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  }

  // Open Windows Explorer directly to local data folder
  async openLocalFolder(folder = 'database') {
    if (!this.isServerOnline) {
      alert('Local Windows server is not running. Start using start.bat to open local folders.');
      return;
    }
    try {
      const res = await fetch('/api/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder }),
      });
      const data = await res.json();
      if (data.opened) {
        console.log('Opened folder:', data.opened);
      }
    } catch (err) {
      console.error('Error opening local folder:', err);
    }
  }

  // Create Snapshot Backup in database/backups/
  async createLocalBackup() {
    if (!this.isServerOnline) {
      return this.exportAll();
    }
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('Local backup failed:', err);
    }
    return this.exportAll();
  }

  // Export all data (JSON object)
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
      if (records && records.length) {
        for (const r of records) {
          await this.put(store, r);
        }
      }
    }
  }
}

const db = new BillbookDB();
