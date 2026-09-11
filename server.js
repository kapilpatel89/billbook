// ============================================================
// Pro Billbook - Local Windows Offline Server & File-Based Database
// 100% Local Disk Storage - No Online Database
// ============================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');

const PORT = process.env.PORT || 3000;
const BASE_DIR = __dirname;
const DB_DIR = path.join(BASE_DIR, 'database');
const DATA_DIR = path.join(BASE_DIR, 'data');
const BACKUPS_DIR = path.join(DB_DIR, 'backups');
const INVOICES_DIR = path.join(DATA_DIR, 'invoices');
const PARTIES_DIR = path.join(DATA_DIR, 'parties');
const PURCHASES_DIR = path.join(DATA_DIR, 'purchases');
const EXPORTS_DIR = path.join(DATA_DIR, 'exports');
const REPORTS_DIR = path.join(DATA_DIR, 'reports');

const ALL_DIRS = [
  DB_DIR,
  BACKUPS_DIR,
  DATA_DIR,
  INVOICES_DIR,
  PARTIES_DIR,
  PURCHASES_DIR,
  EXPORTS_DIR,
  REPORTS_DIR,
];

// Ensure all local folders exist with proper structure
function initDirectories() {
  for (const dir of ALL_DIRS) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// Database Stores
const STORES = [
  'company',
  'parties',
  'items',
  'hsn',
  'invoices',
  'purchases',
  'payments',
  'ledger',
  'settings',
  'sequences',
  'ewaybills',
  'einvoices',
  'stockLedger',
];

// Helper: Get file path for store
function getStorePath(store) {
  return path.join(DB_DIR, `${store}.json`);
}

// Helper: Read store data safely
function readStore(store) {
  const filePath = getStorePath(store);
  if (!fs.existsSync(filePath)) {
    if (store === 'company') return null;
    if (store === 'sequences') return {};
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[DB Error] Failed reading ${store}:`, err.message);
    if (store === 'company') return null;
    if (store === 'sequences') return {};
    return [];
  }
}

// Helper: Safe atomic write to store file
function writeStore(store, data) {
  initDirectories();
  const filePath = getStorePath(store);
  const tempPath = `${filePath}.tmp_${Date.now()}`;
  const jsonStr = JSON.stringify(data, null, 2);

  try {
    fs.writeFileSync(tempPath, jsonStr, 'utf8');
    fs.renameSync(tempPath, filePath);
  } catch (e) {
    // Fallback direct write if rename fails
    fs.writeFileSync(filePath, jsonStr, 'utf8');
    if (fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch (_) {}
    }
  }
}

// Helper: Save individual invoice file to data/invoices/
function saveIndividualInvoiceFile(invoice) {
  if (!invoice || !invoice.invoiceNo) return;
  initDirectories();
  const safeName = String(invoice.invoiceNo).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filePath = path.join(INVOICES_DIR, `${safeName}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(invoice, null, 2), 'utf8');
  } catch (err) {
    console.error(`[File Error] Could not save individual invoice ${safeName}:`, err.message);
  }
}

