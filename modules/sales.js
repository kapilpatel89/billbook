// ============================================================
// Pro Billbook - Sales Invoice Module (Full GST)
// ============================================================

const SalesModule = {
  currentInvoice: null,
  lineItems: [],
  selectedParty: null,

  async render() {
    const invoices = await db.getAll('invoices');
    invoices.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.renderList(invoices);
  },

  renderList(invoices) {
    const tbody = document.getElementById('invoice-list-body');
    if (!tbody) return;
    if (!invoices.length) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="table-empty"><div class="empty-icon">🧾</div>No invoices yet. Create your first invoice!</div></td></tr>`;
      return;
    }
    tbody.innerHTML = invoices.map(inv => {
      const statusMap = {
        draft: ['badge-secondary', '📝 Draft'],
        confirmed: ['badge-success', '✅ Confirmed'],
        cancelled: ['badge-danger', '❌ Cancelled'],
        amended: ['badge-warning', '🔄 Amended'],
      };
      const [cls, label] = statusMap[inv.status] || ['badge-secondary', inv.status];
      return `<tr>
        <td><strong class="text-primary">${inv.invoiceNo}</strong></td>
        <td>${App.formatDate(inv.date)}</td>
        <td>${inv.partyName || '-'}</td>
        <td><span class="badge badge-info">${inv.supplyType === 'IGST' ? 'IGST' : 'CGST+SGST'}</span></td>
        <td class="text-right font-semibold">₹${(inv.taxableAmount||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
        <td class="text-right font-semibold">₹${(inv.totalTax||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
        <td class="text-right font-bold text-primary">₹${(inv.grandTotal||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
        <td><span class="badge ${cls}">${label}</span></td>
        <td>
          <div class="actions">
            <button class="btn btn-sm btn-primary" onclick="SalesModule.print(${inv.id})" title="Print">🖨️</button>
            <button class="btn btn-sm btn-secondary" onclick="SalesModule.edit(${inv.id})" title="Edit">✏️</button>
            <button class="btn btn-sm btn-success" onclick="SalesModule.receivePayment(${inv.id})" title="Payment">💰</button>
            <button class="btn btn-sm btn-info" onclick="SalesModule.generateEInvoice(${inv.id})" title="E-Invoice">⚡</button>
            <button class="btn btn-sm btn-danger" onclick="SalesModule.cancel(${inv.id})" title="Cancel">❌</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  },

  async openNew() {
    this.currentInvoice = null;
    this.lineItems = [this.emptyLine()];
    this.selectedParty = null;
    const invNo = await this.generateInvoiceNo();
    const today = new Date().toISOString().split('T')[0];
    const co = App.company;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(co?.paymentTerms || 30));
    document.getElementById('inv-no').value = invNo;
    document.getElementById('inv-date').value = today;
    document.getElementById('inv-due').value = dueDate.toISOString().split('T')[0];
    document.getElementById('inv-party-name').value = '';
    document.getElementById('inv-party-gstin').textContent = '-';
    document.getElementById('inv-party-state').textContent = '-';
    document.getElementById('inv-supply-type').value = 'auto';
    document.getElementById('inv-round-off').checked = true;
    document.getElementById('inv-narration').value = '';
    document.getElementById('inv-ewb-toggle').checked = false;
    document.getElementById('inv-einv-toggle').checked = co?.eInvoiceEnabled || false;
    this.renderLineItems();
    this.calculateTotals();
    App.navigate('invoice-form');
  },

  async edit(id) {
    const inv = await db.get('invoices', id);
    if (!inv) return;
    this.currentInvoice = inv;
    this.lineItems = JSON.parse(JSON.stringify(inv.items || []));
    this.selectedParty = inv.partyId ? await db.get('parties', inv.partyId) : null;
    document.getElementById('inv-no').value = inv.invoiceNo;
    document.getElementById('inv-date').value = inv.date;
    document.getElementById('inv-due').value = inv.dueDate || '';
    document.getElementById('inv-party-name').value = inv.partyName || '';
    document.getElementById('inv-party-gstin').textContent = inv.partyGSTIN || '-';
    document.getElementById('inv-party-state').textContent = inv.partyState || '-';
    document.getElementById('inv-supply-type').value = inv.supplyType || 'auto';
    document.getElementById('inv-narration').value = inv.narration || '';
    document.getElementById('inv-round-off').checked = inv.roundOff !== false;
    document.getElementById('inv-ewb-toggle').checked = !!inv.hasEWB;
    document.getElementById('inv-einv-toggle').checked = !!inv.hasEInvoice;
    this.renderLineItems();
    this.calculateTotals();
    App.navigate('invoice-form');
  },

  emptyLine() {
    return { itemId: null, name: '', hsn: '', desc: '', qty: 1, unit: 'NOS', rate: 0, discPct: 0, gstRate: 18, cess: 0, amount: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, cessAmt: 0 };
  },

  renderLineItems() {
    const container = document.getElementById('inv-items-body');
    const uomOpts = UOM_LIST.map(u => `<option value="${u.code}">${u.code}</option>`).join('');
    const gstOpts = GST_RATES.map(r => `<option value="${r}">${r}%</option>`).join('');
    container.innerHTML = this.lineItems.map((item, i) => `
      <tr id="line-${i}">
        <td style="min-width:30px;text-align:center;color:var(--text-muted)">${i + 1}</td>
        <td style="min-width:200px" class="autocomplete-wrap">
          <input class="form-control" placeholder="Item name..." value="${item.name||''}"
            oninput="SalesModule.searchItem(this.value,${i})" id="item-name-${i}" autocomplete="off">
          <div class="autocomplete-dropdown" id="item-drop-${i}"></div>
        </td>
        <td style="min-width:90px"><input class="form-control" id="item-hsn-${i}" value="${item.hsn||''}" placeholder="HSN" oninput="SalesModule.updateLine(${i})"></td>
        <td style="min-width:60px"><input class="form-control" id="item-qty-${i}" type="number" step="0.001" value="${item.qty||1}" min="0.001" oninput="SalesModule.updateLine(${i})"></td>
        <td style="min-width:70px"><select class="form-control" id="item-unit-${i}" onchange="SalesModule.updateLine(${i})">${uomOpts.replace(`value="${item.unit||'NOS'}"`, `value="${item.unit||'NOS'}" selected`)}</select></td>
        <td style="min-width:90px"><input class="form-control" id="item-rate-${i}" type="number" step="0.01" value="${item.rate||0}" oninput="SalesModule.updateLine(${i})"></td>
        <td style="min-width:70px"><input class="form-control" id="item-disc-${i}" type="number" step="0.01" value="${item.discPct||0}" min="0" max="100" oninput="SalesModule.updateLine(${i})"></td>
        <td style="min-width:75px"><select class="form-control" id="item-gst-${i}" onchange="SalesModule.updateLine(${i})">${gstOpts.replace(`value="${item.gstRate}"`, `value="${item.gstRate}" selected`)}</select></td>
        <td style="min-width:100px;text-align:right" id="item-taxable-${i}" class="font-semibold">₹${(item.taxable||0).toFixed(2)}</td>
        <td style="min-width:90px;text-align:right" id="item-gstamt-${i}" class="text-muted">₹${((item.cgst||0)+(item.sgst||0)+(item.igst||0)).toFixed(2)}</td>
        <td style="min-width:100px;text-align:right" id="item-total-${i}" class="font-bold text-primary">₹${(item.amount||0).toFixed(2)}</td>
        <td><span class="remove-row" onclick="SalesModule.removeLine(${i})" title="Remove">✕</span></td>
      </tr>
    `).join('');
  },

  async searchItem(query, lineIdx) {
    const drop = document.getElementById(`item-drop-${lineIdx}`);
    if (!query || query.length < 1) { drop.classList.remove('open'); return; }
    const results = await ItemsModule.searchItems(query);
    if (!results.length) { drop.classList.remove('open'); return; }
    drop.innerHTML = results.map(i => `
      <div class="autocomplete-item" onclick="SalesModule.selectItem(${lineIdx}, ${JSON.stringify(JSON.stringify(i))})">
        <span class="hsn-code">${i.name}</span>
        <span class="hsn-desc">HSN: ${i.hsn} | ₹${i.salePrice}</span>
        <span class="hsn-rate">${i.gstRate}% GST</span>
      </div>`).join('');
    drop.classList.add('open');
  },

  selectItem(lineIdx, itemJson) {
    const item = JSON.parse(itemJson);
    this.lineItems[lineIdx] = {
      ...this.lineItems[lineIdx],
      itemId: item.id, name: item.name, hsn: item.hsn,
      unit: item.unit || 'NOS', rate: item.salePrice || 0,
      gstRate: item.gstRate || 0, cess: item.cess || 0,
    };
    document.getElementById(`item-name-${lineIdx}`).value = item.name;
    document.getElementById(`item-hsn-${lineIdx}`).value = item.hsn;
    document.getElementById(`item-rate-${lineIdx}`).value = item.salePrice || 0;
    document.getElementById(`item-gst-${lineIdx}`).value = item.gstRate || 0;
    document.getElementById(`item-unit-${lineIdx}`).value = item.unit || 'NOS';
    document.getElementById(`item-drop-${lineIdx}`).classList.remove('open');
    this.updateLine(lineIdx);
  },

  updateLine(i) {
    const qty = parseFloat(document.getElementById(`item-qty-${i}`)?.value) || 0;
    const rate = parseFloat(document.getElementById(`item-rate-${i}`)?.value) || 0;
    const disc = parseFloat(document.getElementById(`item-disc-${i}`)?.value) || 0;
    const gst = parseFloat(document.getElementById(`item-gst-${i}`)?.value) || 0;
    const gross = qty * rate;
    const discAmt = gross * disc / 100;
    const taxable = gross - discAmt;
    const gstAmt = taxable * gst / 100;
    const isIGST = this.isIGST();
    const cgst = isIGST ? 0 : gstAmt / 2;
    const sgst = isIGST ? 0 : gstAmt / 2;
    const igst = isIGST ? gstAmt : 0;
    const total = taxable + gstAmt;

    this.lineItems[i] = {
      ...this.lineItems[i],
      name: document.getElementById(`item-name-${i}`)?.value || '',
      hsn: document.getElementById(`item-hsn-${i}`)?.value || '',
      qty, rate, discPct: disc, gstRate: gst,
      taxable, cgst, sgst, igst,
      amount: total,
    };
    const fmt = (n) => `₹${n.toFixed(2)}`;
    if (document.getElementById(`item-taxable-${i}`)) {
      document.getElementById(`item-taxable-${i}`).textContent = fmt(taxable);
      document.getElementById(`item-gstamt-${i}`).textContent = fmt(gstAmt);
      document.getElementById(`item-total-${i}`).textContent = fmt(total);
    }
    this.calculateTotals();
  },

  isIGST() {
    const mode = document.getElementById('inv-supply-type')?.value;
    if (mode === 'IGST') return true;
    if (mode === 'CGST_SGST') return false;
    const co = App.company;
    const party = this.selectedParty;
    if (!co || !party) return false;
    return (co.state || co.stateCode) !== (party.state);
  },

  addLine() {
    this.lineItems.push(this.emptyLine());
    this.renderLineItems();
    this.calculateTotals();
  },

  removeLine(i) {
    if (this.lineItems.length <= 1) { App.toast('At least one item is required', 'warning'); return; }
    this.lineItems.splice(i, 1);
    this.renderLineItems();
    this.calculateTotals();
  },

  calculateTotals() {
    let taxable = 0, cgst = 0, sgst = 0, igst = 0, cess = 0;
    for (const l of this.lineItems) {
      taxable += l.taxable || 0;
      cgst += l.cgst || 0;
      sgst += l.sgst || 0;
      igst += l.igst || 0;
      cess += l.cessAmt || 0;
    }
    const totalTax = cgst + sgst + igst + cess;
    const subtotal = taxable + totalTax;
    const roundOff = document.getElementById('inv-round-off')?.checked ?
      Math.round(subtotal) - subtotal : 0;
    const grand = subtotal + roundOff;
    const isIGST = this.isIGST();

    // Update display
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('tot-taxable', `₹${taxable.toFixed(2)}`);
    set('tot-cgst', `₹${cgst.toFixed(2)}`);
    set('tot-sgst', `₹${sgst.toFixed(2)}`);
    set('tot-igst', `₹${igst.toFixed(2)}`);
    set('tot-cess', `₹${cess.toFixed(2)}`);
    set('tot-roundoff', `₹${roundOff.toFixed(2)}`);
    set('tot-grand', `₹${grand.toFixed(2)}`);
    set('tot-words', App.amountToWords(grand));

    const cgstRow = document.getElementById('tot-cgst-row');
    const sgstRow = document.getElementById('tot-sgst-row');
    const igstRow = document.getElementById('tot-igst-row');
    if (cgstRow) cgstRow.style.display = isIGST ? 'none' : '';
    if (sgstRow) sgstRow.style.display = isIGST ? 'none' : '';
    if (igstRow) igstRow.style.display = isIGST ? '' : 'none';

    const hCgst = document.getElementById('gst-head-cgst');
    const hSgst = document.getElementById('gst-head-sgst');
    const hIgst = document.getElementById('gst-head-igst');
    if (hCgst) hCgst.style.display = isIGST ? 'none' : '';
    if (hSgst) hSgst.style.display = isIGST ? 'none' : '';
    if (hIgst) hIgst.style.display = isIGST ? '' : 'none';

    // GST-wise breakup
    const hsnMap = {};
    for (const l of this.lineItems) {
      const key = `${l.hsn}_${l.gstRate}`;
      if (!hsnMap[key]) hsnMap[key] = { hsn: l.hsn, gst: l.gstRate, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
      hsnMap[key].taxable += l.taxable || 0;
      hsnMap[key].cgst += l.cgst || 0;
      hsnMap[key].sgst += l.sgst || 0;
      hsnMap[key].igst += l.igst || 0;
    }
    const breakupRows = Object.values(hsnMap).map(h =>
      `<tr><td>${h.hsn||'-'}</td><td>${h.gst}%</td><td>₹${h.taxable.toFixed(2)}</td>
      ${isIGST ? `<td>₹${h.igst.toFixed(2)}</td>` : `<td>₹${h.cgst.toFixed(2)}</td><td>₹${h.sgst.toFixed(2)}</td>`}</tr>`
    ).join('');
    const breakupEl = document.getElementById('gst-breakup-body');
    if (breakupEl) breakupEl.innerHTML = breakupRows;
  },

  async selectParty(partyId) {
    const party = await db.get('parties', parseInt(partyId));
    this.selectedParty = party;
    if (party) {
      document.getElementById('inv-party-name').value = party.name;
      document.getElementById('inv-party-gstin').textContent = party.gstin || 'Unregistered';
      const stateName = INDIA_STATES.find(s => s.code === party.state)?.name || party.state || '-';
      document.getElementById('inv-party-state').textContent = stateName;
    }
    this.lineItems.forEach((_, i) => this.updateLine(i));
    this.calculateTotals();
  },

  async partySearch(query) {
    const drop = document.getElementById('inv-party-drop');
    if (!query || query.length < 1) { drop.classList.remove('open'); return; }
    const results = await PartiesModule.searchParties(query);
    if (!results.length) { drop.classList.remove('open'); return; }
    drop.innerHTML = results.map(p => `
      <div class="autocomplete-item" onclick="SalesModule.selectParty(${p.id}); document.getElementById('inv-party-drop').classList.remove('open')">
        <span class="hsn-code">${p.name}</span>
        <span class="hsn-desc">${p.gstin || 'Unregistered'} | ${p.city || ''}</span>
      </div>`).join('');
    drop.classList.add('open');
  },

  async generateInvoiceNo() {
    const co = App.company;
    const prefix = co?.invoicePrefix || 'INV';
    const fy = co?.fyear || '2526';
    const fmt = co?.invoiceFormat || 'PREFIX/FY/NUM';
    const seq = await db.getNextSequence('invoice');
    const num = String(seq).padStart(4, '0');
    if (fmt === 'PREFIX/FY/NUM') return `${prefix}/${fy}/${num}`;
    if (fmt === 'PREFIX/NUM') return `${prefix}/${num}`;
    return `${prefix}${num}`;
  },

  async save(status = 'confirmed') {
    const items = this.lineItems.filter(l => l.name && l.qty > 0);
    if (!items.length) { App.toast('Add at least one item', 'error'); return; }
    const partyName = document.getElementById('inv-party-name').value.trim();
    if (!partyName) { App.toast('Select a party', 'error'); return; }

    let taxable = 0, cgst = 0, sgst = 0, igst = 0, cess = 0;
    for (const l of items) {
      taxable += l.taxable || 0; cgst += l.cgst || 0; sgst += l.sgst || 0;
      igst += l.igst || 0; cess += l.cessAmt || 0;
    }
    const totalTax = cgst + sgst + igst + cess;
    const subtotal = taxable + totalTax;
    const doRoundOff = document.getElementById('inv-round-off')?.checked;
    const roundOff = doRoundOff ? Math.round(subtotal) - subtotal : 0;
    const grand = subtotal + roundOff;

    const data = {
      invoiceNo: document.getElementById('inv-no').value.trim(),
      date: document.getElementById('inv-date').value,
      dueDate: document.getElementById('inv-due').value,
      partyId: this.selectedParty?.id || null,
      partyName,
      partyGSTIN: this.selectedParty?.gstin || '',
      partyState: this.selectedParty?.state || '',
      partyAddress: this.selectedParty?.address || '',
      partyCity: this.selectedParty?.city || '',
      partyPin: this.selectedParty?.pin || '',
      supplyType: this.isIGST() ? 'IGST' : 'CGST_SGST',
      narration: document.getElementById('inv-narration').value.trim(),
      hasEWB: document.getElementById('inv-ewb-toggle').checked,
      hasEInvoice: document.getElementById('inv-einv-toggle').checked,
      items,
      taxableAmount: taxable,
      cgst, sgst, igst, cess,
      totalTax,
      roundOff,
      grandTotal: grand,
      status,
      fyear: App.company?.fyear || '2526',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let invoiceId;
    if (this.currentInvoice?.id) {
      await db.put('invoices', { ...this.currentInvoice, ...data });
      invoiceId = this.currentInvoice.id;
      App.toast('Invoice updated!', 'success');
    } else {
      invoiceId = await db.add('invoices', data);
      // Ledger entry
      if (status === 'confirmed' && this.selectedParty?.id) {
        await db.addLedgerEntry({
          partyId: this.selectedParty.id,
          date: data.date,
          type: 'SALES_INVOICE',
          refId: invoiceId,
          refNo: data.invoiceNo,
          narration: `Sales Invoice ${data.invoiceNo}`,
          amount: grand,
          side: 'DR',
        });
        // Update stock
        for (const l of items) {
          if (l.itemId) await db.updateStock(l.itemId, l.qty, 'OUT', data.invoiceNo, data.date);
        }
      }
      App.toast('Invoice saved!', 'success');
    }
    App.navigate('sales');
    await this.render();
    return invoiceId;
  },

  async cancel(id) {
    if (!confirm('Cancel this invoice? This will reverse ledger entries.')) return;
    const inv = await db.get('invoices', id);
    await db.put('invoices', { ...inv, status: 'cancelled' });
    App.toast('Invoice cancelled', 'warning');
    await this.render();
  },

  async receivePayment(invoiceId) {
    const inv = await db.get('invoices', invoiceId);
    if (!inv) return;
    PaymentsModule.showReceiptModal(inv);
  },

  async print(id) {
    const inv = await db.get('invoices', id);
    if (!inv) return;
    const co = App.company;
    const party = inv.partyId ? await db.get('parties', inv.partyId) : null;
    PrintModule.printInvoice(co, inv, party);
  },

  async generateEInvoice(id) {
    const inv = await db.get('invoices', id);
    if (!inv) return;
    EInvoiceModule.generateJSON(inv);
  },
};

// ============================================================
// Purchase Entry Module
// ============================================================
const PurchaseModule = {
  lineItems: [],
  currentPurchase: null,
  selectedParty: null,

  async render() {
    const purchases = await db.getAll('purchases');
    purchases.sort((a, b) => new Date(b.date) - new Date(a.date));
    const tbody = document.getElementById('purchase-list-body');
    if (!tbody) return;
    if (!purchases.length) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="table-empty"><div class="empty-icon">🛒</div>No purchases recorded yet.</div></td></tr>`;
      return;
    }
    tbody.innerHTML = purchases.map(p => `<tr>
      <td><strong>${p.billNo}</strong><br><span class="text-xs text-muted">${p.ourRef || ''}</span></td>
      <td>${App.formatDate(p.date)}</td>
      <td>${p.partyName || '-'}</td>
      <td><span class="gstin-display text-xs">${p.partyGSTIN || '-'}</span></td>
      <td class="text-right">₹${(p.taxableAmount||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
      <td class="text-right font-bold text-primary">₹${(p.grandTotal||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
      <td>
        <div class="actions">
          <button class="btn btn-sm btn-secondary" onclick="PurchaseModule.view(${p.id})">👁️</button>
          <button class="btn btn-sm btn-danger" onclick="PurchaseModule.delete(${p.id})">🗑️</button>
        </div>
      </td>
    </tr>`).join('');
  },

  async openNew() {
    this.currentPurchase = null;
    this.lineItems = [this.emptyLine()];
    this.selectedParty = null;
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('pur-billno').value = '';
    document.getElementById('pur-date').value = today;
    document.getElementById('pur-supplier-name').value = '';
    document.getElementById('pur-narration').value = '';
    this.renderLineItems();
    this.calculateTotals();
    App.navigate('purchase-form');
  },

  emptyLine() {
    return { itemId: null, name: '', hsn: '', qty: 1, unit: 'NOS', rate: 0, gstRate: 18, taxable: 0, cgst: 0, sgst: 0, igst: 0, amount: 0 };
  },

  renderLineItems() {
    const container = document.getElementById('pur-items-body');
    if (!container) return;
    const uomOpts = UOM_LIST.map(u => `<option value="${u.code}">${u.code}</option>`).join('');
    const gstOpts = GST_RATES.map(r => `<option value="${r}">${r}%</option>`).join('');
    container.innerHTML = this.lineItems.map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td class="autocomplete-wrap" style="min-width:180px">
          <input class="form-control" value="${item.name||''}" placeholder="Item/Service..." id="pur-item-${i}"
            oninput="PurchaseModule.searchItem(this.value,${i})" autocomplete="off">
          <div class="autocomplete-dropdown" id="pur-drop-${i}"></div>
        </td>
        <td><input class="form-control" id="pur-hsn-${i}" value="${item.hsn||''}" placeholder="HSN"></td>
        <td><input class="form-control" id="pur-qty-${i}" type="number" step="0.001" value="${item.qty}" oninput="PurchaseModule.updateLine(${i})"></td>
        <td><select class="form-control" id="pur-unit-${i}">${uomOpts}</select></td>
        <td><input class="form-control" id="pur-rate-${i}" type="number" step="0.01" value="${item.rate}" oninput="PurchaseModule.updateLine(${i})"></td>
        <td><select class="form-control" id="pur-gst-${i}" onchange="PurchaseModule.updateLine(${i})">${gstOpts}</select></td>
        <td class="text-right" id="pur-taxable-${i}">₹${(item.taxable||0).toFixed(2)}</td>
        <td class="text-right font-bold" id="pur-total-${i}">₹${(item.amount||0).toFixed(2)}</td>
        <td><span class="remove-row" onclick="PurchaseModule.removeLine(${i})">✕</span></td>
      </tr>`).join('');
  },

  async searchItem(query, idx) {
    const drop = document.getElementById(`pur-drop-${idx}`);
    if (!query) { drop.classList.remove('open'); return; }
    const results = await ItemsModule.searchItems(query);
    drop.innerHTML = results.map(i => `
      <div class="autocomplete-item" onclick="PurchaseModule.selectItem(${idx},${JSON.stringify(JSON.stringify(i))})">
        <span class="hsn-code">${i.name}</span>
        <span class="hsn-desc">HSN:${i.hsn} ₹${i.purchasePrice}</span>
        <span class="hsn-rate">${i.gstRate}%</span>
      </div>`).join('');
    drop.classList.add(results.length ? 'open' : '');
    if (!results.length) drop.classList.remove('open');
  },

  selectItem(idx, json) {
    const item = JSON.parse(json);
    document.getElementById(`pur-item-${idx}`).value = item.name;
    document.getElementById(`pur-hsn-${idx}`).value = item.hsn;
    document.getElementById(`pur-rate-${idx}`).value = item.purchasePrice || 0;
    document.getElementById(`pur-gst-${idx}`).value = item.gstRate || 0;
    document.getElementById(`pur-unit-${idx}`).value = item.unit || 'NOS';
    document.getElementById(`pur-drop-${idx}`).classList.remove('open');
    this.lineItems[idx].itemId = item.id;
    this.lineItems[idx].name = item.name;
    this.updateLine(idx);
  },

  updateLine(i) {
    const qty = parseFloat(document.getElementById(`pur-qty-${i}`)?.value) || 0;
    const rate = parseFloat(document.getElementById(`pur-rate-${i}`)?.value) || 0;
    const gst = parseFloat(document.getElementById(`pur-gst-${i}`)?.value) || 0;
    const taxable = qty * rate;
    const gstAmt = taxable * gst / 100;
    const isIGST = (this.selectedParty?.state || '') !== (App.company?.state || '');
    this.lineItems[i] = {
      ...this.lineItems[i],
      name: document.getElementById(`pur-item-${i}`)?.value || '',
      hsn: document.getElementById(`pur-hsn-${i}`)?.value || '',
      qty, rate, gstRate: gst, taxable,
      cgst: isIGST ? 0 : gstAmt / 2,
      sgst: isIGST ? 0 : gstAmt / 2,
      igst: isIGST ? gstAmt : 0,
      amount: taxable + gstAmt,
    };
    if (document.getElementById(`pur-taxable-${i}`)) {
      document.getElementById(`pur-taxable-${i}`).textContent = `₹${taxable.toFixed(2)}`;
      document.getElementById(`pur-total-${i}`).textContent = `₹${(taxable + gstAmt).toFixed(2)}`;
    }
    this.calculateTotals();
  },

  addLine() { this.lineItems.push(this.emptyLine()); this.renderLineItems(); },
  removeLine(i) {
    if (this.lineItems.length <= 1) return;
    this.lineItems.splice(i, 1);
    this.renderLineItems();
    this.calculateTotals();
  },

  calculateTotals() {
    let taxable = 0, tax = 0;
    for (const l of this.lineItems) { taxable += l.taxable||0; tax += (l.cgst||0)+(l.sgst||0)+(l.igst||0); }
    const grand = taxable + tax;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('pur-tot-taxable', `₹${taxable.toFixed(2)}`);
    set('pur-tot-tax', `₹${tax.toFixed(2)}`);
    set('pur-tot-grand', `₹${grand.toFixed(2)}`);
  },

  async save() {
    const billNo = document.getElementById('pur-billno').value.trim();
    const partyName = document.getElementById('pur-supplier-name').value.trim();
    if (!billNo) { App.toast('Supplier bill number is required', 'error'); return; }
    if (!partyName) { App.toast('Select a supplier', 'error'); return; }
    const items = this.lineItems.filter(l => l.name && l.qty > 0);
    if (!items.length) { App.toast('Add at least one item', 'error'); return; }

    let taxable = 0, cgst = 0, sgst = 0, igst = 0;
    for (const l of items) { taxable += l.taxable||0; cgst += l.cgst||0; sgst += l.sgst||0; igst += l.igst||0; }
    const grand = taxable + cgst + sgst + igst;

    const data = {
      billNo,
      date: document.getElementById('pur-date').value,
      partyId: this.selectedParty?.id || null,
      partyName,
      partyGSTIN: this.selectedParty?.gstin || '',
      narration: document.getElementById('pur-narration').value.trim(),
      items, taxableAmount: taxable, cgst, sgst, igst,
      totalTax: cgst + sgst + igst, grandTotal: grand,
      createdAt: new Date().toISOString(),
    };
    const id = await db.add('purchases', data);
    // Ledger entry
    if (this.selectedParty?.id) {
      await db.addLedgerEntry({
        partyId: this.selectedParty.id, date: data.date,
        type: 'PURCHASE', refId: id, refNo: billNo,
        narration: `Purchase Bill ${billNo}`, amount: grand, side: 'CR',
      });
    }
    // Update stock (IN)
    for (const l of items) {
      if (l.itemId) await db.updateStock(l.itemId, l.qty, 'IN', billNo, data.date);
    }
    App.toast('Purchase entry saved! Stock updated.', 'success');
    App.navigate('purchases');
    await this.render();
  },

  async view(id) {
    const p = await db.get('purchases', id);
    if (!p) return;
    App.toast(`Bill: ${p.billNo} | Total: ₹${p.grandTotal?.toFixed(2)}`, 'info');
  },

  async delete(id) {
    if (!confirm('Delete this purchase entry?')) return;
    await db.delete('purchases', id);
    App.toast('Purchase deleted', 'info');
    await this.render();
  },

  async partySearch(query) {
    const drop = document.getElementById('pur-supplier-drop');
    if (!drop) return;
    const results = await PartiesModule.searchParties(query);
    const suppliers = results.filter(p => p.type === 'supplier' || p.type === 'both');
    drop.innerHTML = suppliers.map(p => `
      <div class="autocomplete-item" onclick="PurchaseModule.selectParty(${p.id}); document.getElementById('pur-supplier-drop').classList.remove('open')">
        <span class="hsn-code">${p.name}</span>
        <span class="hsn-desc">${p.gstin||'Unregistered'}</span>
      </div>`).join('');
    drop.classList.toggle('open', suppliers.length > 0);
  },

  async selectParty(id) {
    this.selectedParty = await db.get('parties', id);
    if (this.selectedParty) document.getElementById('pur-supplier-name').value = this.selectedParty.name;
  }
};
