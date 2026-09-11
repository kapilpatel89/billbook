// ============================================================
// Pro Billbook - Sales Invoice Module (Full GST)
// ============================================================

function getLocalDateString(d = new Date()) {
  const dt = (d instanceof Date && !isNaN(d.getTime())) ? d : new Date();
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
if (typeof window !== 'undefined') window.getLocalDateString = getLocalDateString;

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
    const today = getLocalDateString();
    const co = App.company;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(co?.paymentTerms || 30));
    document.getElementById('inv-no').value = invNo;
    document.getElementById('inv-date').value = today;
    document.getElementById('inv-due').value = getLocalDateString(dueDate);
    document.getElementById('inv-party-name').value = '';
    document.getElementById('inv-party-gstin').textContent = '-';
    document.getElementById('inv-party-state').textContent = '-';
    document.getElementById('inv-supply-type').value = 'auto';
    document.getElementById('inv-round-off').checked = true;
    document.getElementById('inv-narration').value = '';
    document.getElementById('inv-ewb-toggle').checked = false;
    document.getElementById('inv-einv-toggle').checked = co?.eInvoiceEnabled || false;
    if (document.getElementById('inv-vehicle-no')) document.getElementById('inv-vehicle-no').value = '';
    if (document.getElementById('inv-ewb-no')) document.getElementById('inv-ewb-no').value = '';
    if (document.getElementById('inv-dispatch-through')) document.getElementById('inv-dispatch-through').value = '';
    if (document.getElementById('inv-lr-no')) document.getElementById('inv-lr-no').value = '';
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
    document.getElementById('inv-date').value = inv.date || getLocalDateString();
    document.getElementById('inv-due').value = inv.dueDate || '';
    document.getElementById('inv-party-name').value = inv.partyName || '';
    document.getElementById('inv-party-gstin').textContent = inv.partyGSTIN || '-';
    document.getElementById('inv-party-state').textContent = inv.partyState || '-';
    document.getElementById('inv-supply-type').value = inv.supplyType || 'auto';
    document.getElementById('inv-narration').value = inv.narration || '';
    document.getElementById('inv-round-off').checked = inv.roundOff !== false;
    document.getElementById('inv-ewb-toggle').checked = !!inv.hasEWB;
    document.getElementById('inv-einv-toggle').checked = !!inv.hasEInvoice;
    if (document.getElementById('inv-vehicle-no')) document.getElementById('inv-vehicle-no').value = inv.vehicleNo || '';
    if (document.getElementById('inv-ewb-no')) document.getElementById('inv-ewb-no').value = inv.ewbNo || '';
    if (document.getElementById('inv-dispatch-through')) document.getElementById('inv-dispatch-through').value = inv.dispatchThrough || '';
    if (document.getElementById('inv-lr-no')) document.getElementById('inv-lr-no').value = inv.lrNo || '';
    this.renderLineItems();
    this.calculateTotals();
    App.navigate('invoice-form');
  },

  onDateChange() {
    const invDateVal = document.getElementById('inv-date')?.value;
    if (invDateVal) {
      const co = App.company;
      const terms = parseInt(co?.paymentTerms || 30);
      const parts = invDateVal.split('-').map(Number);
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        const dueDate = new Date(parts[0], parts[1] - 1, parts[2] + terms);
        const dueEl = document.getElementById('inv-due');
        if (dueEl) {
          dueEl.value = getLocalDateString(dueDate);
        }
      }
    }
    this.calculateTotals();
  },

  emptyLine() {
    return { itemId: null, name: '', hsn: '', desc: '', description: '', qty: 1, unit: 'NOS', rate: 0, discPct: 0, gstRate: 18, cess: 0, amount: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, cessAmt: 0 };
  },

  renderLineItems() {
    const container = document.getElementById('inv-items-body');
    const uomList = (typeof UOM_LIST !== 'undefined') ? UOM_LIST : [{ code: 'NOS', name: 'Numbers' }, { code: 'PCS', name: 'Pieces' }, { code: 'KGS', name: 'Kilograms' }];
    const gstRates = (typeof GST_RATES !== 'undefined') ? GST_RATES : [0, 5, 12, 18, 28];
    const uomOpts = uomList.map(u => `<option value="${u.code}">${u.code}</option>`).join('');
    const gstOpts = gstRates.map(r => `<option value="${r}">${r}%</option>`).join('');
    container.innerHTML = this.lineItems.map((item, i) => `
      <tr id="line-${i}">
        <td style="min-width:35px;width:35px;text-align:center;color:var(--text-muted)">${i + 1}</td>
        <td style="min-width:240px; vertical-align:top;">
          <div class="autocomplete-wrap" style="position:relative; width:100%;">
            <input class="form-control" placeholder="Item name..." value="${item.name||''}"
              oninput="SalesModule.searchItem(this.value,${i})"
              onkeydown="SalesModule.handleItemKeydown(event,${i})"
              id="item-name-${i}" autocomplete="off">
            <div class="autocomplete-dropdown" id="item-drop-${i}" style="position:absolute; top:calc(100% + 2px); left:0; width:100%; min-width:280px; z-index:99999;"></div>
          </div>
          <input class="form-control form-control-sm" placeholder="Item description / details..."
            value="${item.desc || item.description || ''}"
            id="item-desc-${i}"
            oninput="SalesModule.updateLine(${i})"
            style="margin-top:4px;font-size:0.75rem;padding:3px 6px;height:24px;border-color:var(--border);border-style:dashed;"
            title="Item Description (auto-filled from item master, freely changeable in this invoice)">
        </td>
        <td style="min-width:115px; width:115px;"><input class="form-control" id="item-hsn-${i}" value="${item.hsn||''}" placeholder="HSN Code" oninput="SalesModule.updateLine(${i})" style="text-align:center; font-family:var(--font-mono); letter-spacing:0.5px;" title="HSN / SAC Code"></td>
        <td style="min-width:75px; width:75px;"><input class="form-control" id="item-qty-${i}" type="number" step="0.001" value="${item.qty||1}" min="0.001" oninput="SalesModule.updateLine(${i})" style="text-align:right;"></td>
        <td style="min-width:100px; width:100px;"><select class="form-control" id="item-unit-${i}" onchange="SalesModule.updateLine(${i})" style="font-weight:500;">${uomOpts.replace(`value="${item.unit||'NOS'}"`, `value="${item.unit||'NOS'}" selected`)}</select></td>
        <td style="min-width:115px; width:115px;"><input class="form-control" id="item-rate-${i}" type="number" step="0.01" value="${item.rate||0}" oninput="SalesModule.updateLine(${i})" style="text-align:right; font-weight:600;" placeholder="0.00"></td>
        <td style="min-width:70px; width:70px;"><input class="form-control" id="item-disc-${i}" type="number" step="0.01" value="${item.discPct||0}" min="0" max="100" oninput="SalesModule.updateLine(${i})" style="text-align:right;"></td>
        <td style="min-width:85px; width:85px;"><select class="form-control" id="item-gst-${i}" onchange="SalesModule.updateLine(${i})">${gstOpts.replace(`value="${item.gstRate}"`, `value="${item.gstRate}" selected`)}</select></td>
        <td style="min-width:95px;text-align:right" id="item-taxable-${i}" class="font-semibold">₹${(item.taxable||0).toFixed(2)}</td>
        <td style="min-width:85px;text-align:right" id="item-gstamt-${i}" class="text-muted">₹${((item.cgst||0)+(item.sgst||0)+(item.igst||0)).toFixed(2)}</td>
        <td style="min-width:105px;text-align:right" id="item-total-${i}" class="font-bold text-primary">₹${(item.amount||0).toFixed(2)}</td>
        <td style="width:35px;text-align:center"><span class="remove-row" onclick="SalesModule.removeLine(${i})" title="Remove">✕</span></td>
      </tr>
    `).join('');
  },

  navigateDropdown(event, dropEl) {
    if (!dropEl || !dropEl.classList.contains('open')) return false;
    const items = Array.from(dropEl.querySelectorAll('.autocomplete-item'));
    if (!items.length) return false;

    let currentIndex = items.findIndex(el => el.classList.contains('active'));

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();
      if (currentIndex >= 0) items[currentIndex].classList.remove('active');
      currentIndex = (currentIndex + 1) % items.length;
      items[currentIndex].classList.add('active');
      items[currentIndex].scrollIntoView({ block: 'nearest' });
      return true;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      if (currentIndex >= 0) items[currentIndex].classList.remove('active');
      currentIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
      items[currentIndex].classList.add('active');
      items[currentIndex].scrollIntoView({ block: 'nearest' });
      return true;
    }

    if (event.key === 'Enter') {
      if (currentIndex >= 0 && items[currentIndex]) {
        event.preventDefault();
        event.stopPropagation();
        items[currentIndex].click();
        return true;
      } else if (items.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        items[0].click();
        return true;
      }
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      dropEl.classList.remove('open');
      return true;
    }

    return false;
  },

  handleItemKeydown(event, lineIdx) {
    const drop = document.getElementById(`item-drop-${lineIdx}`);
    this.navigateDropdown(event, drop);
  },

  handlePartyKeydown(event) {
    const drop = document.getElementById('inv-party-drop');
    this.navigateDropdown(event, drop);
  },

  async searchItem(query, lineIdx) {
    const drop = document.getElementById(`item-drop-${lineIdx}`);
    if (!drop) return;
    if (!query || query.length < 1) { drop.classList.remove('open'); return; }
    const results = await ItemsModule.searchItems(query);
    if (!results.length) { drop.classList.remove('open'); return; }

    // Position directly under the input field being typed in
    const wrap = drop.parentElement;
    if (wrap) {
      const rect = wrap.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 220 && rect.top > 220) {
        drop.style.top = 'auto';
        drop.style.bottom = 'calc(100% + 2px)';
      } else {
        drop.style.top = 'calc(100% + 2px)';
        drop.style.bottom = 'auto';
      }
    }
    drop.innerHTML = results.map(i => {
      const descSnippet = i.description ? `<div style="font-size:0.72rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px;">${i.description}</div>` : '';
      return `
      <div class="autocomplete-item" onmousedown="SalesModule.selectItemById(${lineIdx}, ${i.id})" onclick="SalesModule.selectItemById(${lineIdx}, ${i.id})">
        <div style="font-weight:600;color:var(--text-primary);">${i.name}</div>
        ${descSnippet}
        <div style="display:flex;justify-content:space-between;gap:8px;font-size:0.75rem;color:var(--text-secondary);margin-top:2px;">
          <span>HSN: ${i.hsn || '-'}</span>
          <span>₹${(i.salePrice || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
          <span class="badge badge-primary" style="font-size:0.65rem">${i.gstRate || 0}% GST</span>
        </div>
      </div>`;
    }).join('');
    drop.classList.add('open');
  },

  async selectItemById(lineIdx, itemId) {
    const all = await db.getAll('items');
    const item = all.find(x => String(x.id) === String(itemId));
    if (item) {
      this.selectItem(lineIdx, item);
    }
  },

  selectItem(lineIdx, itemOrJson) {
    let item = itemOrJson;
    if (typeof itemOrJson === 'string') {
      try { item = JSON.parse(itemOrJson); } catch (e) { console.error(e); return; }
    }
    if (!item) return;
    const itemDesc = item.description || item.desc || '';
    this.lineItems[lineIdx] = {
      ...this.lineItems[lineIdx],
      itemId: item.id,
      name: item.name,
      desc: itemDesc,
      description: itemDesc,
      hsn: item.hsn || '',
      unit: item.unit || 'NOS',
      rate: item.salePrice || 0,
      gstRate: item.gstRate || 0,
      cess: item.cess || 0,
    };
    const nameEl = document.getElementById(`item-name-${lineIdx}`);
    if (nameEl) nameEl.value = item.name;
    const descEl = document.getElementById(`item-desc-${lineIdx}`);
    if (descEl) descEl.value = itemDesc;
    const hsnEl = document.getElementById(`item-hsn-${lineIdx}`);
    if (hsnEl) hsnEl.value = item.hsn || '';
    const rateEl = document.getElementById(`item-rate-${lineIdx}`);
    if (rateEl) rateEl.value = item.salePrice || 0;
    const gstEl = document.getElementById(`item-gst-${lineIdx}`);
    if (gstEl) gstEl.value = item.gstRate || 0;
    const unitEl = document.getElementById(`item-unit-${lineIdx}`);
    if (unitEl) unitEl.value = item.unit || 'NOS';
    const drop = document.getElementById(`item-drop-${lineIdx}`);
    if (drop) drop.classList.remove('open');
    this.updateLine(lineIdx);
  },

  updateLine(i) {
    const qty = parseFloat(document.getElementById(`item-qty-${i}`)?.value) || 0;
    const rate = parseFloat(document.getElementById(`item-rate-${i}`)?.value) || 0;
    const disc = parseFloat(document.getElementById(`item-disc-${i}`)?.value) || 0;
    const gst = parseFloat(document.getElementById(`item-gst-${i}`)?.value) || 0;
    const desc = document.getElementById(`item-desc-${i}`)?.value || '';
    const unit = document.getElementById(`item-unit-${i}`)?.value || 'NOS';
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
      desc,
      description: desc,
      hsn: document.getElementById(`item-hsn-${i}`)?.value || '',
      unit,
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
    const newIdx = this.lineItems.length - 1;
    setTimeout(() => {
      const el = document.getElementById(`item-name-${newIdx}`);
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 40);
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
    const invoices = await db.getAll('invoices');
    if (invoices && invoices.length > 0) {
      // Find latest non-cancelled invoice to continue numbering from
      const sorted = [...invoices].filter(i => i.invoiceNo && i.status !== 'cancelled').sort((a, b) => {
        const idA = Number(a.id) || 0;
        const idB = Number(b.id) || 0;
        if (idB !== idA) return idB - idA;
        const tA = new Date(a.createdAt || a.date).getTime() || 0;
        const tB = new Date(b.createdAt || b.date).getTime() || 0;
        return tB - tA;
      });

      if (sorted.length > 0) {
        const lastInv = sorted[0];
        const nextNo = this.incrementInvoiceNo(lastInv.invoiceNo);
        if (nextNo) return nextNo;
      }
    }

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

  incrementInvoiceNo(invNoStr) {
    if (!invNoStr) return null;
    const str = String(invNoStr).trim();
    // Matches prefix, last contiguous digit block, and any suffix
    const match = str.match(/^(.*?)(\d+)([^\d]*)$/);
    if (!match) return null;
    const prefix = match[1];
    const numStr = match[2];
    const suffix = match[3];
    const nextVal = parseInt(numStr, 10) + 1;
    const padded = String(nextVal).padStart(numStr.length, '0');
    return `${prefix}${padded}${suffix}`;
  },

  async save(status = 'confirmed') {
    const items = this.lineItems.filter(l => l.name && l.qty > 0);
    if (!items.length) { App.toast('Add at least one item', 'error'); return; }
    const partyName = document.getElementById('inv-party-name').value.trim();
    if (!partyName) { App.toast('Select a party', 'error'); return; }

    const invoiceNo = document.getElementById('inv-no').value.trim();
    if (!invoiceNo) { App.toast('Invoice number is required', 'error'); return; }

    const vehicleNo = document.getElementById('inv-vehicle-no')?.value.trim().toUpperCase() || '';
    const ewbNo = document.getElementById('inv-ewb-no')?.value.trim() || '';
    const dispatchThrough = document.getElementById('inv-dispatch-through')?.value.trim() || '';
    const lrNo = document.getElementById('inv-lr-no')?.value.trim() || '';
    const hasEWBToggle = document.getElementById('inv-ewb-toggle')?.checked;
    const hasEWB = Boolean(hasEWBToggle || ewbNo);

    // Duplicate invoice number warning (soft validation allowing user override)
    const allInvoices = await db.getAll('invoices');
    const dup = allInvoices.find(i => 
      String(i.invoiceNo).toLowerCase() === invoiceNo.toLowerCase() &&
      i.id !== this.currentInvoice?.id &&
      i.status !== 'cancelled'
    );
    if (dup) {
      if (!confirm(`Warning: Invoice number "${invoiceNo}" is already used for ${dup.partyName || 'another bill'}. Continue with this number?`)) {
        return;
      }
    }

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
      invoiceNo,
      date: document.getElementById('inv-date')?.value || getLocalDateString(),
      dueDate: document.getElementById('inv-due')?.value || '',
      partyId: this.selectedParty?.id || null,
      partyName,
      partyGSTIN: this.selectedParty?.gstin || '',
      partyState: this.selectedParty?.state || '',
      partyAddress: this.selectedParty?.address || '',
      partyCity: this.selectedParty?.city || '',
      partyPin: this.selectedParty?.pin || '',
      supplyType: this.isIGST() ? 'IGST' : 'CGST_SGST',
      narration: document.getElementById('inv-narration').value.trim(),
      vehicleNo,
      ewbNo,
      dispatchThrough,
      lrNo,
      hasEWB,
      hasEInvoice: document.getElementById('inv-einv-toggle').checked,
      items,
      taxableAmount: taxable,
      cgst, sgst, igst, cess,
      totalTax,
      roundOff,
      grandTotal: grand,
      status,
      fyear: App.company?.fyear || '2526',
      createdAt: this.currentInvoice?.createdAt || new Date().toISOString(),
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

    // Synchronize sequence so future invoices continue from this number
    const match = invoiceNo.match(/^(.*?)(\d+)([^\d]*)$/);
    if (match) {
      const num = parseInt(match[2], 10);
      if (!isNaN(num)) {
        await db.setSequence('invoice', num);
      }
    }

    App.navigate('sales');
    await this.render();
    return invoiceId;
  },

  async saveAndPrint(status = 'confirmed') {
    const invoiceId = await this.save(status);
    if (invoiceId) {
      await this.print(invoiceId);
    }
  },

  saveInvoice(status = 'confirmed') {
    return this.save(status);
  },

  printInvoice(id) {
    if (!id && this.currentInvoice?.id) id = this.currentInvoice.id;
    if (id) return this.print(id);
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
    const today = getLocalDateString();
    document.getElementById('pur-billno').value = '';
    document.getElementById('pur-date').value = today;
    document.getElementById('pur-supplier-name').value = '';
    document.getElementById('pur-narration').value = '';
    this.renderLineItems();
    this.calculateTotals();
    App.navigate('purchase-form');
  },

  emptyLine() {
    return { itemId: null, name: '', desc: '', description: '', hsn: '', qty: 1, unit: 'NOS', rate: 0, gstRate: 18, taxable: 0, cgst: 0, sgst: 0, igst: 0, amount: 0 };
  },

  renderLineItems() {
    const container = document.getElementById('pur-items-body');
    if (!container) return;
    const uomList = (typeof UOM_LIST !== 'undefined') ? UOM_LIST : [{ code: 'NOS', name: 'Numbers' }, { code: 'PCS', name: 'Pieces' }, { code: 'KGS', name: 'Kilograms' }];
    const gstRates = (typeof GST_RATES !== 'undefined') ? GST_RATES : [0, 5, 12, 18, 28];
    const uomOpts = uomList.map(u => `<option value="${u.code}">${u.code}</option>`).join('');
    const gstOpts = gstRates.map(r => `<option value="${r}">${r}%</option>`).join('');
    container.innerHTML = this.lineItems.map((item, i) => `
      <tr>
        <td style="min-width:35px;width:35px;text-align:center;color:var(--text-muted)">${i + 1}</td>
        <td style="min-width:240px; vertical-align:top;">
          <div class="autocomplete-wrap" style="position:relative; width:100%;">
            <input class="form-control" value="${item.name||''}" placeholder="Item/Service..." id="pur-item-${i}"
              oninput="PurchaseModule.searchItem(this.value,${i})"
              onkeydown="PurchaseModule.handleItemKeydown(event,${i})"
              autocomplete="off">
            <div class="autocomplete-dropdown" id="pur-drop-${i}" style="position:absolute; top:calc(100% + 2px); left:0; width:100%; min-width:280px; z-index:99999;"></div>
          </div>
          <input class="form-control form-control-sm" placeholder="Item description / details..."
            value="${item.desc || item.description || ''}"
            id="pur-desc-${i}"
            oninput="PurchaseModule.updateLine(${i})"
            style="margin-top:4px;font-size:0.75rem;padding:3px 6px;height:24px;border-color:var(--border);border-style:dashed;"
            title="Item Description (auto-filled from item master, freely changeable in this purchase)">
        </td>
        <td style="min-width:115px; width:115px;"><input class="form-control" id="pur-hsn-${i}" value="${item.hsn||''}" placeholder="HSN Code" oninput="PurchaseModule.updateLine(${i})" style="text-align:center; font-family:var(--font-mono); letter-spacing:0.5px;" title="HSN / SAC Code"></td>
        <td style="min-width:75px; width:75px;"><input class="form-control" id="pur-qty-${i}" type="number" step="0.001" value="${item.qty}" oninput="PurchaseModule.updateLine(${i})" style="text-align:right;"></td>
        <td style="min-width:100px; width:100px;"><select class="form-control" id="pur-unit-${i}" onchange="PurchaseModule.updateLine(${i})" style="font-weight:500;">${uomOpts.replace(`value="${item.unit||'NOS'}"`, `value="${item.unit||'NOS'}" selected`)}</select></td>
        <td style="min-width:115px; width:115px;"><input class="form-control" id="pur-rate-${i}" type="number" step="0.01" value="${item.rate}" oninput="PurchaseModule.updateLine(${i})" style="text-align:right; font-weight:600;" placeholder="0.00"></td>
        <td style="min-width:85px; width:85px;"><select class="form-control" id="pur-gst-${i}" onchange="PurchaseModule.updateLine(${i})">${gstOpts.replace(`value="${item.gstRate}"`, `value="${item.gstRate}" selected`)}</select></td>
        <td class="text-right font-semibold" style="min-width:95px" id="pur-taxable-${i}">₹${(item.taxable||0).toFixed(2)}</td>
        <td class="text-right font-bold text-primary" style="min-width:105px" id="pur-total-${i}">₹${(item.amount||0).toFixed(2)}</td>
        <td style="width:35px;text-align:center"><span class="remove-row" onclick="PurchaseModule.removeLine(${i})" title="Remove">✕</span></td>
      </tr>`).join('');
  },

  handleItemKeydown(event, idx) {
    const drop = document.getElementById(`pur-drop-${idx}`);
    SalesModule.navigateDropdown(event, drop);
  },

  handlePartyKeydown(event) {
    const drop = document.getElementById('pur-supplier-drop');
    SalesModule.navigateDropdown(event, drop);
  },

  async searchItem(query, idx) {
    const drop = document.getElementById(`pur-drop-${idx}`);
    if (!drop) return;
    if (!query) { drop.classList.remove('open'); return; }
    const results = await ItemsModule.searchItems(query);
    if (!results.length) { drop.classList.remove('open'); return; }

    const wrap = drop.parentElement;
    if (wrap) {
      const rect = wrap.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 220 && rect.top > 220) {
        drop.style.top = 'auto';
        drop.style.bottom = 'calc(100% + 2px)';
      } else {
        drop.style.top = 'calc(100% + 2px)';
        drop.style.bottom = 'auto';
      }
    }
    drop.innerHTML = results.map(i => {
      const descSnippet = i.description ? `<div style="font-size:0.72rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px;">${i.description}</div>` : '';
      return `
      <div class="autocomplete-item" onmousedown="PurchaseModule.selectItemById(${idx}, ${i.id})" onclick="PurchaseModule.selectItemById(${idx}, ${i.id})">
        <div style="font-weight:600;color:var(--text-primary);">${i.name}</div>
        ${descSnippet}
        <div style="display:flex;justify-content:space-between;gap:8px;font-size:0.75rem;color:var(--text-secondary);margin-top:2px;">
          <span>HSN: ${i.hsn || '-'}</span>
          <span>₹${(i.purchasePrice || i.salePrice || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
          <span class="badge badge-primary" style="font-size:0.65rem">${i.gstRate || 0}% GST</span>
        </div>
      </div>`;
    }).join('');
    drop.classList.add('open');
  },

  async selectItemById(idx, itemId) {
    const all = await db.getAll('items');
    const item = all.find(x => String(x.id) === String(itemId));
    if (item) {
      this.selectItem(idx, item);
    }
  },

  selectItem(idx, itemOrJson) {
    let item = itemOrJson;
    if (typeof itemOrJson === 'string') {
      try { item = JSON.parse(itemOrJson); } catch (e) { console.error(e); return; }
    }
    if (!item) return;
    const itemDesc = item.description || item.desc || '';
    const itemEl = document.getElementById(`pur-item-${idx}`);
    if (itemEl) itemEl.value = item.name;
    const descEl = document.getElementById(`pur-desc-${idx}`);
    if (descEl) descEl.value = itemDesc;
    const hsnEl = document.getElementById(`pur-hsn-${idx}`);
    if (hsnEl) hsnEl.value = item.hsn || '';
    const rateEl = document.getElementById(`pur-rate-${idx}`);
    if (rateEl) rateEl.value = item.purchasePrice || item.salePrice || 0;
    const gstEl = document.getElementById(`pur-gst-${idx}`);
    if (gstEl) gstEl.value = item.gstRate || 0;
    const unitEl = document.getElementById(`pur-unit-${idx}`);
    if (unitEl) unitEl.value = item.unit || 'NOS';
    const drop = document.getElementById(`pur-drop-${idx}`);
    if (drop) drop.classList.remove('open');
    this.lineItems[idx] = {
      ...this.lineItems[idx],
      itemId: item.id,
      name: item.name,
      desc: itemDesc,
      description: itemDesc,
      hsn: item.hsn || '',
      unit: item.unit || 'NOS',
      rate: item.purchasePrice || item.salePrice || 0,
      gstRate: item.gstRate || 0
    };
    this.updateLine(idx);
  },

  updateLine(i) {
    const qty = parseFloat(document.getElementById(`pur-qty-${i}`)?.value) || 0;
    const rate = parseFloat(document.getElementById(`pur-rate-${i}`)?.value) || 0;
    const gst = parseFloat(document.getElementById(`pur-gst-${i}`)?.value) || 0;
    const desc = document.getElementById(`pur-desc-${i}`)?.value || '';
    const unit = document.getElementById(`pur-unit-${i}`)?.value || 'NOS';
    const taxable = qty * rate;
    const gstAmt = taxable * gst / 100;
    const isIGST = (this.selectedParty?.state || '') !== (App.company?.state || '');
    this.lineItems[i] = {
      ...this.lineItems[i],
      name: document.getElementById(`pur-item-${i}`)?.value || '',
      desc,
      description: desc,
      hsn: document.getElementById(`pur-hsn-${i}`)?.value || '',
      unit,
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

  addLine() {
    this.lineItems.push(this.emptyLine());
    this.renderLineItems();
    this.calculateTotals();
    const newIdx = this.lineItems.length - 1;
    setTimeout(() => {
      const el = document.getElementById(`pur-item-${newIdx}`);
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 40);
  },
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
      date: document.getElementById('pur-date')?.value || getLocalDateString(),
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