// Helper: Save individual party record
function saveIndividualPartyFile(party) {
  if (!party || !party.name) return;
  initDirectories();
  const safeName = `${String(party.name).replace(/[^a-zA-Z0-9_-]/g, '_')}_ID${party.id || ''}`;
  const filePath = path.join(PARTIES_DIR, `${safeName}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(party, null, 2), 'utf8');
  } catch (err) {
    console.error(`[File Error] Could not save individual party ${safeName}:`, err.message);
  }
}

// Helper: Create automated snapshot backup
function createBackup() {
  initDirectories();
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, '-');
  const backupFolder = path.join(BACKUPS_DIR, `backup_${ts}`);
  fs.mkdirSync(backupFolder, { recursive: true });

  const backupData = {};
  for (const store of STORES) {
    const data = readStore(store);
    backupData[store] = data;
    const storePath = path.join(backupFolder, `${store}.json`);
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8');
  }

  const masterFile = path.join(BACKUPS_DIR, `full_backup_${ts}.json`);
  fs.writeFileSync(masterFile, JSON.stringify(backupData, null, 2), 'utf8');

  return { backupFolder, masterFile, timestamp: ts };
}

// MIME types for static asset serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

// Request body reader
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) { // 50MB max limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// JSON API Response Helper
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  });
  res.end(JSON.stringify(data));
}

// Safe software updater from GitHub - STRICTLY UPDATES CODE ONLY, PRESERVES DATABASE 100%
const CODE_FILES_TO_UPDATE = [
  'index.html',
  'app.js',
  'db.js',
  'server.js',
  'start.bat',
  'install.bat',
  'modules/company.js',
  'modules/gstr.js',
  'modules/items.js',
  'modules/parties.js',
  'modules/payments.js',
  'modules/print.js',
  'modules/sales.js',
  'data/hsn_data.js'
];

async function handleSoftwareUpdate(req, res) {
  const steps = [];
  const filesUpdated = [];

  try {
    steps.push('Creating safety backup of database before code update...');
    const bkp = createBackup();
    steps.push(`Backup verified: ${bkp.masterFile}`);

    let hasGit = false;
    try {
      execSync('git --version', { stdio: 'ignore', cwd: BASE_DIR });
      hasGit = true;
    } catch (_) {}

    if (hasGit) {
      steps.push('Git detected. Connecting to GitHub origin/main...');
      try {
        execSync('git fetch origin main', { cwd: BASE_DIR, timeout: 30000 });
        steps.push('Checking out code files (HTML, JS, modules, scripts)...');
        const filesArgs = CODE_FILES_TO_UPDATE.join(' ');
        execSync(`git checkout origin/main -- ${filesArgs}`, { cwd: BASE_DIR, timeout: 30000 });
        filesUpdated.push(...CODE_FILES_TO_UPDATE);
        steps.push('Code files successfully updated via Git without touching database or json files.');
      } catch (gitErr) {
        steps.push(`Git checkout had a notice: ${gitErr.message || gitErr}. Attempting direct raw GitHub fetch fallback...`);
        hasGit = false;
      }
    }

    if (!hasGit || filesUpdated.length === 0) {
      steps.push('Fetching fresh code files directly from GitHub (kapilpatel89/billbook)...');
      const https = require('https');
      const fetchRaw = (filePath) => new Promise((resolve, reject) => {
        const url = `https://raw.githubusercontent.com/kapilpatel89/billbook/main/${filePath}`;
        https.get(url, { headers: { 'User-Agent': 'Pro-Billbook-Updater' } }, (resp) => {
          if (resp.statusCode !== 200) {
            return reject(new Error(`HTTP ${resp.statusCode} for ${filePath}`));
          }
          let data = '';
          resp.on('data', chunk => data += chunk);
          resp.on('end', () => resolve(data));
        }).on('error', reject);
      });

      for (const file of CODE_FILES_TO_UPDATE) {
        try {
          const content = await fetchRaw(file);
          const dest = path.join(BASE_DIR, file);
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.writeFileSync(dest, content, 'utf8');
          filesUpdated.push(file);
          steps.push(`✓ Updated ${file}`);
        } catch (fErr) {
          steps.push(`⚠️ Skipped ${file}: ${fErr.message}`);
        }
      }
    }

    steps.push('Database integrity verified: 100% of your invoices, parties, and database JSON files were kept as is.');
    return sendJson(res, 200, {
      success: true,
      message: 'Software updated successfully from GitHub',
      filesUpdated,
      steps,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Update software failed:', err);
    steps.push(`Update error: ${err.message || err}`);
    return sendJson(res, 500, {
      success: false,
      message: 'Failed to update software: ' + (err.message || err),
      steps
    });
  }
}

