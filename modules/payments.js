// ============================================================
// Pro Billbook - Payments Module
// ============================================================

const PaymentsModule = {
  async render() {
    const payments = await db.getAll('payments');
    payments.sort((a, b) => new Date(b.date) - new Date(a.date));
    const tbody = document.getElementById('payment-list-body');
    if (!tbody) return;
    if (!payments.length) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="table-empty"><div class="empty-icon">💰</div>No payment records yet.</div></td></tr>`;
      return;
    }
    tbody.innerHTML = payments.map(p => {
      const typeMap = {
        receipt: ['badge-success', '💰 Receipt'],
        payment: ['badge-danger', '💸 Payment'],
        journal: ['badge-info', '📔 Journal'],
      };
      const [cls, label] = typeMap[p.type] || ['badge-secondary', p.type];
      const modeMap = { cash: '💵 Cash', bank: '🏦 Bank', upi: '📱 UPI', cheque: '📋 Cheque' };
      return `<tr>
        <td>${App.formatDate(p.date)}</td>
        <td><span class="badge ${cls}">${label}</span></td>
        <td>${p.partyName || '-'}</td>
        <td>${modeMap[p.mode] || p.mode || '-'}</td>
        <td>${p.refNo || p.chequeNo || '-'}</td>
        <td>${p.narration || '-'}</td>
        <td class="text-right font-bold ${p.type==='receipt'?'text-success':'text-danger'}">₹${(p.amount||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
        <td>
          <div class="actions">
            <button class="btn btn-sm btn-secondary" onclick="PaymentsModule.print(${p.id})" title="Print">🖨️</button>
            <button class="btn btn-sm btn-danger" onclick="PaymentsModule.delete(${p.id})" title="Delete">🗑️</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  },

  showReceiptModal(invoice) {
    const outstanding = invoice.grandTotal || 0;
    document.getElementById('pay-modal-title').textContent = '💰 Receive Payment';
    document.getElementById('pay-modal-body').innerHTML = `
      <div class="alert alert-info" style="margin-bottom:14px">
        Invoice: <strong>${invoice.invoiceNo}</strong> | Party: <strong>${invoice.partyName}</strong>
        | Amount: <strong>₹${outstanding.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong>
      </div>
      <input type="hidden" id="pay-invoice-id" value="${invoice.id}">
      <input type="hidden" id="pay-party-id" value="${invoice.partyId||''}">
      <input type="hidden" id="pay-party-name" value="${invoice.partyName||''}">
      <input type="hidden" id="pay-type-hidden" value="receipt">
      ${this.paymentFormHTML(outstanding)}
    `;
    App.openModal('payment-modal');
  },

  showPaymentModal() {
    document.getElementById('pay-modal-title').textContent = '💸 Make Payment';
    document.getElementById('pay-modal-body').innerHTML = `
      <div class="form-group">
        <label>Supplier / Party <span class="req">*</span></label>
        <div class="autocomplete-wrap">
          <input class="form-control" id="pay-party-search" placeholder="Search supplier..." oninput="PaymentsModule.partySearch(this.value)">
          <div class="autocomplete-dropdown" id="pay-party-drop"></div>
        </div>
        <input type="hidden" id="pay-party-id">
        <input type="hidden" id="pay-party-name">
      </div>
      <input type="hidden" id="pay-invoice-id" value="">
      <input type="hidden" id="pay-type-hidden" value="payment">
      ${this.paymentFormHTML(0)}
    `;
    App.openModal('payment-modal');
  },

  showJournalModal() {
    document.getElementById('pay-modal-title').textContent = '📔 Journal Entry';
    document.getElementById('pay-modal-body').innerHTML = `
      <div class="form-row-2">
        <div class="form-group">
          <label>Dr Party</label>
          <div class="autocomplete-wrap">
            <input class="form-control" id="jnl-dr-party" placeholder="Debit party/account...">
            <div class="autocomplete-dropdown" id="jnl-dr-drop"></div>
          </div>
        </div>
        <div class="form-group">
          <label>Cr Party</label>
          <div class="autocomplete-wrap">
            <input class="form-control" id="jnl-cr-party" placeholder="Credit party/account...">
            <div class="autocomplete-dropdown" id="jnl-cr-drop"></div>
          </div>
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Date</label>
          <input class="form-control" id="jnl-date" type="date" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label>Amount (₹)</label>
          <input class="form-control" id="jnl-amount" type="number" step="0.01" placeholder="0.00">
        </div>
      </div>
      <div class="form-group">
        <label>Narration</label>
        <textarea class="form-control" id="jnl-narration" rows="2" placeholder="Journal entry narration..."></textarea>
      </div>
    `;
    App.openModal('payment-modal');
  },

  paymentFormHTML(outstanding) {
    return `
      <div class="form-row-2">
        <div class="form-group">
          <label>Date <span class="req">*</span></label>
          <input class="form-control" id="pay-date" type="date" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label>Amount (₹) <span class="req">*</span></label>
          <input class="form-control" id="pay-amount" type="number" step="0.01" value="${outstanding.toFixed(2)}" placeholder="0.00">
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Payment Mode</label>
          <select class="form-control" id="pay-mode" onchange="PaymentsModule.onModeChange()">
            <option value="cash">💵 Cash</option>
            <option value="bank" selected>🏦 Bank Transfer</option>
            <option value="upi">📱 UPI</option>
            <option value="cheque">📋 Cheque</option>
          </select>
        </div>
        <div class="form-group" id="pay-ref-wrap">
          <label>Reference / Txn ID</label>
          <input class="form-control" id="pay-ref" placeholder="UTR / Txn / Cheque No">
        </div>
      </div>
      <div id="pay-cheque-details" style="display:none">
        <div class="form-row-3">
          <div class="form-group">
            <label>Cheque Date</label>
            <input class="form-control" id="pay-chq-date" type="date">
          </div>
          <div class="form-group">
            <label>Bank Name</label>
            <input class="form-control" id="pay-chq-bank" placeholder="Bank name">
          </div>
          <div class="form-group">
            <label>Cheque Number</label>
            <input class="form-control" id="pay-chq-no" placeholder="Cheque number">
          </div>
        </div>
      </div>
      <div class="form-group">
        <label>Narration / Remarks</label>
        <textarea class="form-control" id="pay-narration" rows="2" placeholder="Payment narration..."></textarea>
      </div>
    `;
  },

  onModeChange() {
    const mode = document.getElementById('pay-mode')?.value;
    const chq = document.getElementById('pay-cheque-details');
    if (chq) chq.style.display = mode === 'cheque' ? '' : 'none';
  },

  async partySearch(query) {
    const drop = document.getElementById('pay-party-drop');
    if (!drop || !query) { drop?.classList.remove('open'); return; }
    const results = await PartiesModule.searchParties(query);
    drop.innerHTML = results.map(p => `
      <div class="autocomplete-item" onclick="PaymentsModule.setParty(${p.id},'${p.name.replace(/'/g,'')}')">
        <span class="hsn-code">${p.name}</span>
        <span class="hsn-desc">${p.gstin||''}</span>
      </div>`).join('');
    drop.classList.toggle('open', results.length > 0);
  },

  setParty(id, name) {
    document.getElementById('pay-party-id').value = id;
    document.getElementById('pay-party-name').value = name;
    const search = document.getElementById('pay-party-search');
    if (search) search.value = name;
    document.getElementById('pay-party-drop')?.classList.remove('open');
  },

  async save() {
    const amount = parseFloat(document.getElementById('pay-amount').value) || 0;
    if (!amount || amount <= 0) { App.toast('Enter a valid amount', 'error'); return; }
    const partyId = parseInt(document.getElementById('pay-party-id').value) || null;
    const partyName = document.getElementById('pay-party-name').value;
    const type = document.getElementById('pay-type-hidden').value;
    const mode = document.getElementById('pay-mode').value;
    const data = {
      type, date: document.getElementById('pay-date').value,
      partyId, partyName, amount, mode,
      refNo: document.getElementById('pay-ref')?.value?.trim() || '',
      chequeNo: document.getElementById('pay-chq-no')?.value?.trim() || '',
      chequeDate: document.getElementById('pay-chq-date')?.value || '',
      chequeBank: document.getElementById('pay-chq-bank')?.value?.trim() || '',
      narration: document.getElementById('pay-narration').value.trim(),
      invoiceId: parseInt(document.getElementById('pay-invoice-id').value) || null,
      createdAt: new Date().toISOString(),
    };
    await db.add('payments', data);
    if (partyId) {
      await db.addLedgerEntry({
        partyId, date: data.date,
        type: type === 'receipt' ? 'RECEIPT' : 'PAYMENT',
        refNo: data.refNo, narration: data.narration || `${type === 'receipt' ? 'Receipt' : 'Payment'} via ${mode}`,
        amount, side: type === 'receipt' ? 'CR' : 'DR',
      });
    }
    App.closeModal('payment-modal');
    App.toast(`${type === 'receipt' ? 'Receipt' : 'Payment'} of ₹${amount.toLocaleString('en-IN',{minimumFractionDigits:2})} recorded!`, 'success');
    await this.render();
  },

  async delete(id) {
    if (!confirm('Delete this payment record?')) return;
    await db.delete('payments', id);
    App.toast('Payment deleted', 'info');
    await this.render();
  },

  async print(id) {
    const p = await db.get('payments', id);
    if (!p) return;
    PrintModule.printPaymentReceipt(App.company, p);
  }
};

// ============================================================
// Ledger Module
// ============================================================
const LedgerModule = {
  async render() {
    const parties = await db.getAll('parties');
    const container = document.getElementById('ledger-party-list');
    if (!container) return;
    if (!parties.length) {
      container.innerHTML = `<div class="table-empty"><div class="empty-icon">📊</div>No parties. Add parties to view ledgers.</div>`;
      return;
    }
    container.innerHTML = parties.map(p => `
      <div class="party-card-compact" onclick="LedgerModule.viewParty(${p.id})">
        <div class="party-avatar">${(p.name||'?').charAt(0).toUpperCase()}</div>
        <div style="flex:1">
          <div class="font-semibold">${p.name}</div>
          <div class="text-xs text-muted">${p.gstin||'Unregistered'} | ${p.type||''}</div>
        </div>
        <div id="ledger-bal-${p.id}" class="font-semibold text-sm pulse">...</div>
      </div>`).join('');
    parties.forEach(p => this.loadBalance(p.id));
  },

  async loadBalance(pid) {
    const bal = await db.getPartyBalance(pid);
    const el = document.getElementById(`ledger-bal-${pid}`);
    if (!el) return;
    if (bal > 0) el.innerHTML = `<span class="text-danger">₹${Math.abs(bal).toFixed(0)} DR</span>`;
    else if (bal < 0) el.innerHTML = `<span class="text-success">₹${Math.abs(bal).toFixed(0)} CR</span>`;
    else el.innerHTML = `<span class="text-muted">Nil</span>`;
    el.classList.remove('pulse');
  },

  async viewParty(partyId) {
    await PartiesModule.viewLedger(partyId);
  },

  async renderDayBook() {
    const today = new Date().toISOString().split('T')[0];
    const from = document.getElementById('daybook-from')?.value || today;
    const to = document.getElementById('daybook-to')?.value || today;
    const entries = await db.getAllByRange('ledger', 'date', from, to);
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    const tbody = document.getElementById('daybook-body');
    if (!tbody) return;
    if (!entries.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No transactions in selected range</td></tr>`;
      return;
    }
    const partiesMap = {};
    const allParties = await db.getAll('parties');
    allParties.forEach(p => partiesMap[p.id] = p.name);
    let drTotal = 0, crTotal = 0;
    tbody.innerHTML = entries.map(e => {
      const dr = e.side === 'DR' ? e.amount : 0;
      const cr = e.side === 'CR' ? e.amount : 0;
      drTotal += dr; crTotal += cr;
      return `<tr>
        <td>${App.formatDate(e.date)}</td>
        <td>${partiesMap[e.partyId] || 'N/A'}</td>
        <td>${e.type}</td>
        <td>${e.narration||''}</td>
        <td class="text-right text-danger">${dr ? `₹${dr.toFixed(2)}` : ''}</td>
        <td class="text-right text-success">${cr ? `₹${cr.toFixed(2)}` : ''}</td>
      </tr>`;
    }).join('') + `<tr style="background:var(--bg-secondary);font-weight:700">
      <td colspan="4" class="text-right">Total:</td>
      <td class="text-right text-danger">₹${drTotal.toFixed(2)}</td>
      <td class="text-right text-success">₹${crTotal.toFixed(2)}</td>
    </tr>`;
  },
};
