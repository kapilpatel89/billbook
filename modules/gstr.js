// ============================================================
// Pro Billbook - GSTR JSON Generator Module
// ============================================================

const GSTRModule = {
  async render() {
    // Stats
    const invoices = await db.getAll('invoices');
    const confirmed = invoices.filter(i => i.status === 'confirmed');
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const thisMonth = confirmed.filter(i => {
      const d = new Date(i.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('gstr-inv-count', confirmed.length);
    set('gstr-month-count', thisMonth.length);
    const monthTotal = thisMonth.reduce((s, i) => s + (i.grandTotal || 0), 0);
    set('gstr-month-total', `₹${monthTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}`);
  },

  getMonthOptions() {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const today = new Date();
    let opts = '';
    for (let y = today.getFullYear(); y >= today.getFullYear() - 1; y--) {
      for (let m = (y === today.getFullYear() ? today.getMonth() : 11); m >= (y === today.getFullYear() - 1 ? 3 : 0); m--) {
        const val = `${y}-${String(m+1).padStart(2,'0')}`;
        opts += `<option value="${val}">${months[m]} ${y}</option>`;
      }
    }
    return opts;
  },

  async generateGSTR1() {
    const period = document.getElementById('gstr1-period')?.value;
    if (!period) { App.toast('Select return period', 'error'); return; }
    const [yr, mo] = period.split('-');
    const from = `${yr}-${mo}-01`;
    const lastDay = new Date(parseInt(yr), parseInt(mo), 0).getDate();
    const to = `${yr}-${mo}-${lastDay}`;

    const invoices = await db.getAllByRange('invoices', 'date', from, to);
    const confirmed = invoices.filter(i => i.status === 'confirmed');
    const co = App.company;

    // B2B invoices (registered parties)
    const b2b = {};
    const b2cs = []; // unregistered < 2.5 lakh
    const b2cl = []; // unregistered > 2.5 lakh
    const exp = []; // exports
    const hsnSummary = {};
    const nilRated = { inter: { nil: 0, exmpt: 0, nonGST: 0 }, intra: { nil: 0, exmpt: 0, nonGST: 0 } };

    for (const inv of confirmed) {
      const party = inv.partyId ? await db.get('parties', inv.partyId) : null;
      const isIGST = inv.supplyType === 'IGST';
      const isReg = party?.gstin && party.gstin.length === 15;
      const isExport = party?.partyType === 'export';

      // HSN Summary
      for (const item of (inv.items || [])) {
        const key = `${item.hsn}_${item.gstRate}`;
        if (!hsnSummary[key]) hsnSummary[key] = { num: 0, hsnSc: item.hsn, uqc: item.unit || 'NOS', rt: item.gstRate, txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 };
        hsnSummary[key].num++;
        hsnSummary[key].txval += item.taxable || 0;
        hsnSummary[key].iamt += item.igst || 0;
        hsnSummary[key].camt += item.cgst || 0;
        hsnSummary[key].samt += item.sgst || 0;
        hsnSummary[key].csamt += item.cessAmt || 0;
      }

      if (isExport) {
        exp.push({
          exptyp: 'WOPAY',
          inum: inv.invoiceNo, idt: App.formatDateInv(inv.date),
          val: inv.grandTotal,
          sbpcode: '', sbnum: '', sbdt: '',
          itms: (inv.items || []).map(item => ({
            txval: item.taxable, rt: item.gstRate,
            iamt: item.igst || 0, csamt: item.cessAmt || 0,
          })),
        });
      } else if (isReg) {
        const gstin = party.gstin;
        if (!b2b[gstin]) b2b[gstin] = { ctin: gstin, inv: [] };
        b2b[gstin].inv.push({
          inum: inv.invoiceNo,
          idt: App.formatDateInv(inv.date),
          val: inv.grandTotal,
          pos: party.state || co.state,
          rchrg: 'N',
          inv_typ: 'R',
          itms: (inv.items || []).map(item => ({
            num: 1, itm_det: {
              txval: item.taxable, rt: item.gstRate,
              iamt: item.igst || 0, camt: item.cgst || 0,
              samt: item.sgst || 0, csamt: item.cessAmt || 0,
            }
          })),
        });
      } else {
        // Unregistered
        if (inv.grandTotal > 250000) {
          b2cl.push({
            pos: party?.state || co.state,
            inum: inv.invoiceNo, idt: App.formatDateInv(inv.date),
            val: inv.grandTotal,
            itms: (inv.items || []).map(item => ({
              num: 1, itm_det: { txval: item.taxable, rt: item.gstRate, iamt: item.igst || 0, csamt: item.cessAmt || 0 }
            })),
          });
        } else {
          // Aggregate in B2CS
          const pos = party?.state || co.state;
          (inv.items || []).forEach(item => {
            const key = `${pos}_${item.gstRate}`;
            const existing = b2cs.find(r => r._key === key);
            if (existing) {
              existing.txval += item.taxable || 0;
              existing.iamt += item.igst || 0;
              existing.camt += item.cgst || 0;
              existing.samt += item.sgst || 0;
            } else {
              b2cs.push({ _key: key, typ: 'OE', pos, rt: item.gstRate, txval: item.taxable||0, iamt: item.igst||0, camt: item.cgst||0, samt: item.sgst||0, csamt: 0 });
            }
          });
        }
      }
    }

    const b2csClean = b2cs.map(({ _key, ...rest }) => rest);
    const gstr1JSON = {
      version: '1.1',
      hash: 'hash',
      gstin: co?.gstin || '',
      fp: `${mo}${yr}`,
      gt: confirmed.reduce((s, i) => s + (i.grandTotal || 0), 0).toFixed(2),
      cur_gt: confirmed.reduce((s, i) => s + (i.grandTotal || 0), 0).toFixed(2),
      b2b: Object.values(b2b),
      b2cl,
      b2cs: b2csClean,
      exp,
      nil: {
        inv: [
          { sply_ty: 'INTRB2B', nil_amt: nilRated.inter.nil, expt_amt: nilRated.inter.exmpt, ngsup_amt: nilRated.inter.nonGST },
          { sply_ty: 'INTRAB2B', nil_amt: nilRated.intra.nil, expt_amt: nilRated.intra.exmpt, ngsup_amt: nilRated.intra.nonGST },
        ],
      },
      hsn: {
        data: Object.values(hsnSummary).map(h => ({
          ...h,
          txval: parseFloat(h.txval.toFixed(2)),
          iamt: parseFloat(h.iamt.toFixed(2)),
          camt: parseFloat(h.camt.toFixed(2)),
          samt: parseFloat(h.samt.toFixed(2)),
          csamt: parseFloat(h.csamt.toFixed(2)),
        })),
      },
    };

    this.downloadJSON(gstr1JSON, `GSTR1_${co?.gstin}_${mo}${yr}.json`);
    App.toast('GSTR-1 JSON downloaded!', 'success');
  },

  async generateGSTR3B() {
    const period = document.getElementById('gstr3b-period')?.value;
    if (!period) { App.toast('Select period', 'error'); return; }
    const [yr, mo] = period.split('-');
    const from = `${yr}-${mo}-01`;
    const lastDay = new Date(parseInt(yr), parseInt(mo), 0).getDate();
    const to = `${yr}-${mo}-${lastDay}`;
    const co = App.company;

    const invoices = await db.getAllByRange('invoices', 'date', from, to);
    const purchases = await db.getAllByRange('purchases', 'date', from, to);
    const confirmed = invoices.filter(i => i.status === 'confirmed');

    let outTaxableIGST = 0, outTaxableCGST = 0;
    let outIGST = 0, outCGST = 0, outSGST = 0, outCess = 0;
    let inTaxable = 0, inIGST = 0, inCGST = 0, inSGST = 0;

    for (const inv of confirmed) {
      outTaxableIGST += inv.supplyType === 'IGST' ? inv.taxableAmount || 0 : 0;
      outTaxableCGST += inv.supplyType !== 'IGST' ? inv.taxableAmount || 0 : 0;
      outIGST += inv.igst || 0;
      outCGST += inv.cgst || 0;
      outSGST += inv.sgst || 0;
      outCess += inv.cess || 0;
    }
    for (const pur of purchases) {
      inTaxable += pur.taxableAmount || 0;
      inIGST += pur.igst || 0;
      inCGST += pur.cgst || 0;
      inSGST += pur.sgst || 0;
    }

    const netIGST = outIGST - inIGST;
    const netCGST = outCGST - inCGST;
    const netSGST = outSGST - inSGST;

    const gstr3b = {
      gstin: co?.gstin || '',
      ret_period: `${mo}${yr}`,
      sup_details: {
        osup_det: { txval: parseFloat(outTaxableCGST.toFixed(2)), iamt: 0, camt: parseFloat(outCGST.toFixed(2)), samt: parseFloat(outSGST.toFixed(2)), csamt: parseFloat(outCess.toFixed(2)) },
        osup_zero: { txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 },
        osup_nil_exmp: { txval: 0 },
        isup_rev: { txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 },
        osup_nongst: { txval: 0 },
      },
      inter_sup: {
        unreg_details: [{ pos: co?.state || '27', txval: parseFloat(outTaxableIGST.toFixed(2)), iamt: parseFloat(outIGST.toFixed(2)) }],
        comp_details: [],
        uin_details: [],
      },
      itc_elg: {
        itc_avl: [
          { ty: 'IMPG', iamt: 0, camt: 0, samt: 0, csamt: 0 },
          { ty: 'IMPS', iamt: 0, camt: 0, samt: 0, csamt: 0 },
          { ty: 'ISRC', iamt: parseFloat(inIGST.toFixed(2)), camt: parseFloat(inCGST.toFixed(2)), samt: parseFloat(inSGST.toFixed(2)), csamt: 0 },
          { ty: 'ISD', iamt: 0, camt: 0, samt: 0, csamt: 0 },
          { ty: 'OTH', iamt: 0, camt: 0, samt: 0, csamt: 0 },
        ],
        itc_rev: [
          { ty: 'RUL_42_43', iamt: 0, camt: 0, samt: 0, csamt: 0 },
          { ty: 'OTH', iamt: 0, camt: 0, samt: 0, csamt: 0 },
        ],
        itc_net: { iamt: parseFloat(Math.max(0, inIGST).toFixed(2)), camt: parseFloat(Math.max(0, inCGST).toFixed(2)), samt: parseFloat(Math.max(0, inSGST).toFixed(2)), csamt: 0 },
        itc_inelg: [
          { ty: 'RUL_42_43', iamt: 0, camt: 0, samt: 0, csamt: 0 },
          { ty: 'OTH', iamt: 0, camt: 0, samt: 0, csamt: 0 },
        ],
      },
      intr_ltfee: {
        intr_details: { iamt: 0, camt: 0, samt: 0, csamt: 0 },
        fee_details: { iamt: 0, camt: 0, samt: 0, csamt: 0 },
      },
    };
    this.downloadJSON(gstr3b, `GSTR3B_${co?.gstin}_${mo}${yr}.json`);
    App.toast('GSTR-3B JSON downloaded!', 'success');
  },

  async generateGSTR9() {
    const fy = document.getElementById('gstr9-fy')?.value || '2526';
    const co = App.company;
    const yr = parseInt('20' + fy.substring(0, 2));
    const invoices = await db.getAll('invoices');
    const purchases = await db.getAll('purchases');
    const confirmed = invoices.filter(i => i.status === 'confirmed' && (i.fyear === fy || new Date(i.date).getFullYear() === yr || new Date(i.date).getFullYear() === yr + 1));

    let outTaxable = 0, outCGST = 0, outSGST = 0, outIGST = 0;
    let inTaxable = 0, inCGST = 0, inSGST = 0, inIGST = 0;
    for (const inv of confirmed) { outTaxable += inv.taxableAmount||0; outCGST += inv.cgst||0; outSGST += inv.sgst||0; outIGST += inv.igst||0; }
    for (const pur of purchases) { inTaxable += pur.taxableAmount||0; inCGST += pur.cgst||0; inSGST += pur.sgst||0; inIGST += pur.igst||0; }

    const gstr9 = {
      gstin: co?.gstin || '',
      ret_period: fy,
      pt4: {
        '4A': { iamt: parseFloat(outIGST.toFixed(2)), camt: parseFloat(outCGST.toFixed(2)), samt: parseFloat(outSGST.toFixed(2)), txval: parseFloat(outTaxable.toFixed(2)) },
        '4B': { iamt: 0, camt: 0, samt: 0, txval: 0 },
        '4C': { iamt: 0, camt: 0, samt: 0, txval: 0 },
        '4D': { iamt: 0, camt: 0, samt: 0, txval: 0 },
        '4E': { iamt: 0, camt: 0, samt: 0, txval: 0 },
        '4F': { iamt: 0, camt: 0, samt: 0, txval: 0 },
      },
      pt6: {
        '6A': { iamt: parseFloat(inIGST.toFixed(2)), camt: parseFloat(inCGST.toFixed(2)), samt: parseFloat(inSGST.toFixed(2)), txval: parseFloat(inTaxable.toFixed(2)) },
        '6B': { iamt: 0, camt: 0, samt: 0, txval: 0 },
        '6C': { iamt: 0, camt: 0, samt: 0, txval: 0 },
      },
    };
    this.downloadJSON(gstr9, `GSTR9_${co?.gstin}_${fy}.json`);
    App.toast('GSTR-9 Annual Return JSON downloaded!', 'success');
  },

  async previewGSTR1Summary() {
    const period = document.getElementById('gstr1-period')?.value;
    if (!period) { App.toast('Select a period', 'error'); return; }
    const [yr, mo] = period.split('-');
    const from = `${yr}-${mo}-01`;
    const lastDay = new Date(parseInt(yr), parseInt(mo), 0).getDate();
    const to = `${yr}-${mo}-${lastDay}`;
    const invoices = await db.getAllByRange('invoices', 'date', from, to);
    const confirmed = invoices.filter(i => i.status === 'confirmed');
    let b2bCnt = 0, b2bAmt = 0, b2cCnt = 0, b2cAmt = 0, totalTax = 0;
    for (const inv of confirmed) {
      const party = inv.partyId ? await db.get('parties', inv.partyId) : null;
      if (party?.gstin?.length === 15) { b2bCnt++; b2bAmt += inv.grandTotal||0; }
      else { b2cCnt++; b2cAmt += inv.grandTotal||0; }
      totalTax += inv.totalTax || 0;
    }
    const el = document.getElementById('gstr1-preview');
    if (el) el.innerHTML = `
      <div class="summary-grid">
        <div class="summary-item"><div class="summary-item-label">Total Invoices</div><div class="summary-item-value">${confirmed.length}</div></div>
        <div class="summary-item"><div class="summary-item-label">B2B (Registered)</div><div class="summary-item-value">${b2bCnt} | ₹${b2bAmt.toFixed(0)}</div></div>
        <div class="summary-item"><div class="summary-item-label">B2C (Unregistered)</div><div class="summary-item-value">${b2cCnt} | ₹${b2cAmt.toFixed(0)}</div></div>
        <div class="summary-item"><div class="summary-item-label">Total Tax Collected</div><div class="summary-item-value text-primary">₹${totalTax.toFixed(2)}</div></div>
      </div>`;
  },

  downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

// ============================================================
// E-Invoice Module
// ============================================================
const EInvoiceModule = {
  async generateJSON(inv) {
    const co = App.company;
    const party = inv.partyId ? await db.get('parties', inv.partyId) : null;
    const irn = this.generateIRN(inv, co);
    const ackNo = Date.now().toString().substring(0, 12);
    const ackDt = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const payload = {
      Version: '1.1',
      TranDtls: {
        TaxSch: 'GST', SupTyp: inv.supplyType === 'IGST' ? 'B2B' : 'B2B',
        RegRev: 'N', EcmGstin: null, IgstOnIntra: 'N',
      },
      DocDtls: {
        Typ: 'INV', No: inv.invoiceNo, Dt: App.formatDateInv(inv.date),
      },
      SellerDtls: {
        Gstin: co?.gstin || '', LglNm: co?.name || '',
        Addr1: co?.addr1 || '', Loc: co?.city || '',
        Pin: parseInt(co?.pin) || 0, Stcd: co?.state || '',
        Ph: co?.mobile || '', Em: co?.email || '',
      },
      BuyerDtls: {
        Gstin: party?.gstin || 'URP',
        LglNm: party?.name || inv.partyName || '',
        Pos: party?.state || co?.state || '',
        Addr1: party?.address || '', Loc: party?.city || '',
        Pin: parseInt(party?.pin) || 0, Stcd: party?.state || '',
        Ph: party?.mobile || '', Em: party?.email || '',
      },
      ItemList: (inv.items || []).map((item, i) => ({
        SlNo: String(i + 1),
        PrdDesc: item.name || '',
        IsServc: item.unit === 'NOS' ? 'N' : 'N',
        HsnCd: item.hsn || '',
        Barcde: null, Qty: item.qty, FreeQty: 0,
        Unit: item.unit || 'NOS',
        UnitPrice: item.rate, TotAmt: item.qty * item.rate,
        Discount: (item.discPct || 0) * item.qty * item.rate / 100,
        PreTaxVal: 0, AssAmt: item.taxable || 0,
        GstRt: item.gstRate || 0,
        IgstAmt: item.igst || 0, CgstAmt: item.cgst || 0, SgstAmt: item.sgst || 0,
        CesRt: 0, CesAmt: item.cessAmt || 0, CesNonAdvlAmt: 0,
        StateCesRt: 0, StateCesAmt: 0, StateCesNonAdvlAmt: 0,
        OthChrg: 0, TotItemVal: item.amount || 0,
      })),
      ValDtls: {
        AssVal: parseFloat((inv.taxableAmount || 0).toFixed(2)),
        CgstVal: parseFloat((inv.cgst || 0).toFixed(2)),
        SgstVal: parseFloat((inv.sgst || 0).toFixed(2)),
        IgstVal: parseFloat((inv.igst || 0).toFixed(2)),
        CesVal: parseFloat((inv.cess || 0).toFixed(2)),
        StCesVal: 0,
        Discount: 0, OthChrg: 0, RndOffAmt: parseFloat((inv.roundOff || 0).toFixed(2)),
        TotInvVal: parseFloat((inv.grandTotal || 0).toFixed(2)),
        TotInvValFc: 0,
      },
      PayDtls: {
        Nm: inv.partyName || '', Accdet: co?.accountNo || '',
        Mode: 'Credit', Fibbic: co?.ifsc || '',
        Payterm: co?.paymentTerms || '', Payin: 0,
        CrDay: 0, Dirdr: 0,
      },
      RefDtls: { InvRm: inv.narration || '', PrecDocDtls: [], TransDtls: [] },
      EwbDtls: null,
      IRN: irn, AckNo: ackNo, AckDt: ackDt, Status: 'ACT',
    };

    // Save e-invoice record
    const existing = await db.getByIndex('einvoices', 'invoiceId', inv.id);
    const eInvRecord = { invoiceId: inv.id, irn, ackNo, ackDt, payload: JSON.stringify(payload), createdAt: new Date().toISOString() };
    if (existing && existing.length) {
      await db.put('einvoices', { ...existing[0], ...eInvRecord });
    } else {
      await db.add('einvoices', eInvRecord);
    }

    // Show IRN modal
    document.getElementById('einv-modal-irn').textContent = irn;
    document.getElementById('einv-modal-ack').textContent = ackNo;
    document.getElementById('einv-modal-dt').textContent = ackDt;
    // Generate QR code
    const qrData = `${inv.invoiceNo}/${co?.gstin}/${party?.gstin || 'URD'}/${App.formatDateInv(inv.date)}/${inv.grandTotal?.toFixed(2)}/${irn}`;
    if (typeof QRCode !== 'undefined') {
      document.getElementById('einv-qr-container').innerHTML = '';
      new QRCode(document.getElementById('einv-qr-container'), {
        text: qrData, width: 150, height: 150,
        colorDark: '#000', colorLight: '#fff',
      });
    }
    document.getElementById('einv-json-preview').textContent = JSON.stringify(payload, null, 2);
    App.openModal('einvoice-modal');
  },

  generateIRN(inv, co) {
    // Deterministic hash-like string (in production this comes from IRP)
    const raw = `${co?.gstin || ''}${inv.invoiceNo}${inv.date}${inv.grandTotal?.toFixed(2)}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const absHash = Math.abs(hash).toString(16).padStart(8, '0');
    // Pad to 64 chars
    const base = (absHash + raw.replace(/[^a-fA-F0-9]/g, '')).toLowerCase();
    return base.padEnd(64, '0').substring(0, 64);
  },

  downloadJSON(inv) {
    const previewEl = document.getElementById('einv-json-preview');
    if (!previewEl) return;
    const data = previewEl.textContent;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `EInvoice_${inv || 'payload'}.json`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    App.toast('E-Invoice JSON downloaded!', 'success');
  }
};

// ============================================================
// E-Way Bill Module
// ============================================================
const EWayBillModule = {
  async generateForInvoice(invoiceId) {
    const inv = await db.get('invoices', invoiceId);
    if (!inv) return;
    const co = App.company;
    const party = inv.partyId ? await db.get('parties', inv.partyId) : null;
    document.getElementById('ewb-modal-body').innerHTML = `
      <div class="alert alert-info" style="margin-bottom:14px">
        Generating E-Way Bill for Invoice: <strong>${inv.invoiceNo}</strong> | Value: <strong>₹${inv.grandTotal?.toFixed(2)}</strong>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Supply Type</label>
          <select class="form-control" id="ewb-suptype">
            <option value="O">Outward</option>
            <option value="I">Inward</option>
          </select>
        </div>
        <div class="form-group">
          <label>Sub Type</label>
          <select class="form-control" id="ewb-subtype">
            <option value="S">Supply</option>
            <option value="I">Import</option>
            <option value="E">Export</option>
            <option value="J">Job Work</option>
          </select>
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Transporter GSTIN</label>
          <input class="form-control font-mono" id="ewb-trans-gstin" placeholder="22AAAAA0000A1Z5" style="text-transform:uppercase">
        </div>
        <div class="form-group">
          <label>Transporter Name</label>
          <input class="form-control" id="ewb-trans-name" placeholder="Transport Company Name">
        </div>
      </div>
      <div class="form-row-3">
        <div class="form-group">
          <label>Transport Mode</label>
          <select class="form-control" id="ewb-mode">
            <option value="1">🚛 Road</option>
            <option value="2">🚂 Rail</option>
            <option value="3">✈️ Air</option>
            <option value="4">🚢 Ship</option>
          </select>
        </div>
        <div class="form-group">
          <label>Vehicle Number</label>
          <input class="form-control" id="ewb-vehicle" placeholder="MH12AB1234" style="text-transform:uppercase">
        </div>
        <div class="form-group">
          <label>Distance (KM)</label>
          <input class="form-control" type="number" id="ewb-distance" placeholder="0">
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>From PIN Code</label>
          <input class="form-control" id="ewb-from-pin" value="${co?.pin||''}" placeholder="400001">
        </div>
        <div class="form-group">
          <label>To PIN Code</label>
          <input class="form-control" id="ewb-to-pin" value="${party?.pin||''}" placeholder="110001">
        </div>
      </div>
      <div class="form-group">
        <label>Dispatch From</label>
        <input class="form-control" id="ewb-from-addr" value="${co?.addr1||''}, ${co?.city||''}" placeholder="Full dispatch address">
      </div>
      <div class="form-group">
        <label>Ship To</label>
        <input class="form-control" id="ewb-to-addr" value="${party?.address||''}, ${party?.city||''}" placeholder="Full delivery address">
      </div>
      <input type="hidden" id="ewb-invoice-id" value="${invoiceId}">
    `;
    App.openModal('ewb-modal');
  },

  async save() {
    const invoiceId = parseInt(document.getElementById('ewb-invoice-id').value);
    const inv = await db.get('invoices', invoiceId);
    const co = App.company;
    const party = inv.partyId ? await db.get('parties', inv.partyId) : null;
    const transGSTIN = document.getElementById('ewb-trans-gstin').value.trim().toUpperCase();
    const vehicle = document.getElementById('ewb-vehicle').value.trim().toUpperCase();

    const ewbPayload = {
      supplyType: document.getElementById('ewb-suptype').value,
      subSupplyType: document.getElementById('ewb-subtype').value,
      docType: 'INV',
      docNo: inv.invoiceNo,
      docDate: App.formatDateInv(inv.date),
      fromGstin: co?.gstin || '',
      fromTrdName: co?.name || '',
      fromAddr1: co?.addr1 || '',
      fromPlace: co?.city || '',
      fromPincode: parseInt(co?.pin) || 0,
      fromStateCode: parseInt(co?.state) || 0,
      toGstin: party?.gstin || 'URP',
      toTrdName: party?.name || inv.partyName || '',
      toAddr1: party?.address || '',
      toPlace: party?.city || '',
      toPincode: parseInt(party?.pin) || 0,
      toStateCode: parseInt(party?.state) || 0,
      transactionType: 1,
      dispatchFromGSTIN: co?.gstin || '',
      dispatchFromTradeName: co?.name || '',
      shipToGSTIN: party?.gstin || 'URP',
      shipToTradeName: party?.name || '',
      totalValue: inv.taxableAmount || 0,
      cgstValue: inv.cgst || 0,
      sgstValue: inv.sgst || 0,
      igstValue: inv.igst || 0,
      cessValue: inv.cess || 0,
      cessNonAdvolValue: 0,
      otherValue: inv.roundOff || 0,
      totInvValue: inv.grandTotal || 0,
      transPortion: {
        transporterGSTIN: transGSTIN,
        transporterName: document.getElementById('ewb-trans-name').value.trim(),
        transMode: document.getElementById('ewb-mode').value,
        transDistance: parseInt(document.getElementById('ewb-distance').value) || 0,
        transporterDocNo: '',
        transporterDocDate: '',
        vehicleNo: vehicle,
        vehicleType: 'R',
      },
      itemList: (inv.items || []).map((item, i) => ({
        itemNo: i + 1,
        productName: item.name,
        productDesc: item.name,
        hsnCode: item.hsn,
        qtyUnit: item.unit || 'NOS',
        quantity: item.qty,
        taxableAmount: item.taxable,
        sgstRate: item.gstRate / 2,
        cgstRate: item.gstRate / 2,
        igstRate: 0,
        cessRate: 0,
      })),
    };

    await db.add('ewaybills', {
      invoiceId, payload: JSON.stringify(ewbPayload),
      vehicleNo: vehicle, transGSTIN,
      createdAt: new Date().toISOString(),
    });

    await db.put('invoices', { ...inv, hasEWB: true });

    // Download JSON
    GSTRModule.downloadJSON(ewbPayload, `EWayBill_${inv.invoiceNo}.json`);
    App.closeModal('ewb-modal');
    App.toast('E-Way Bill JSON generated and downloaded!', 'success');
  },
};
