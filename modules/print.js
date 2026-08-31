// ============================================================
// Pro Billbook - Print Module
// All print templates (Invoice 3-copy, Ledger, Receipt, etc.)
// ============================================================

const PrintModule = {
  // ---- MAIN INVOICE PRINT (3 copies) ----
  async printInvoice(co, inv, party) {
    const ewbData = inv.hasEWB ? (await db.getByIndex('ewaybills', 'invoiceId', inv.id))[0] : null;
    const eInvData = inv.hasEInvoice ? (await db.getByIndex('einvoices', 'invoiceId', inv.id))[0] : null;
    const copies = ['ORIGINAL FOR BUYER', 'DUPLICATE FOR TRANSPORTER', 'TRIPLICATE FOR SUPPLIER'];

    const printWin = window.open('', '_blank');
    printWin.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>Invoice ${inv.invoiceNo}</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',sans-serif;background:#fff;color:#000;font-size:11px}
        .inv-copy{width:210mm;min-height:297mm;background:#fff;padding:10mm;margin:0 auto 10mm;border:1px solid #ddd;position:relative;page-break-after:always}
        .inv-copy:last-child{page-break-after:auto}
        .header{display:flex;justify-content:space-between;align-items:flex-start}
        .co-name{font-family:'Outfit',sans-serif;font-size:20px;font-weight:800;color:#1a1f3e}
        .co-detail{font-size:9px;color:#555;margin-top:3px;line-height:1.6}
        .gstin-tag{background:#f0f4ff;border:1px solid #c7d2fe;padding:2px 6px;border-radius:3px;font-size:9px;font-weight:700;color:#3730a3;font-family:monospace}
        .inv-band{background:#1a1f3e;color:#f59e0b;text-align:center;padding:5px;font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;letter-spacing:0.08em;margin:8px 0;border-radius:3px}
        .copy-label{position:absolute;top:10mm;right:10mm;font-size:8px;color:#888;border:1px dashed #bbb;padding:2px 6px;border-radius:3px;font-style:italic}
        .party-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0}
        .party-box{border:1px solid #e2e8f0;padding:6px 8px;border-radius:4px}
        .party-lbl{font-size:8px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:3px}
        .party-name{font-size:12px;font-weight:700;color:#1a1f3e;font-family:'Outfit',sans-serif}
        .party-info{font-size:9px;color:#64748b;line-height:1.5}
        .meta-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:6px 0}
        .meta-box{background:#f8fafc;border:1px solid #e2e8f0;padding:4px 7px;border-radius:3px}
        .meta-lbl{font-size:7px;font-weight:700;text-transform:uppercase;color:#94a3b8}
        .meta-val{font-size:10px;font-weight:600;color:#1a1f3e}
        table{width:100%;border-collapse:collapse;font-size:10px}
        th{background:#1a1f3e;color:#f59e0b;padding:5px 6px;text-align:left;font-size:8.5px;text-transform:uppercase}
        th.r{text-align:right}
        td{padding:4px 6px;border-bottom:1px solid #f1f5f9;vertical-align:top}
        td.r{text-align:right}
        tr:nth-child(even) td{background:#f8fafc}
        tfoot td{font-weight:700;background:#f0f4f8!important;border-top:1px solid #cbd5e1}
        .totals-wrap{display:flex;justify-content:flex-end;margin-top:8px}
        .totals-table{min-width:240px;border:1px solid #e2e8f0;border-radius:4px;overflow:hidden}
        .tot-row{display:flex;justify-content:space-between;padding:4px 10px;font-size:10px;border-bottom:1px solid #f1f5f9}
        .tot-row:last-child{border-bottom:none;font-weight:700;background:#1a1f3e;color:#f59e0b;font-size:11px;padding:6px 10px}
        .amt-words{margin:8px 0;padding:6px 8px;background:#fff8e6;border:1px solid #fde68a;border-radius:4px;font-size:9px;font-weight:600}
        .bank-box{border:1px solid #e2e8f0;padding:6px 8px;border-radius:4px;font-size:9px;margin:6px 0}
        .bank-lbl{font-weight:700;color:#64748b;font-size:8px;text-transform:uppercase;margin-bottom:3px}
        .bank-row{display:flex;gap:16px;flex-wrap:wrap}
        .bank-item{display:flex;gap:4px}
        .bank-item .k{font-weight:700;color:#374151}
        .footer{display:flex;justify-content:space-between;align-items:flex-end;margin-top:10px;padding-top:6px;border-top:1px solid #e2e8f0}
        .sign{text-align:center}
        .sign-line{width:120px;height:1px;background:#6b7280;margin:28px auto 4px}
        .sign-name{font-size:9px;color:#6b7280;font-weight:600}
        .qr-wrap{text-align:center}
        .irn-code{font-size:7px;color:#94a3b8;margin-top:3px;word-break:break-all;max-width:180px;font-family:monospace}
        .terms{font-size:8px;color:#94a3b8;margin-top:6px;border-top:1px dashed #e2e8f0;padding-top:4px}
        .gst-breakup{margin:6px 0}
        .gst-breakup table th{background:#374151;font-size:8px}
        .gst-breakup table td{font-size:9px}
        /* EWB */
        .ewb-page{margin-top:8px;border:2px solid #1a1f3e;padding:8px;border-radius:4px}
        .ewb-band{background:#1a1f3e;color:#f59e0b;text-align:center;padding:4px;font-family:'Outfit',sans-serif;font-size:12px;font-weight:700;border-radius:2px;margin-bottom:6px}
        .ewb-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}
        .ewb-field{border:1px solid #e2e8f0;padding:4px;border-radius:2px}
        .ewb-k{font-size:7px;font-weight:700;text-transform:uppercase;color:#94a3b8}
        .ewb-v{font-size:10px;font-weight:600}
        @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{margin:0;size:A4}}
      </style>
    </head><body>`);

    // Generate all 3 copies
    for (let c = 0; c < 3; c++) {
      const isIGST = inv.supplyType === 'IGST';
      const rows = (inv.items || []).map((item, idx) => `<tr>
        <td>${idx + 1}</td>
        <td><strong>${item.name}</strong>${item.desc ? `<br><span style="font-size:8.5px;color:#64748b">${item.desc}</span>` : ''}</td>
        <td>${item.hsn || '-'}</td>
        <td class="r">${item.qty} ${item.unit || ''}</td>
        <td class="r">₹${(item.rate||0).toFixed(2)}</td>
        <td class="r">${item.discPct ? item.discPct + '%' : '-'}</td>
        <td class="r">₹${(item.taxable||0).toFixed(2)}</td>
        <td>${item.gstRate}%</td>
        ${isIGST
          ? `<td class="r">₹${(item.igst||0).toFixed(2)}</td>`
          : `<td class="r">₹${(item.cgst||0).toFixed(2)}<br>₹${(item.sgst||0).toFixed(2)}</td>`
        }
        <td class="r"><strong>₹${(item.amount||0).toFixed(2)}</strong></td>
      </tr>`).join('');

      const qrDataUrl = (eInvData && c === 0) ? this.getQRCodeDataURL(eInvData.irn || `${inv.invoiceNo}|${inv.date}|${inv.grandTotal}`) : '';
      const qrContent = qrDataUrl ? `
        <div class="qr-wrap">
          <img src="${qrDataUrl}" style="width:75px;height:75px;margin:0 auto;display:block">
          <div class="irn-code">IRN: ${eInvData.irn || ''}</div>
          <div style="font-size:7px;color:#94a3b8">ACK: ${eInvData.ackNo || ''}</div>
        </div>` : '';

      printWin.document.write(`
        <div class="inv-copy">
          <div class="copy-label">${copies[c]}</div>
          <div class="header">
            <div>
              ${co?.logo ? `<img src="${co.logo}" style="height:40px;margin-bottom:4px;display:block">` : ''}
              <div class="co-name">${co?.name || 'Your Company'}</div>
              <div class="co-detail">
                ${co?.addr1 || ''}, ${co?.city || ''}, ${INDIA_STATES.find(s=>s.code===co?.state)?.name||''} - ${co?.pin || ''}<br>
                📞 ${co?.mobile || ''} ${co?.email ? `| ✉️ ${co.email}` : ''}
              </div>
            </div>
            <div style="text-align:right">
              <span class="gstin-tag">GSTIN: ${co?.gstin || ''}</span>
              ${co?.pan ? `<div style="margin-top:4px;font-size:9px;color:#64748b">PAN: ${co.pan}</div>` : ''}
              ${co?.cin ? `<div style="font-size:9px;color:#64748b">CIN: ${co.cin}</div>` : ''}
            </div>
          </div>

          <div class="inv-band">TAX INVOICE</div>

          <div class="meta-grid">
            <div class="meta-box"><div class="meta-lbl">Invoice No</div><div class="meta-val">${inv.invoiceNo}</div></div>
            <div class="meta-box"><div class="meta-lbl">Invoice Date</div><div class="meta-val">${App.formatDate(inv.date)}</div></div>
            <div class="meta-box"><div class="meta-lbl">Due Date</div><div class="meta-val">${inv.dueDate ? App.formatDate(inv.dueDate) : '-'}</div></div>
            <div class="meta-box"><div class="meta-lbl">Supply Type</div><div class="meta-val">${isIGST ? 'Interstate (IGST)' : 'Intrastate (CGST+SGST)'}</div></div>
          </div>

          <div class="party-grid">
            <div class="party-box">
              <div class="party-lbl">Bill To</div>
              <div class="party-name">${inv.partyName || '-'}</div>
              <div class="party-info">
                ${inv.partyAddress || ''} ${inv.partyCity || ''}<br>
                ${inv.partyGSTIN ? `GSTIN: <strong>${inv.partyGSTIN}</strong>` : 'Unregistered'}
              </div>
            </div>
            <div class="party-box">
              <div class="party-lbl">Ship To</div>
              <div class="party-name">${inv.partyName || '-'}</div>
              <div class="party-info">
                ${inv.partyAddress || ''} ${inv.partyCity || ''}<br>
                ${inv.partyPin ? `PIN: ${inv.partyPin}` : ''}
              </div>
            </div>
          </div>

          <table>
            <thead><tr>
              <th>#</th><th>Item / Description</th><th>HSN</th>
              <th class="r">Qty</th><th class="r">Rate</th><th class="r">Disc</th>
              <th class="r">Taxable</th><th>GST%</th>
              ${isIGST ? '<th class="r">IGST</th>' : '<th class="r">CGST/SGST</th>'}
              <th class="r">Amount</th>
            </tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr>
              <td colspan="6" class="r"><strong>Total</strong></td>
              <td class="r"><strong>₹${(inv.taxableAmount||0).toFixed(2)}</strong></td>
              <td></td>
              <td class="r"><strong>₹${(inv.totalTax||0).toFixed(2)}</strong></td>
              <td class="r"><strong>₹${((inv.taxableAmount||0)+(inv.totalTax||0)).toFixed(2)}</strong></td>
            </tr></tfoot>
          </table>

          <!-- GST Breakup -->
          <div class="gst-breakup" style="margin:6px 0">
            <table>
              <thead><tr>
                <th>HSN</th><th>Taxable ₹</th>
                ${isIGST ? '<th>IGST %</th><th>IGST ₹</th>' : '<th>CGST %</th><th>CGST ₹</th><th>SGST %</th><th>SGST ₹</th>'}
                <th>Total Tax ₹</th>
              </tr></thead>
              <tbody>
                ${this.buildGSTBreakup(inv.items || [], isIGST)}
              </tbody>
            </table>
          </div>

          <div class="totals-wrap">
            <div class="totals-table">
              <div class="tot-row"><span>Taxable Amount</span><span>₹${(inv.taxableAmount||0).toFixed(2)}</span></div>
              ${!isIGST ? `<div class="tot-row"><span>CGST</span><span>₹${(inv.cgst||0).toFixed(2)}</span></div>
              <div class="tot-row"><span>SGST</span><span>₹${(inv.sgst||0).toFixed(2)}</span></div>` : ''}
              ${isIGST ? `<div class="tot-row"><span>IGST</span><span>₹${(inv.igst||0).toFixed(2)}</span></div>` : ''}
              ${inv.cess ? `<div class="tot-row"><span>Cess</span><span>₹${(inv.cess||0).toFixed(2)}</span></div>` : ''}
              ${inv.roundOff ? `<div class="tot-row"><span>Round Off</span><span>₹${(inv.roundOff||0).toFixed(2)}</span></div>` : ''}
              <div class="tot-row"><span>GRAND TOTAL</span><span>₹${(inv.grandTotal||0).toFixed(2)}</span></div>
            </div>
          </div>

          <div class="amt-words">Amount in Words: <strong>${App.amountToWords(inv.grandTotal || 0)}</strong></div>

          ${co?.bankName ? `<div class="bank-box">
            <div class="bank-lbl">Bank Details</div>
            <div class="bank-row">
              <div class="bank-item"><span class="k">Bank:</span> ${co.bankName}</div>
              <div class="bank-item"><span class="k">A/C:</span> ${co.accountNo || ''}</div>
              <div class="bank-item"><span class="k">IFSC:</span> ${co.ifsc || ''}</div>
              <div class="bank-item"><span class="k">Branch:</span> ${co.branch || ''}</div>
              ${co.upi ? `<div class="bank-item"><span class="k">UPI:</span> ${co.upi}</div>` : ''}
            </div>
          </div>` : ''}

          ${inv.narration ? `<div style="font-size:9px;color:#555;margin:4px 0">Narration: ${inv.narration}</div>` : ''}

          <div class="footer">
            <div>
              ${co?.terms ? `<div class="terms">Terms: ${co.terms}</div>` : ''}
            </div>
            <div style="display:flex;gap:16px;align-items:flex-end">
              ${qrContent}
              <div class="sign">
                <div class="sign-line"></div>
                <div class="sign-name">For ${co?.name || ''}</div>
                <div style="font-size:8px;color:#94a3b8">${co?.signName || 'Authorised Signatory'}</div>
              </div>
            </div>
          </div>

          ${ewbData && c === 0 ? this.buildEWBSection(JSON.parse(ewbData.payload || '{}'), inv) : ''}
        </div>`);
    }

    printWin.document.write(`
      <script>
        window.onload = function() {
          setTimeout(function(){ window.print(); }, 400);
        };
      <\/script>
    </body></html>`);
    printWin.document.close();
  },

  getQRCodeDataURL(text) {
    if (typeof QRCode === 'undefined') return '';
    try {
      const div = document.createElement('div');
      div.style.cssText = 'position:fixed;left:-9999px;top:-9999px;visibility:hidden;width:80px;height:80px;';
      document.body.appendChild(div);
      new QRCode(div, { text, width: 80, height: 80, colorDark: '#000', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.M });
      const canvas = div.querySelector('canvas');
      let dataUrl = '';
      if (canvas) {
        dataUrl = canvas.toDataURL('image/png');
      } else {
        const img = div.querySelector('img');
        if (img && img.src) dataUrl = img.src;
      }
      document.body.removeChild(div);
      return dataUrl;
    } catch(e) {
      console.warn('QR code generation failed:', e);
      return '';
    }
  },

  buildGSTBreakup(items, isIGST) {
    const map = {};
    for (const item of items) {
      const key = `${item.hsn}_${item.gstRate}`;
      if (!map[key]) map[key] = { hsn: item.hsn, rate: item.gstRate, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
      map[key].taxable += item.taxable || 0;
      map[key].cgst += item.cgst || 0;
      map[key].sgst += item.sgst || 0;
      map[key].igst += item.igst || 0;
    }
    return Object.values(map).map(h => `<tr>
      <td>${h.hsn}</td>
      <td>₹${h.taxable.toFixed(2)}</td>
      ${isIGST
        ? `<td>${h.rate}%</td><td>₹${h.igst.toFixed(2)}</td>`
        : `<td>${h.rate/2}%</td><td>₹${h.cgst.toFixed(2)}</td><td>${h.rate/2}%</td><td>₹${h.sgst.toFixed(2)}</td>`
      }
      <td>₹${(isIGST ? h.igst : h.cgst+h.sgst).toFixed(2)}</td>
    </tr>`).join('');
  },

  buildEWBSection(ewb, inv) {
    return `<div class="ewb-page">
      <div class="ewb-band">E-WAY BILL DETAILS</div>
      <div class="ewb-grid">
        <div class="ewb-field"><div class="ewb-k">Document No</div><div class="ewb-v">${ewb.docNo||inv.invoiceNo}</div></div>
        <div class="ewb-field"><div class="ewb-k">Document Date</div><div class="ewb-v">${ewb.docDate||''}</div></div>
        <div class="ewb-field"><div class="ewb-k">Supply Type</div><div class="ewb-v">Outward</div></div>
        <div class="ewb-field"><div class="ewb-k">From</div><div class="ewb-v">${ewb.fromPlace||''} - ${ewb.fromPincode||''}</div></div>
        <div class="ewb-field"><div class="ewb-k">To</div><div class="ewb-v">${ewb.toPlace||''} - ${ewb.toPincode||''}</div></div>
        <div class="ewb-field"><div class="ewb-k">Distance</div><div class="ewb-v">${ewb.transPortion?.transDistance||0} KM</div></div>
        <div class="ewb-field"><div class="ewb-k">Transporter</div><div class="ewb-v">${ewb.transPortion?.transporterName||'-'}</div></div>
        <div class="ewb-field"><div class="ewb-k">Vehicle No</div><div class="ewb-v">${ewb.transPortion?.vehicleNo||'-'}</div></div>
        <div class="ewb-field"><div class="ewb-k">Mode</div><div class="ewb-v">${['','Road','Rail','Air','Ship'][parseInt(ewb.transPortion?.transMode||1)]||'Road'}</div></div>
        <div class="ewb-field"><div class="ewb-k">Taxable Value</div><div class="ewb-v">₹${(ewb.totalValue||0).toFixed(2)}</div></div>
        <div class="ewb-field"><div class="ewb-k">IGST</div><div class="ewb-v">₹${(ewb.igstValue||0).toFixed(2)}</div></div>
        <div class="ewb-field"><div class="ewb-k">Total Invoice Value</div><div class="ewb-v">₹${(ewb.totInvValue||0).toFixed(2)}</div></div>
      </div>
    </div>`;
  },

  // ---- PAYMENT RECEIPT PRINT ----
  printPaymentReceipt(co, payment) {
    const win = window.open('', '_blank');
    const modeMap = { cash: 'Cash', bank: 'Bank Transfer', upi: 'UPI', cheque: 'Cheque' };
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Payment Receipt</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',sans-serif;padding:20mm;color:#000;font-size:12px}
        .header{display:flex;justify-content:space-between;margin-bottom:20px}
        .co{font-family:'Outfit',sans-serif;font-size:20px;font-weight:800;color:#1a1f3e}
        .band{background:#1a1f3e;color:#f59e0b;padding:8px 16px;border-radius:4px;font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;margin:12px 0;text-align:center}
        .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:11px}
        .lbl{color:#94a3b8;font-weight:600}
        .val{font-weight:600}
        .amt-box{background:#f0f9ff;border:2px solid #0ea5e9;border-radius:8px;padding:12px;text-align:center;margin:12px 0}
        .amt{font-family:'Outfit',sans-serif;font-size:24px;font-weight:800;color:#0369a1}
        .sign-area{display:flex;justify-content:space-between;margin-top:24px}
        .sign-box{text-align:center}
        .sign-line{width:120px;height:1px;background:#6b7280;margin:28px auto 4px}
        @media print{@page{margin:0;size:A5}}
      </style>
    </head><body>
      <div class="header">
        <div><div class="co">${co?.name || ''}</div><div style="font-size:9px;color:#666;margin-top:2px">${co?.addr1||''}, ${co?.city||''} | GSTIN: ${co?.gstin||''}</div></div>
        <div style="text-align:right;font-size:10px;color:#666">Receipt No: RCP-${payment.id || Date.now()}<br>${App.formatDate(payment.date)}</div>
      </div>
      <div class="band">PAYMENT RECEIPT</div>
      <div class="row"><span class="lbl">Received From</span><span class="val">${payment.partyName||'-'}</span></div>
      <div class="row"><span class="lbl">Payment Mode</span><span class="val">${modeMap[payment.mode]||payment.mode||'-'}</span></div>
      ${payment.refNo ? `<div class="row"><span class="lbl">Reference / UTR</span><span class="val">${payment.refNo}</span></div>` : ''}
      ${payment.chequeNo ? `<div class="row"><span class="lbl">Cheque No</span><span class="val">${payment.chequeNo} (${payment.chequeBank||''})</span></div>` : ''}
      ${payment.narration ? `<div class="row"><span class="lbl">Narration</span><span class="val">${payment.narration}</span></div>` : ''}
      <div class="amt-box">
        <div style="font-size:10px;color:#0369a1;font-weight:600;margin-bottom:4px">Amount Received</div>
        <div class="amt">₹${(payment.amount||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</div>
        <div style="font-size:10px;color:#0369a1;margin-top:4px">${App.amountToWords(payment.amount||0)}</div>
      </div>
      <div class="sign-area">
        <div class="sign-box"><div class="sign-line"></div><div style="font-size:9px;color:#666">Party Signature</div></div>
        <div class="sign-box"><div class="sign-line"></div><div style="font-size:9px;color:#666">For ${co?.name||''}<br>${co?.signName||'Authorised Signatory'}</div></div>
      </div>
    </body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 400);
  },

  // ---- PARTY LEDGER PRINT ----
  printPartyLedger(co, party, entries) {
    let balance = 0;
    let rows = '';
    for (const e of entries) {
      if (e.side === 'DR') balance += e.amount;
      else balance -= e.amount;
      rows += `<tr>
        <td>${App.formatDate(e.date)}</td>
        <td>${e.narration || e.type}</td>
        <td>${e.refNo || '-'}</td>
        <td style="text-align:right;color:${e.side==='DR'?'#dc2626':''}">${e.side === 'DR' ? `₹${e.amount.toFixed(2)}` : ''}</td>
        <td style="text-align:right;color:${e.side==='CR'?'#16a34a':''}">${e.side === 'CR' ? `₹${e.amount.toFixed(2)}` : ''}</td>
        <td style="text-align:right;font-weight:600">₹${Math.abs(balance).toFixed(2)} ${balance>=0?'DR':'CR'}</td>
      </tr>`;
    }
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Party Ledger - ${party?.name}</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',sans-serif;padding:15mm;font-size:11px}
        .co{font-family:'Outfit',sans-serif;font-size:18px;font-weight:800;color:#1a1f3e}
        .band{background:#1a1f3e;color:#f59e0b;padding:5px;font-family:'Outfit',sans-serif;font-size:12px;font-weight:700;margin:8px 0;text-align:center;border-radius:3px}
        table{width:100%;border-collapse:collapse}
        th{background:#1a1f3e;color:#f59e0b;padding:5px 8px;text-align:left;font-size:9px;text-transform:uppercase}
        td{padding:4px 8px;border-bottom:1px solid #f1f5f9;font-size:10px}
        .closing{font-weight:700;background:#fffbeb;border-top:2px solid #fde68a}
        @media print{@page{margin:0;size:A4}}
      </style>
    </head><body>
      <div style="display:flex;justify-content:space-between;margin-bottom:10px">
        <div><div class="co">${co?.name||''}</div><div style="font-size:9px;color:#666">${co?.gstin||''}</div></div>
        <div style="text-align:right;font-size:9px;color:#666">Print Date: ${new Date().toLocaleDateString('en-IN')}</div>
      </div>
      <div class="band">PARTY LEDGER STATEMENT</div>
      <div style="display:flex;gap:20px;margin:8px 0;font-size:10px">
        <div><strong>Party:</strong> ${party?.name||''}</div>
        <div><strong>GSTIN:</strong> ${party?.gstin||'Unregistered'}</div>
        <div><strong>City:</strong> ${party?.city||''}</div>
      </div>
      <table>
        <thead><tr><th>Date</th><th>Particulars</th><th>Ref#</th><th style="text-align:right">Debit</th><th style="text-align:right">Credit</th><th style="text-align:right">Balance</th></tr></thead>
        <tbody>
          ${rows || '<tr><td colspan="6" style="text-align:center;padding:16px;color:#94a3b8">No transactions found</td></tr>'}
          <tr class="closing">
            <td colspan="3"><strong>Closing Balance</strong></td>
            <td colspan="3" style="text-align:right;font-size:12px;color:${balance>=0?'#dc2626':'#16a34a'}">₹${Math.abs(balance).toFixed(2)} ${balance>=0?'DR':'CR'}</td>
          </tr>
        </tbody>
      </table>
    </body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 400);
  },

  // ---- STOCK REPORT PRINT ----
  async printStockReport() {
    const items = await db.getAll('items');
    const co = App.company;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Stock Report</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',sans-serif;padding:15mm;font-size:11px}
        .co{font-family:'Outfit',sans-serif;font-size:18px;font-weight:700;color:#1a1f3e}
        .band{background:#1a1f3e;color:#f59e0b;padding:5px;font-family:'Outfit',sans-serif;font-size:12px;font-weight:700;margin:8px 0;text-align:center;border-radius:3px}
        table{width:100%;border-collapse:collapse}
        th{background:#1a1f3e;color:#f59e0b;padding:5px 8px;text-align:left;font-size:9px;text-transform:uppercase}
        td{padding:4px 8px;border-bottom:1px solid #f1f5f9;font-size:10px}
        tr:nth-child(even) td{background:#f8fafc}
        .low{color:#f59e0b;font-weight:700}
        .out{color:#dc2626;font-weight:700}
        @media print{@page{margin:0;size:A4 landscape}}
      </style>
    </head><body>
      <div class="co">${co?.name||''}</div>
      <div class="band">STOCK REPORT — ${new Date().toLocaleDateString('en-IN')}</div>
      <table>
        <thead><tr><th>#</th><th>Item Name</th><th>HSN</th><th>Unit</th><th>Purchase Price</th><th>Sale Price</th><th style="text-align:right">Current Stock</th><th>Reorder Level</th><th>Status</th></tr></thead>
        <tbody>${items.map((item, i) => {
          const s = item.stock || 0;
          const r = item.reorderLevel || 0;
          let status = 'OK', cls = '';
          if (s <= 0) { status = 'Out of Stock'; cls = 'out'; }
          else if (r > 0 && s <= r) { status = 'Low Stock'; cls = 'low'; }
          return `<tr>
            <td>${i+1}</td>
            <td><strong>${item.name}</strong></td>
            <td>${item.hsn||'-'}</td>
            <td>${item.unit||'NOS'}</td>
            <td>₹${(item.purchasePrice||0).toFixed(2)}</td>
            <td>₹${(item.salePrice||0).toFixed(2)}</td>
            <td style="text-align:right">${s}</td>
            <td style="text-align:right">${r||'-'}</td>
            <td class="${cls}">${status}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 400);
  },
};