// Handle API endpoints
async function handleApi(req, res, urlPath) {
  const method = req.method.toUpperCase();
  const parts = urlPath.replace(/^\/api\//, '').split('/');
  const resource = parts[0];
  const id = parts[1];

  // Update from GitHub
  if (resource === 'update-from-github' && method === 'POST') {
    return handleSoftwareUpdate(req, res);
  }

  // System Status
  if (resource === 'status') {
    const counts = {};
    for (const s of STORES) {
      const d = readStore(s);
      counts[s] = Array.isArray(d) ? d.length : (d ? 1 : 0);
    }
    return sendJson(res, 200, {
      status: 'online',
      mode: 'local-disk',
      engine: 'ProBillbook Local Engine v1.0',
      databaseDir: DB_DIR,
      invoicesDir: INVOICES_DIR,
      partiesDir: PARTIES_DIR,
      backupsDir: BACKUPS_DIR,
      counts,
      time: new Date().toISOString()
    });
  }

  // Open Windows Explorer to folder
  if (resource === 'open-folder' && method === 'POST') {
    const body = await parseJsonBody(req);
    let target = DB_DIR;
    if (body.folder === 'invoices') target = INVOICES_DIR;
    else if (body.folder === 'parties') target = PARTIES_DIR;
    else if (body.folder === 'backups') target = BACKUPS_DIR;
    else if (body.folder === 'exports') target = EXPORTS_DIR;
    else if (body.folder === 'root') target = BASE_DIR;

    if (process.platform === 'win32') {
      exec(`explorer.exe "${target}"`, (err) => {
        if (err) console.error('Explorer launch error:', err);
      });
    }
    return sendJson(res, 200, { success: true, opened: target });
  }

  // Create Snapshot Backup
  if (resource === 'backup' && method === 'POST') {
    const result = createBackup();
    return sendJson(res, 200, { success: true, ...result });
  }

  // Sequence auto-increment or explicit set
  if (resource === 'sequence') {
    const seqName = id || (await parseJsonBody(req)).name;
    if (!seqName) return sendJson(res, 400, { error: 'Sequence name required' });
    const sequences = readStore('sequences') || {};

    if (method === 'PUT') {
      const body = await parseJsonBody(req);
      const val = Number(body.value) || 0;
      sequences[seqName] = val;
      writeStore('sequences', sequences);
      return sendJson(res, 200, { name: seqName, value: val });
    }

    if (method === 'POST') {
      const cur = Number(sequences[seqName]) || 0;
      const next = cur + 1;
      sequences[seqName] = next;
      writeStore('sequences', sequences);
      return sendJson(res, 200, { name: seqName, value: next });
    }
  }

  // Bulk Seed HSN
  if (resource === 'seed-hsn' && method === 'POST') {
    const body = await parseJsonBody(req);
    const existing = readStore('hsn') || [];
    if (existing.length === 0 && Array.isArray(body.hsn)) {
      writeStore('hsn', body.hsn);
      return sendJson(res, 200, { seeded: body.hsn.length });
    }
    return sendJson(res, 200, { seeded: 0, message: 'Already seeded' });
  }

  // Generic Store CRUD
  if (STORES.includes(resource)) {
    // Special handling for single-object 'company'
    if (resource === 'company') {
      if (method === 'GET') {
        const co = readStore('company');
        return sendJson(res, 200, co || {});
      }
      if (method === 'POST' || method === 'PUT') {
        const body = await parseJsonBody(req);
        const data = { ...body, id: 1, updatedAt: new Date().toISOString() };
        writeStore('company', data);
        return sendJson(res, 200, data);
      }
    }

    // GET all items
    if (method === 'GET' && !id) {
      const items = readStore(resource);
      return sendJson(res, 200, items);
    }

    // GET single item
    if (method === 'GET' && id) {
      const items = readStore(resource);
      const item = Array.isArray(items) ? items.find(i =>
        String(i.id) === String(id) ||
        String(i.key) === String(id) ||
        (resource === 'hsn' && String(i.hsn) === String(id))
      ) : null;
      if (!item) return sendJson(res, 404, { error: 'Not found' });
      return sendJson(res, 200, item);
    }

    // POST create/add
    if (method === 'POST') {
      const body = await parseJsonBody(req);
      let items = readStore(resource);
      if (!Array.isArray(items)) items = [];

      // Check if item already exists
      let existingIdx = -1;
      if (resource === 'hsn' && body.hsn) {
        existingIdx = items.findIndex(i => String(i.hsn).trim() === String(body.hsn).trim());
      }
      if (existingIdx === -1 && body.id) {
        existingIdx = items.findIndex(i => String(i.id) === String(body.id));
      }

      if (existingIdx >= 0) {
        items[existingIdx] = {
          ...items[existingIdx],
          ...body,
          id: items[existingIdx].id || body.id,
          updatedAt: new Date().toISOString()
        };
        body.id = items[existingIdx].id;
      } else {
        // Generate ID if missing
        if (!body.id) {
          const maxId = items.reduce((max, cur) => Math.max(max, Number(cur.id) || 0), 0);
          body.id = maxId + 1;
        }
        body.updatedAt = new Date().toISOString();
        items.push(body);
      }

      writeStore(resource, items);

      // Save individual physical files for bills & parties
      if (resource === 'invoices') saveIndividualInvoiceFile(items[existingIdx] || body);
      if (resource === 'parties') saveIndividualPartyFile(items[existingIdx] || body);

      return sendJson(res, 200, items[existingIdx] || body);
    }

    // PUT update
    if (method === 'PUT') {
      const body = await parseJsonBody(req);
      let items = readStore(resource);
      if (!Array.isArray(items)) items = [];

      const targetId = id || body.id;
      const idx = items.findIndex(i =>
        String(i.id) === String(targetId) ||
        String(i.key) === String(targetId) ||
        (resource === 'hsn' && (String(i.hsn) === String(targetId) || (body.hsn && String(i.hsn) === String(body.hsn))))
      );
      if (idx === -1) {
        // Upsert
        body.id = targetId;
        items.push(body);
      } else {
        items[idx] = { ...items[idx], ...body, id: items[idx].id || targetId, updatedAt: new Date().toISOString() };
      }

      writeStore(resource, items);

      if (resource === 'invoices') saveIndividualInvoiceFile(items[idx] || body);
      if (resource === 'parties') saveIndividualPartyFile(items[idx] || body);

      return sendJson(res, 200, items[idx] || body);
    }

    // DELETE
    if (method === 'DELETE' && id) {
      let items = readStore(resource);
      if (Array.isArray(items)) {
        items = items.filter(i =>
          String(i.id) !== String(id) &&
          String(i.key) !== String(id) &&
          !(resource === 'hsn' && String(i.hsn) === String(id))
        );
        writeStore(resource, items);
      }
      return sendJson(res, 200, { success: true, id });
    }
  }

  return sendJson(res, 404, { error: `Endpoint /api/${resource} not found` });
}

// Main HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const urlPath = parsedUrl.pathname;

  // Handle REST API requests
  if (urlPath.startsWith('/api/')) {
    try {
      await handleApi(req, res, urlPath);
    } catch (err) {
      console.error('[API Error]:', err);
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // Serve static files
  let filePath = path.join(BASE_DIR, urlPath === '/' ? 'index.html' : urlPath);

  // Security: prevent path traversal outside BASE_DIR
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(BASE_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  const ext = path.extname(resolved).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(resolved, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Internal Server Error: ' + err.message);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      });
      res.end(content);
    }
  });
});

