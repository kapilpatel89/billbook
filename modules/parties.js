// ============================================================
// Pro Billbook - Party Management Module
// ============================================================

const PartiesModule = {
  parties: [],
  currentParty: null,
  filterType: 'all',

  async render() {
    this.parties = await db.getAll('parties');
    this.renderList();
  },

  renderList() {
    const filtered = this.filterType === 'all' ? this.parties :
      this.parties.filter(p => p.type === this.filterType || p.partyType === this.filterType);
    const search = document.getElementById('party-search')?.value?.toLowerCase() || '';
    const shown = search ? filtered.filter(p =>
      (p.name || '').toLowerCase().includes(search) ||
      (p.gstin || '').toLowerCase().includes(search) ||
      (p.mobile || '').toLowerCase().includes(search)
    ) : filtered;

    const tbody = document.getElementById('party-list-body');
    if (!tbody) return;
    if (!shown.length) {
      tbody.innerHTML = `<tr><td colspan="8">
        <div class="table-empty"><div class="empty-icon">👥</div>No parties found. Add your first party!</div>
      </td></tr>`;
      return;
    }
    tbody.innerHTML = shown.map(p => {
      const stateName = INDIA_STATES.find(s => s.code === p.state)?.name || p.state || '-';
      const typeBadge = {
        customer: 'badge-info',
        supplier: 'badge-success',
        both: 'badge-warning',
      }[p.type] || 'badge-secondary';
      const ptypeBadge = {
        regular: 'badge-primary',
        composition: 'badge-warning',
        unregistered: 'badge-secondary',
        sez: 'badge-purple',
        export: 'badge-info',
      }[p.partyType] || 'badge-secondary';
      return `<tr>
        <td><strong>${p.name}</strong><br><span class="text-sm text-muted">${p.city || ''}</span></td>
        <td><span class="badge ${typeBadge}">${(p.type||'').charAt(0).toUpperCase()+(p.type||'').slice(1)}</span></td>
        <td><span class="gstin-display">${p.gstin || 'Unregistered'}</span></td>
        <td>${stateName}</td>
        <td>${p.mobile || '-'}</td>
        <td><span class="badge ${ptypeBadge}">${(p.partyType||'regular').charAt(0).toUpperCase()+(p.partyType||'regular').slice(1)}</span></td>
        <td id="bal-${p.id}"><span class="pulse">...</span></td>
        <td>
          <div class="actions">
            <button class="btn btn-sm btn-secondary" onclick="PartiesModule.edit(${p.id})" title="Edit">✏️</button>
            <button class="btn btn-sm btn-info" onclick="PartiesModule.viewLedger(${p.id})" title="Ledger">📊</button>
            <button class="btn btn-sm btn-success" onclick="PartiesModule.shareLedger(${p.id})" title="Share">📤</button>
            <button class="btn btn-sm btn-danger" onclick="PartiesModule.delete(${p.id})" title="Delete">🗑️</button>
          </div>
        </td>
      </tr>`;
    }).join('');
    // Load balances async
    shown.forEach(p => this.loadBalance(p.id));
  },

  async loadBalance(partyId) {
    const bal = await db.getPartyBalance(partyId);
    const el = document.getElementById(`bal-${partyId}`);
    if (!el) return;
    const formatted = `₹${Math.abs(bal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    if (bal > 0) el.innerHTML = `<span class="text-danger font-semibold">${formatted} DR</span>`;
    else if (bal < 0) el.innerHTML = `<span class="text-success font-semibold">${formatted} CR</span>`;
    else el.innerHTML = `<span class="text-muted">Nil</span>`;
  },

  showAddModal(prefill = {}) {
    const stateOpts = '<option value="">-- Select State --</option>' +
      INDIA_STATES.map(s => `<option value="${s.code}" ${prefill.state === s.code ? 'selected' : ''}>${s.name}</option>`).join('');
    document.getElementById('party-modal-title').textContent = prefill.id ? '✏️ Edit Party' : '➕ Add New Party';
    document.getElementById('party-modal-body').innerHTML = `
      <div class="form-row-2">
        <div class="form-group">
          <label>Party Type <span class="req">*</span></label>
          <select class="form-control" id="pm-type">
            <option value="customer" ${prefill.type==='customer'?'selected':''}>Customer</option>
            <option value="supplier" ${prefill.type==='supplier'?'selected':''}>Supplier</option>
            <option value="both" ${prefill.type==='both'?'selected':''}>Both</option>
          </select>
        </div>
        <div class="form-group">
          <label>GST Registration <span class="req">*</span></label>
          <select class="form-control" id="pm-ptype" onchange="PartiesModule.onPartyTypeChange()">
            <option value="regular" ${prefill.partyType==='regular'?'selected':''}>Regular</option>
            <option value="composition" ${prefill.partyType==='composition'?'selected':''}>Composition</option>
            <option value="unregistered" ${prefill.partyType==='unregistered'?'selected':''}>Unregistered (URD)</option>
            <option value="sez" ${prefill.partyType==='sez'?'selected':''}>SEZ</option>
            <option value="export" ${prefill.partyType==='export'?'selected':''}>Export/Import</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Party Name <span class="req">*</span></label>
        <input class="form-control" id="pm-name" value="${prefill.name||''}" placeholder="Full business or person name" required>
      </div>
      <div class="form-row-2">
        <div class="form-group" id="pm-gstin-wrap">
          <label>GSTIN</label>
          <input class="form-control font-mono" id="pm-gstin" value="${prefill.gstin||''}" placeholder="22AAAAA0000A1Z5" maxlength="15" style="text-transform:uppercase" oninput="PartiesModule.validateGSTIN(this)">
          <div class="form-hint" id="pm-gstin-hint"></div>
        </div>
        <div class="form-group">
          <label>PAN Number</label>
          <input class="form-control font-mono" id="pm-pan" value="${prefill.pan||''}" placeholder="AAAAA0000A" maxlength="10" style="text-transform:uppercase">
        </div>
      </div>
      <div class="form-group">
        <label>Address</label>
        <input class="form-control" id="pm-addr" value="${prefill.address||''}" placeholder="Street address">
      </div>
      <div class="form-row-3">
        <div class="form-group">
          <label>City</label>
          <input class="form-control" id="pm-city" value="${prefill.city||''}" placeholder="City">
        </div>
        <div class="form-group">
          <label>State <span class="req">*</span></label>
          <select class="form-control" id="pm-state">${stateOpts}</select>
        </div>
        <div class="form-group">
          <label>PIN Code</label>
          <input class="form-control" id="pm-pin" value="${prefill.pin||''}" placeholder="400001" maxlength="6">
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Mobile Number</label>
          <input class="form-control" id="pm-mobile" value="${prefill.mobile||''}" placeholder="9876543210">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input class="form-control" id="pm-email" type="email" value="${prefill.email||''}" placeholder="party@email.com">
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Credit Limit (₹)</label>
          <input class="form-control" id="pm-climit" type="number" value="${prefill.creditLimit||0}" placeholder="0">
        </div>
        <div class="form-group">
          <label>Credit Days</label>
          <input class="form-control" id="pm-cdays" type="number" value="${prefill.creditDays||30}" placeholder="30">
        </div>
      </div>
      <div class="form-group">
        <label>Notes / Remarks</label>
        <textarea class="form-control" id="pm-notes" rows="2" placeholder="Internal notes...">${prefill.notes||''}</textarea>
      </div>
    `;
    this.currentParty = prefill;
    this.onPartyTypeChange();
    App.openModal('party-modal');
  },

  onPartyTypeChange() {
    const ptype = document.getElementById('pm-ptype')?.value;
    const wrap = document.getElementById('pm-gstin-wrap');
    if (wrap) wrap.style.opacity = ptype === 'unregistered' ? '0.5' : '1';
  },

  validateGSTIN(input) {
    const val = input.value.toUpperCase().trim();
    const hint = document.getElementById('pm-gstin-hint');
    if (!val) { hint.textContent = ''; return; }
    const re = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (re.test(val)) {
      const stateCode = val.substring(0, 2);
      const stateName = INDIA_STATES.find(s => s.code === stateCode)?.name || 'Unknown';
      hint.innerHTML = `<span style="color:var(--color-success)">✓ Valid GSTIN — State: ${stateName}</span>`;
      // Auto-fill state
      const stateSelect = document.getElementById('pm-state');
      if (stateSelect) stateSelect.value = stateCode;
    } else {
      hint.innerHTML = `<span style="color:var(--color-danger)">✗ Invalid GSTIN format</span>`;
    }
  },

  async saveParty() {
    const name = document.getElementById('pm-name').value.trim();
    if (!name) { App.toast('Party name is required', 'error'); return; }
    const data = {
      type: document.getElementById('pm-type').value,
      partyType: document.getElementById('pm-ptype').value,
      name,
      gstin: document.getElementById('pm-gstin').value.trim().toUpperCase(),
      pan: document.getElementById('pm-pan').value.trim().toUpperCase(),
      address: document.getElementById('pm-addr').value.trim(),
      city: document.getElementById('pm-city').value.trim(),
      state: document.getElementById('pm-state').value,
      pin: document.getElementById('pm-pin').value.trim(),
      mobile: document.getElementById('pm-mobile').value.trim(),
      email: document.getElementById('pm-email').value.trim(),
      creditLimit: parseFloat(document.getElementById('pm-climit').value) || 0,
      creditDays: parseInt(document.getElementById('pm-cdays').value) || 30,
      notes: document.getElementById('pm-notes').value.trim(),
      updatedAt: new Date().toISOString(),
    };
    if (this.currentParty?.id) {
      await db.put('parties', { ...this.currentParty, ...data });
      App.toast('Party updated!', 'success');
    } else {
      data.createdAt = new Date().toISOString();
      await db.add('parties', data);
      App.toast('Party added!', 'success');
    }
    App.closeModal('party-modal');
    await this.render();
  },

  async edit(id) {
    const party = await db.get('parties', id);
    if (party) this.showAddModal(party);
  },

  async delete(id) {
    if (!confirm('Delete this party? This cannot be undone.')) return;
    await db.delete('parties', id);
    App.toast('Party deleted', 'info');
    await this.render();
  },

  async viewLedger(partyId) {
    const party = await db.get('parties', partyId);
    if (!party) return;
    const entries = await db.getByIndex('ledger', 'partyId', partyId);
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    let balance = 0;
    let rows = '';
    for (const e of entries) {
      if (e.side === 'DR') balance += e.amount;
      else balance -= e.amount;
      const drAmt = e.side === 'DR' ? `₹${e.amount.toLocaleString('en-IN', {minimumFractionDigits:2})}` : '';
      const crAmt = e.side === 'CR' ? `₹${e.amount.toLocaleString('en-IN', {minimumFractionDigits:2})}` : '';
      const balFmt = `₹${Math.abs(balance).toLocaleString('en-IN', {minimumFractionDigits:2})} ${balance >= 0 ? 'DR' : 'CR'}`;
      rows += `<tr class="${e.side === 'DR' ? 'ledger-row-dr' : 'ledger-row-cr'}">
        <td>${App.formatDate(e.date)}</td>
        <td>${e.narration || e.type}</td>
        <td>${e.refNo || '-'}</td>
        <td class="text-right text-danger">${drAmt}</td>
        <td class="text-right text-success">${crAmt}</td>
        <td class="text-right font-semibold">${balFmt}</td>
      </tr>`;
    }
    const finalBal = Math.abs(balance);
    const balStr = `₹${finalBal.toLocaleString('en-IN', {minimumFractionDigits:2})} ${balance >= 0 ? 'DR' : 'CR'}`;
    document.getElementById('ledger-modal-title').textContent = `📊 Ledger: ${party.name}`;
    document.getElementById('ledger-modal-body').innerHTML = `
      <div class="summary-grid" style="margin-bottom:14px">
        <div class="summary-item">
          <div class="summary-item-label">Party</div>
          <div class="summary-item-value text-sm">${party.name}</div>
        </div>
        <div class="summary-item">
          <div class="summary-item-label">GSTIN</div>
          <div class="summary-item-value text-sm font-mono">${party.gstin || 'Unregistered'}</div>
        </div>
        <div class="summary-item">
          <div class="summary-item-label">Outstanding</div>
          <div class="summary-item-value ${balance >= 0 ? 'text-danger' : 'text-success'}">${balStr}</div>
        </div>
      </div>
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Date</th><th>Particulars</th><th>Ref #</th>
              <th class="text-right">Debit (₹)</th><th class="text-right">Credit (₹)</th><th class="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="6" class="table-empty">No transactions found</td></tr>'}</tbody>
        </table>
      </div>
      <div class="mt-2 text-right font-bold" style="padding-top:10px;border-top:1px solid var(--border-color)">
        Closing Balance: <span class="${balance >= 0 ? 'text-danger' : 'text-success'}">${balStr}</span>
      </div>
    `;
    App.openModal('ledger-modal');
  },

  async shareLedger(partyId) {
    const party = await db.get('parties', partyId);
    const entries = await db.getByIndex('ledger', 'partyId', partyId);
    const co = App.company;
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    let balance = 0;
    let text = `*Party Ledger Statement*\n`;
    text += `*${co?.name || 'Your Company'}*\n`;
    text += `Party: *${party.name}*\n`;
    text += `GSTIN: ${party.gstin || 'URD'}\n`;
    text += `Date: ${new Date().toLocaleDateString('en-IN')}\n`;
    text += `─────────────────────────\n`;
    for (const e of entries) {
      if (e.side === 'DR') balance += e.amount;
      else balance -= e.amount;
      const sign = e.side === 'DR' ? '+' : '-';
      text += `${App.formatDate(e.date)} | ${e.narration || e.type}\n  ${sign}₹${e.amount.toLocaleString('en-IN', {minimumFractionDigits:2})} | Bal: ₹${Math.abs(balance).toLocaleString('en-IN', {minimumFractionDigits:2})} ${balance >= 0 ? 'DR' : 'CR'}\n`;
    }
    text += `─────────────────────────\n`;
    text += `*Closing Balance: ₹${Math.abs(balance).toLocaleString('en-IN', {minimumFractionDigits:2})} ${balance >= 0 ? 'DR' : 'CR'}*`;

    const options = `<div class="form-row-2" style="margin-top:10px">
      <button class="btn btn-success btn-lg btn-block" onclick="PartiesModule.shareViaWhatsApp(${JSON.stringify(text.replace(/"/g, '&quot;'))})">
        📱 Share via WhatsApp
      </button>
      <button class="btn btn-info btn-lg btn-block" onclick="PartiesModule.printLedger(${partyId})">
        🖨️ Print Ledger
      </button>
    </div>`;
    document.getElementById('share-modal-content').innerHTML = `
      <div class="alert alert-info" style="margin-bottom:14px">📊 Ledger ready for <strong>${party.name}</strong></div>
      <pre style="background:var(--bg-secondary);padding:14px;border-radius:8px;font-size:0.78rem;overflow-x:auto;white-space:pre-wrap">${text}</pre>
      ${options}
    `;
    App.openModal('share-modal');
  },

  shareViaWhatsApp(text) {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  },

  async printLedger(partyId) {
    const party = await db.get('parties', partyId);
    const entries = await db.getByIndex('ledger', 'partyId', partyId);
    const co = App.company;
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    PrintModule.printPartyLedger(co, party, entries);
  },

  setFilter(type) {
    this.filterType = type;
    document.querySelectorAll('.party-filter-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`pf-${type}`)?.classList.add('active');
    this.renderList();
  },

  // Quick search for party selector in invoice
  async searchParties(query) {
    const all = await db.getAll('parties');
    const q = query.toLowerCase();
    return all.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.gstin || '').toLowerCase().includes(q) ||
      (p.mobile || '').includes(q)
    ).slice(0, 10);
  }
};
