// ============================================================
// Pro Billbook - Stock / Item Management Module
// ============================================================

const ItemsModule = {
  items: [],
  currentItem: null,

  async render() {
    this.items = await db.getAll('items');
    this.renderList();
  },

  renderList() {
    const search = document.getElementById('item-search')?.value?.toLowerCase() || '';
    const shown = search ? this.items.filter(i =>
      (i.name || '').toLowerCase().includes(search) ||
      (i.hsn || '').includes(search)
    ) : this.items;

    const tbody = document.getElementById('item-list-body');
    if (!tbody) return;
    if (!shown.length) {
      tbody.innerHTML = `<tr><td colspan="9"><div class="table-empty"><div class="empty-icon">📦</div>No items found. Add your first item!</div></td></tr>`;
      return;
    }
    tbody.innerHTML = shown.map(i => {
      const stock = i.stock || 0;
      const reorder = i.reorderLevel || 0;
      let stockClass = 'stock-ok', stockLabel = 'In Stock';
      if (stock <= 0) { stockClass = 'stock-out'; stockLabel = 'Out of Stock'; }
      else if (reorder > 0 && stock <= reorder) { stockClass = 'stock-low'; stockLabel = 'Low Stock'; }
      const pct = reorder > 0 ? Math.min(100, (stock / (reorder * 3)) * 100) : 100;
      return `<tr>
        <td><strong>${i.name}</strong><br><span class="text-xs text-muted">${i.description || ''}</span></td>
        <td><span class="gstin-display" style="font-size:0.75rem">${i.hsn || '-'}</span></td>
        <td><span class="badge badge-primary">${i.gstRate || 0}%</span></td>
        <td>${i.unit || 'NOS'}</td>
        <td class="text-right">₹${(i.purchasePrice || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
        <td class="text-right">₹${(i.salePrice || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
        <td>
          <div class="stock-bar-wrap ${stockClass}">
            <span class="font-semibold" style="min-width:40px">${stock}</span>
            <div class="stock-bar" style="min-width:60px"><div class="stock-bar-fill" style="width:${pct}%"></div></div>
            <span class="text-xs ${stockClass === 'stock-ok' ? 'text-success' : stockClass === 'stock-low' ? 'text-warning' : 'text-danger'}">${stockLabel}</span>
          </div>
        </td>
        <td>${i.type === 'service' ? '🔧 Service' : '📦 Goods'}</td>
        <td>
          <div class="actions">
            <button class="btn btn-sm btn-secondary" onclick="ItemsModule.edit(${i.id})" title="Edit">✏️</button>
            <button class="btn btn-sm btn-info" onclick="ItemsModule.viewStockLedger(${i.id})" title="Stock Ledger">📊</button>
            <button class="btn btn-sm btn-danger" onclick="ItemsModule.delete(${i.id})" title="Delete">🗑️</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  },

  showAddModal(prefill = {}) {
    document.getElementById('item-modal-title').textContent = prefill.id ? '✏️ Edit Item' : '➕ Add New Item/Service';
    const uomOpts = UOM_LIST.map(u => `<option value="${u.code}" ${prefill.unit === u.code ? 'selected' : ''}>${u.code} - ${u.name}</option>`).join('');
    const gstOpts = GST_RATES.map(r => `<option value="${r}" ${parseFloat(prefill.gstRate) === r ? 'selected' : ''}>${r}%</option>`).join('');
    document.getElementById('item-modal-body').innerHTML = `
      <div class="form-row-2">
        <div class="form-group">
          <label>Item Type <span class="req">*</span></label>
          <select class="form-control" id="im-type" onchange="ItemsModule.onTypeChange()">
            <option value="goods" ${prefill.type !== 'service' ? 'selected' : ''}>Goods / Product</option>
            <option value="service" ${prefill.type === 'service' ? 'selected' : ''}>Service</option>
          </select>
        </div>
        <div class="form-group">
          <label>Item Name <span class="req">*</span></label>
          <input class="form-control" id="im-name" value="${prefill.name||''}" placeholder="Product/Service name" required>
        </div>
      </div>
      <div class="form-group">
        <label>Description</label>
        <input class="form-control" id="im-desc" value="${prefill.description||''}" placeholder="Brief description (appears on invoice)">
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>HSN / SAC Code <span class="req">*</span></label>
          <div class="autocomplete-wrap">
            <input class="form-control" id="im-hsn" value="${prefill.hsn||''}" placeholder="Search HSN/SAC code..." autocomplete="off" oninput="ItemsModule.hsnSearch(this.value)">
            <div class="autocomplete-dropdown" id="im-hsn-dropdown"></div>
          </div>
        </div>
        <div class="form-group">
          <label>GST Rate <span class="req">*</span></label>
          <select class="form-control" id="im-gst">${gstOpts}</select>
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Unit of Measurement</label>
          <select class="form-control" id="im-unit">${uomOpts}</select>
        </div>
        <div class="form-group" id="im-cess-wrap">
          <label>Cess (%)</label>
          <input class="form-control" id="im-cess" type="number" step="0.01" value="${prefill.cess||0}" placeholder="0">
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Purchase Price (₹) excl. GST</label>
          <input class="form-control" id="im-pprice" type="number" step="0.01" value="${prefill.purchasePrice||''}" placeholder="0.00">
        </div>
        <div class="form-group">
          <label>Sale Price (₹) excl. GST</label>
          <input class="form-control" id="im-sprice" type="number" step="0.01" value="${prefill.salePrice||''}" placeholder="0.00">
        </div>
      </div>
      <div id="im-stock-section">
        <div class="form-row-3">
          <div class="form-group">
            <label>Opening Stock (Qty)</label>
            <input class="form-control" id="im-stock" type="number" step="0.001" value="${prefill.stock||0}">
          </div>
          <div class="form-group">
            <label>Reorder Level</label>
            <input class="form-control" id="im-reorder" type="number" step="0.001" value="${prefill.reorderLevel||0}">
          </div>
          <div class="form-group">
            <label>Max Stock</label>
            <input class="form-control" id="im-maxstock" type="number" step="0.001" value="${prefill.maxStock||0}">
          </div>
        </div>
      </div>
      <div class="checkbox-group">
        <input type="checkbox" id="im-active" ${prefill.active !== false ? 'checked' : ''}>
        <label for="im-active">Active (show in invoice item list)</label>
      </div>
    `;
    this.currentItem = prefill;
    this.onTypeChange();
    App.openModal('item-modal');
  },

  onTypeChange() {
    const type = document.getElementById('im-type')?.value;
    const stockSection = document.getElementById('im-stock-section');
    if (stockSection) stockSection.style.display = type === 'service' ? 'none' : '';
  },

  async hsnSearch(query) {
    const dropdown = document.getElementById('im-hsn-dropdown');
    if (!query || query.length < 2) { dropdown.classList.remove('open'); return; }
    const all = await db.getAll('hsn');
    const q = query.toLowerCase();
    const results = all.filter(h =>
      h.hsn.startsWith(q) || h.desc.toLowerCase().includes(q)
    ).slice(0, 10);
    if (!results.length) { dropdown.classList.remove('open'); return; }
    dropdown.innerHTML = results.map(h => `
      <div class="autocomplete-item" onclick="ItemsModule.selectHSN('${h.hsn}', ${h.gst})">
        <span class="hsn-code">${h.hsn}</span> — <span class="hsn-desc">${h.desc}</span>
        <span class="hsn-rate">${h.gst}% GST</span>
      </div>
    `).join('');
    dropdown.classList.add('open');
  },

  selectHSN(code, gst) {
    document.getElementById('im-hsn').value = code;
    document.getElementById('im-gst').value = gst;
    document.getElementById('im-hsn-dropdown').classList.remove('open');
  },

  async saveItem() {
    const name = document.getElementById('im-name').value.trim();
    if (!name) { App.toast('Item name is required', 'error'); return; }
    const hsn = document.getElementById('im-hsn').value.trim();
    if (!hsn) { App.toast('HSN/SAC code is required', 'error'); return; }
    const isService = document.getElementById('im-type').value === 'service';
    const data = {
      type: document.getElementById('im-type').value,
      name,
      description: document.getElementById('im-desc').value.trim(),
      hsn,
      gstRate: parseFloat(document.getElementById('im-gst').value) || 0,
      unit: document.getElementById('im-unit').value,
      cess: parseFloat(document.getElementById('im-cess').value) || 0,
      purchasePrice: parseFloat(document.getElementById('im-pprice').value) || 0,
      salePrice: parseFloat(document.getElementById('im-sprice').value) || 0,
      stock: isService ? 0 : (parseFloat(document.getElementById('im-stock').value) || 0),
      reorderLevel: isService ? 0 : (parseFloat(document.getElementById('im-reorder').value) || 0),
      maxStock: isService ? 0 : (parseFloat(document.getElementById('im-maxstock').value) || 0),
      active: document.getElementById('im-active').checked,
      updatedAt: new Date().toISOString(),
    };
    if (this.currentItem?.id) {
      await db.put('items', { ...this.currentItem, ...data });
      App.toast('Item updated!', 'success');
    } else {
      data.createdAt = new Date().toISOString();
      await db.add('items', data);
      App.toast('Item added!', 'success');
    }
    App.closeModal('item-modal');
    await this.render();
  },

  async edit(id) {
    const item = await db.get('items', id);
    if (item) this.showAddModal(item);
  },

  async delete(id) {
    if (!confirm('Delete this item?')) return;
    await db.delete('items', id);
    App.toast('Item deleted', 'info');
    await this.render();
  },

  async viewStockLedger(itemId) {
    const item = await db.get('items', itemId);
    if (!item) return;
    const entries = await db.getByIndex('stockLedger', 'itemId', itemId);
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    const rows = entries.map(e => `<tr>
      <td>${App.formatDate(e.date)}</td>
      <td>${e.type === 'IN' ? '📥 In' : '📤 Out'}</td>
      <td>${e.qty}</td>
      <td>${e.refId || '-'}</td>
      <td class="font-semibold">${e.stockAfter}</td>
    </tr>`).join('') || '<tr><td colspan="5" class="table-empty">No stock movements</td></tr>';
    document.getElementById('stock-modal-title').textContent = `📦 Stock Ledger: ${item.name}`;
    document.getElementById('stock-modal-body').innerHTML = `
      <div class="summary-grid" style="margin-bottom:14px">
        <div class="summary-item"><div class="summary-item-label">Item</div><div class="summary-item-value text-sm">${item.name}</div></div>
        <div class="summary-item"><div class="summary-item-label">HSN</div><div class="summary-item-value text-sm font-mono">${item.hsn}</div></div>
        <div class="summary-item"><div class="summary-item-label">Current Stock</div><div class="summary-item-value text-success">${item.stock || 0} ${item.unit || ''}</div></div>
      </div>
      <div class="table-wrapper">
        <table class="table">
          <thead><tr><th>Date</th><th>Type</th><th>Qty</th><th>Reference</th><th>Stock After</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
    App.openModal('stock-modal');
  },

  // For invoice item search
  async searchItems(query) {
    const all = await db.getAll('items');
    const q = query.toLowerCase();
    return all.filter(i => i.active !== false && (
      (i.name || '').toLowerCase().includes(q) ||
      (i.hsn || '').includes(q)
    )).slice(0, 10);
  }
};

// ============================================================
// HSN Module
// ============================================================
const HSNModule = {
  async render() {
    const hsn = await db.getAll('hsn');
    const search = document.getElementById('hsn-search')?.value?.toLowerCase() || '';
    const shown = search ? hsn.filter(h =>
      h.hsn.includes(search) || (h.desc || '').toLowerCase().includes(search)
    ) : hsn;
    const tbody = document.getElementById('hsn-list-body');
    if (!tbody) return;
    if (!shown.length) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="table-empty"><div class="empty-icon">🏷️</div>No HSN codes found.</div></td></tr>`;
      return;
    }
    tbody.innerHTML = shown.map(h => `<tr>
      <td><span class="gstin-display" style="font-size:0.8rem">${h.hsn}</span></td>
      <td>${h.desc}</td>
      <td><span class="badge badge-primary">${h.gst}%</span></td>
      <td><span class="badge badge-secondary">${h.type === 'service' ? '🔧 SAC' : '📦 HSN'}</span></td>
      <td>
        <div class="actions">
          <button class="btn btn-sm btn-secondary" onclick="HSNModule.edit(${h.id})" title="Edit">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="HSNModule.delete(${h.id})" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>`).join('');
  },

  showAddModal(prefill = {}) {
    const gstOpts = GST_RATES.map(r => `<option value="${r}" ${parseFloat(prefill.gst) === r ? 'selected' : ''}>${r}%</option>`).join('');
    document.getElementById('hsn-modal-body').innerHTML = `
      <div class="form-row-2">
        <div class="form-group">
          <label>HSN / SAC Code <span class="req">*</span></label>
          <input class="form-control font-mono" id="hm-code" value="${prefill.hsn||''}" placeholder="e.g. 8471" required>
        </div>
        <div class="form-group">
          <label>Type</label>
          <select class="form-control" id="hm-type">
            <option value="goods" ${prefill.type !== 'service' ? 'selected' : ''}>Goods (HSN)</option>
            <option value="service" ${prefill.type === 'service' ? 'selected' : ''}>Service (SAC)</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Description <span class="req">*</span></label>
        <input class="form-control" id="hm-desc" value="${prefill.desc||''}" placeholder="Description of goods/service" required>
      </div>
      <div class="form-group">
        <label>GST Rate <span class="req">*</span></label>
        <select class="form-control" id="hm-gst">${gstOpts}</select>
      </div>
    `;
    this._prefill = prefill;
    App.openModal('hsn-modal');
  },

  async save() {
    const code = document.getElementById('hm-code').value.trim();
    const desc = document.getElementById('hm-desc').value.trim();
    if (!code || !desc) { App.toast('HSN code and description are required', 'error'); return; }
    const data = {
      hsn: code,
      desc,
      gst: parseFloat(document.getElementById('hm-gst').value) || 0,
      type: document.getElementById('hm-type').value,
    };
    if (this._prefill?.id) {
      await db.put('hsn', { ...this._prefill, ...data });
      App.toast('HSN updated!', 'success');
    } else {
      await db.add('hsn', data);
      App.toast('HSN code added!', 'success');
    }
    App.closeModal('hsn-modal');
    await this.render();
  },

  async edit(id) {
    const h = await db.get('hsn', id);
    if (h) this.showAddModal(h);
  },

  async delete(id) {
    if (!confirm('Delete this HSN code?')) return;
    await db.delete('hsn', id);
    App.toast('HSN deleted', 'info');
    await this.render();
  }
};
