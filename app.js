// ============================================================
// Pro Billbook - Main Application Controller
// ============================================================

const App = {
  company: null,
  currentPage: 'dashboard',

  async init() {
    // Init DB
    await db.init();
    // Seed HSN data
    await db.seedHSN(HSN_DATA);
    // Load company
    this.company = await db.getCompany();
    if (!this.company) {
      CompanyModule.showSetup();
    } else {
      this.hideSetup();
      this.updateTopbar();
      await this.navigate('dashboard');
    }
    this.bindGlobalEvents();
    this.updateFYBadge();
  },

  hideSetup() {
    const overlay = document.getElementById('setup-overlay');
    if (overlay) overlay.style.display = 'none';
  },

  updateTopbar() {
    const co = this.company;
    const nameEl = document.getElementById('topbar-company-name');
    if (nameEl) nameEl.textContent = co?.name || 'Pro Billbook';
    this.updateFYBadge();
  },

  updateFYBadge() {
    const co = this.company;
    const fy = co?.fyear || '2526';
    const badge = document.getElementById('fy-badge');
    if (badge) badge.textContent = `FY ${fy.substring(0,2)}-${fy.substring(2)}`;
  },

  async navigate(page, data = null) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // Update nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (navItem) navItem.classList.add('active');

    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.add('active');

    // Update topbar title
    const titles = {
      dashboard: '🏠 Dashboard',
      sales: '🧾 Sales Invoices',
      'invoice-form': '🧾 Create Invoice',
      purchases: '🛒 Purchases',
      'purchase-form': '🛒 Purchase Entry',
      parties: '👥 Party Management',
      items: '📦 Stock & Items',
      hsn: '🏷️ HSN Master',
      payments: '💰 Payments',
      ledger: '📊 Ledger',
      gstr: '📋 GSTR Returns',
      'print-center': '🖨️ Print Center',
      settings: '⚙️ Settings',
    };
    const titleEl = document.getElementById('topbar-page-title');
    if (titleEl) titleEl.textContent = titles[page] || page;

    this.currentPage = page;

    // Render page content
    switch (page) {
      case 'dashboard': await this.renderDashboard(); break;
      case 'sales': await SalesModule.render(); break;
      case 'purchases': await PurchaseModule.render(); break;
      case 'parties': await PartiesModule.render(); break;
      case 'items': await ItemsModule.render(); break;
      case 'hsn': await HSNModule.render(); break;
      case 'payments': await PaymentsModule.render(); break;
      case 'ledger': await LedgerModule.render(); break;
      case 'gstr': await GSTRModule.render(); break;
      case 'settings': await CompanyModule.renderSettings(); break;
      case 'invoice-form': SalesModule.renderLineItems(); SalesModule.calculateTotals(); break;
      case 'purchase-form': PurchaseModule.renderLineItems(); PurchaseModule.calculateTotals(); break;
    }
  },

  async renderDashboard() {
    const invoices = await db.getAll('invoices');
    const confirmed = invoices.filter(i => i.status === 'confirmed');
    const parties = await db.getAll('parties');
    const items = await db.getAll('items');
    const today = new Date();
    const thisMonth = confirmed.filter(i => {
      const d = new Date(i.date);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
    const monthSales = thisMonth.reduce((s, i) => s + (i.grandTotal || 0), 0);
    const monthTax = thisMonth.reduce((s, i) => s + (i.totalTax || 0), 0);
    const lowStockItems = items.filter(i => i.type !== 'service' && i.reorderLevel > 0 && (i.stock || 0) <= i.reorderLevel);
    const outOfStock = items.filter(i => i.type !== 'service' && (i.stock || 0) <= 0);

    // Update stats
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('dash-month-sales', `₹${monthSales.toLocaleString('en-IN', {maximumFractionDigits:0})}`);
    set('dash-month-tax', `₹${monthTax.toLocaleString('en-IN', {maximumFractionDigits:0})}`);
    set('dash-total-invoices', confirmed.length);
    set('dash-parties', parties.length);
    set('dash-items', items.length);
    set('dash-low-stock', lowStockItems.length);

    // Recent invoices
    const recent = [...confirmed].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    const recentEl = document.getElementById('dash-recent-invoices');
    if (recentEl) {
      recentEl.innerHTML = recent.length ? recent.map(inv => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-color)">
          <div>
            <div class="font-semibold text-primary">${inv.invoiceNo}</div>
            <div class="text-xs text-muted">${inv.partyName} | ${this.formatDate(inv.date)}</div>
          </div>
          <div class="text-right">
            <div class="font-bold">₹${(inv.grandTotal||0).toLocaleString('en-IN',{maximumFractionDigits:0})}</div>
            <div class="text-xs text-muted">+ ₹${(inv.totalTax||0).toFixed(0)} GST</div>
          </div>
        </div>`).join('') : '<div class="text-muted text-sm" style="padding:16px 0">No invoices this month</div>';
    }

    // Alerts
    const alertsEl = document.getElementById('dash-alerts');
    if (alertsEl) {
      let alerts = '';
      if (outOfStock.length) alerts += `<div class="alert alert-danger">⚠️ <strong>${outOfStock.length}</strong> item(s) are out of stock</div>`;
      if (lowStockItems.length) alerts += `<div class="alert alert-warning" style="margin-top:6px">📉 <strong>${lowStockItems.length}</strong> item(s) are below reorder level</div>`;
      if (!alerts) alerts = `<div class="alert alert-success">✅ All systems normal</div>`;
      alertsEl.innerHTML = alerts;
    }
  },

  bindGlobalEvents() {
    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          const modalId = overlay.id.replace('-overlay', '');
          this.closeModal(modalId);
        }
      });
    });

    // Close autocomplete on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.autocomplete-wrap')) {
        document.querySelectorAll('.autocomplete-dropdown').forEach(d => d.classList.remove('open'));
      }
    });

    // Keyboard: Escape to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(o => {
          const modalId = o.id.replace('-overlay', '');
          this.closeModal(modalId);
        });
      }
    });
  },

  openModal(id) {
    const overlay = document.getElementById(`${id}-overlay`);
    if (overlay) { overlay.classList.add('open'); }
  },

  closeModal(id) {
    const overlay = document.getElementById(`${id}-overlay`);
    if (overlay) { overlay.classList.remove('open'); }
  },

  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; toast.style.transition = 'all 0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
  },

  formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  formatDateInv(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  },

  amountToWords(amount) {
    if (!amount || isNaN(amount)) return 'Zero Rupees Only';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    function numToWords(n) {
      if (n === 0) return '';
      if (n < 20) return ones[n] + ' ';
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '') + ' ';
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + numToWords(n % 100);
      if (n < 100000) return numToWords(Math.floor(n / 1000)) + 'Thousand ' + numToWords(n % 1000);
      if (n < 10000000) return numToWords(Math.floor(n / 100000)) + 'Lakh ' + numToWords(n % 100000);
      return numToWords(Math.floor(n / 10000000)) + 'Crore ' + numToWords(n % 10000000);
    }
    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);
    let result = numToWords(rupees).trim() + ' Rupees';
    if (paise > 0) result += ' and ' + numToWords(paise).trim() + ' Paise';
    return result + ' Only';
  },

  async exportData() {
    const data = await db.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ProBillbook_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.toast('Data exported successfully!', 'success');
  },

  async importData() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (confirm('This will replace ALL existing data. Are you sure?')) {
          await db.importAll(data);
          this.company = await db.getCompany();
          this.toast('Data imported successfully! Reloading...', 'success');
          setTimeout(() => location.reload(), 1500);
        }
      } catch {
        this.toast('Invalid backup file', 'error');
      }
    };
    input.click();
  },
};

// Start the app
window.addEventListener('DOMContentLoaded', () => App.init());