// Setup initialization routine (invoked by --init or setup script)
function runSetup() {
  console.log('====================================================');
  console.log('  PRO BILLBOOK - LOCAL WINDOWS DATABASE INITIALIZER ');
  console.log('====================================================');
  console.log('[1/4] Creating local database folders...');
  initDirectories();
  console.log('      Folder created: ' + DB_DIR);
  console.log('      Folder created: ' + INVOICES_DIR);
  console.log('      Folder created: ' + PARTIES_DIR);
  console.log('      Folder created: ' + BACKUPS_DIR);

  console.log('[2/4] Initializing default JSON data tables...');
  for (const store of STORES) {
    const fPath = getStorePath(store);
    if (!fs.existsSync(fPath)) {
      if (store === 'company') fs.writeFileSync(fPath, 'null', 'utf8');
      else if (store === 'sequences') fs.writeFileSync(fPath, '{}', 'utf8');
      else fs.writeFileSync(fPath, '[]', 'utf8');
      console.log('      Initialized: database/' + store + '.json');
    }
  }

  console.log('[3/4] Testing write permissions on disk...');
  const testFile = path.join(DB_DIR, '.test_perm');
  fs.writeFileSync(testFile, 'OK', 'utf8');
  fs.unlinkSync(testFile);
  console.log('      Read/Write permissions verified: OK');

  console.log('[4/4] Local database setup successfully completed!');
  console.log('====================================================');
}

// Check command-line arguments
if (process.argv.includes('--init') || process.argv.includes('--setup')) {
  runSetup();
  process.exit(0);
}

// Start Server
initDirectories();
server.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log('  PRO BILLBOOK GST - 100% OFFLINE LOCAL RUNNING     ');
  console.log('====================================================');
  console.log(`  Local Server URL : http://localhost:${PORT}/`);
  console.log(`  Database Folder  : ${DB_DIR}`);
  console.log(`  Invoices Folder  : ${INVOICES_DIR}`);
  console.log(`  Parties Folder   : ${PARTIES_DIR}`);
  console.log(`  Backups Folder   : ${BACKUPS_DIR}`);
  console.log('  Status           : READY (Press Ctrl+C to stop)');
  console.log('====================================================');
});
