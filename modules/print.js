// ============================================================
// Pro Billbook - Print Module
// All print templates (Tally Style Tax Invoice 3-copy, Ledger, Receipt, etc.)
// ============================================================

const PrintModule = {
  // ---- MAIN INVOICE PRINT (Tally Style Tax Invoice - 3 copies) ----
  async printInvoice(co, inv, party) {
    const ewbData = inv.hasEWB ? (await db.getByIndex('ewaybills', 'invoiceId', inv.id))[0] : null;
    const eInvData = inv.hasEInvoice ? (await db.getByIndex('einvoices', 'invoiceId', inv.id))[0] : null;
    const copies = ['ORIGINAL FOR RECIPIENT', 'DUPLICATE FOR TRANSPORTER', 'TRIPLICATE FOR SUPPLIER'];

    // State mapping helpers
    const getStateInfo = (codeOrName) => {
      if (!codeOrName) return { name: '', code: '' };
      const byCode = (typeof INDIA_STATES !== 'undefined' ? INDIA_STATES : []).find(
        s => s.code === String(codeOrName).padStart(2, '0') || s.code === String(codeOrName)
      );
      if (byCode) return byCode;
      const byName = (typeof INDIA_STATES !== 'undefined' ? INDIA_STATES : []).find(
        s => s.name.toLowerCase() === String(codeOrName).toLowerCase()
      );
      if (byName) return byName;
      return { name: codeOrName, code: '' };
    };

    const coState = getStateInfo(co?.state || co?.stateCode);
    const partyState = getStateInfo(inv.partyState || party?.state || party?.stateCode);

    // Number formatting helper
    const fmt = (n) => Number(n || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Date formatting helper for Tally style (DD-Mon-YYYY)
    const formatTallyDate = (dStr) => {
      if (!dStr) return '';
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
    };

    // Amount in words for Tally
    const tallyWords = (amt) => {
      let w = (typeof App !== 'undefined' && App.amountToWords) ? App.amountToWords(amt || 0) : `${amt}`;
      w = w.replace(/Rupees/gi, '').replace(/Only/gi, '').trim();
      return `${w} Only`;
    };

    const isIGST = inv.supplyType === 'IGST' || (!inv.cgst && !inv.sgst && inv.igst > 0);

    const printWin = window.open('', '_blank');
    printWin.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>Tax Invoice - ${inv.invoiceNo}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: Arial, Helvetica, sans-serif;
          background: #e2e8f0;
          color: #000;
          font-size: 9.5px;
          line-height: 1.35;
        }
        .tally-sheet {
          width: 210mm;
          min-height: 297mm;
          margin: 10mm auto;
          background: #fff;
          padding: 8mm 9mm;
          box-shadow: 0 4px 14px rgba(0,0,0,0.15);
          position: relative;
          page-break-after: always;
        }
        .tally-sheet:last-child {
          page-break-after: auto;
        }
        /* Top Header */
        .tally-tax-inv-title {
          text-align: center;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .tally-copy-title {
          text-align: center;
          font-size: 9.5px;
          font-weight: 700;
          color: #222;
          margin-bottom: 5px;
        }
        /* E-Invoice IRN header if present */
        .tally-irn-box {
          border: 1px solid #000;
          padding: 4px 6px;
          margin-bottom: 5px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 8px;
        }
        /* Master Box */
        .tally-box {
          border: 1.5px solid #000;
        }
        /* Two Column Header Grid */
        .tally-grid-2col {
          display: flex;
          border-bottom: 1px solid #000;
        }
        .tally-left-col {
          width: 52%;
          border-right: 1px solid #000;
          display: flex;
          flex-direction: column;
        }
        .tally-right-col {
          width: 48%;
        }
        .tally-cell-pad {
          padding: 5px 7px;
        }
        .tally-border-top {
          border-top: 1px solid #000;
        }
        .tally-company-name {
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 2px;
          letter-spacing: 0.3px;
        }
        .tally-party-name {
          font-size: 11px;
          font-weight: 800;
          margin-bottom: 2px;
        }
        .tally-sec-tag {
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          color: #444;
          margin-bottom: 2px;
        }
        .tally-addr-line {
          font-size: 9px;
          color: #111;
          margin-bottom: 2px;
          line-height: 1.3;
        }
        .tally-field {
          font-size: 9px;
          margin-top: 1.5px;
        }
        /* Meta Table in Right Column */
        .tally-meta-table {
          width: 100%;
          border-collapse: collapse;
          height: 100%;
        }
        .tally-meta-table td {
          border-bottom: 1px solid #000;
          border-right: 1px solid #000;
          padding: 3px 6px;
          vertical-align: top;
          font-size: 9px;
        }
        .tally-meta-table tr td:last-child {
          border-right: none;
        }
        .tally-meta-table tr:last-child td {
          border-bottom: none;
        }
        .tally-meta-lbl {
          font-size: 8px;
          color: #333;
          display: block;
        }
        .tally-meta-val {
          font-size: 9.5px;
          margin-top: 1px;
        }
        /* Items Table */
        .tally-items-table {
          width: 100%;
          border-collapse: collapse;
          border-bottom: 1px solid #000;
        }
        .tally-items-table th {
          border-bottom: 1px solid #000;
          border-right: 1px solid #000;
          padding: 4px 5px;
          font-size: 9px;
          font-weight: 800;
          background: #f8fafc;
        }
        .tally-items-table th:last-child {
          border-right: none;
        }
        .tally-items-table td {
          border-right: 1px solid #000;
          padding: 3px 6px;
          vertical-align: top;
          font-size: 9px;
        }
        .tally-items-table td:last-child {
          border-right: none;
        }
        .tally-items-table tfoot td {
          border-top: 1px solid #000;
          padding: 4px 6px;
          font-weight: bold;
          background: #fff;
        }
        /* Amount in Words Box */
        .tally-amt-words {
          padding: 5px 7px;
          border-bottom: 1px solid #000;
          background: #fff;
        }
        /* HSN Table */
        .tally-hsn-table {
          width: 100%;
          border-collapse: collapse;
          border-bottom: 1px solid #000;
        }
        .tally-hsn-table th {
          border-bottom: 1px solid #000;
          border-right: 1px solid #000;
          padding: 3px 5px;
          font-size: 8.5px;
          font-weight: 800;
          text-align: center;
          background: #f8fafc;
        }
        .tally-hsn-table th:last-child {
          border-right: none;
        }
        .tally-hsn-table td {
          border-bottom: 1px solid #000;
          border-right: 1px solid #000;
          padding: 3px 5px;
          font-size: 8.5px;
        }
        .tally-hsn-table td:last-child {
          border-right: none;
        }
        .tally-hsn-table tfoot td {
          border-top: 1px solid #000;
          border-bottom: none;
          font-weight: bold;
          background: #fff;
        }
        .tally-tax-words {
          padding: 4px 7px;
          border-bottom: 1px solid #000;
          font-size: 9px;
        }
        .tally-narration {
          padding: 4px 7px;
          border-bottom: 1px solid #000;
          font-size: 9px;
        }
        /* Footer Grid */
        .tally-footer-grid {
          display: flex;
        }
        .tally-ftr-left {
          width: 58%;
          border-right: 1px solid #000;
          padding: 5px 7px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .tally-ftr-right {
          width: 42%;
          padding: 5px 8px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: right;
        }
        .tally-bank-block .k {
          display: inline-block;
          width: 110px;
        }
        .tally-decl-block {
          margin-top: 5px;
          padding-top: 4px;
          border-top: 1px solid #000;
          font-size: 8px;
          color: #222;
          line-height: 1.25;
        }
        .tally-sign-for {
          font-size: 9.5px;
          text-align: right;
        }
        .tally-sign-space {
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tally-sign-title {
          font-size: 9.5px;
          font-weight: bold;
          text-align: right;
        }
        .tally-bottom-note {
          text-align: center;
          font-size: 8.5px;
          margin-top: 4px;
          color: #333;
        }

        @media print {
          body {
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4 portrait;
            margin: 5mm 5mm 5mm 5mm;
          }
          .tally-sheet {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: auto !important;
          }
        }
      </style>
    </head><body>`);

    // Generate all 3 copies
    for (let c = 0; c < 3; c++) {
      // Calculate total quantity and primary unit
      let totalQty = 0;
      let primaryUnit = 'NOS';
      (inv.items || []).forEach(item => {
        totalQty += Number(item.qty || 0);
        if (item.unit) primaryUnit = item.unit;
      });

      // Item rows
      const itemRows = (inv.items || []).map((item, idx) => `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td>
            <strong>${item.name}</strong>
            ${item.desc ? `<br><span style="font-size:8.5px;color:#333;">${item.desc}</span>` : ''}
          </td>
          <td style="text-align:center;">${item.hsn || '-'}</td>
          <td style="text-align:right;"><strong>${Number(item.qty||0).toFixed(2)} ${item.unit || ''}</strong></td>
          <td style="text-align:right;">${fmt(item.rate)}</td>
          <td style="text-align:center;">${item.unit || 'NOS'}</td>
          <td style="text-align:right;"><strong>${fmt(item.taxable || (item.qty * item.rate))}</strong></td>
        </tr>
      `).join('');

      // Tax ledger rows inside the items table (Tally ERP/Prime standard)
      const avgRate = (inv.items && inv.items[0]) ? inv.items[0].gstRate : 0;
      let taxLedgerRows = '';
      if (isIGST) {
        taxLedgerRows += `
          <tr>
            <td></td>
            <td style="padding-left:16px;"><em>Output IGST</em></td>
            <td></td>
            <td></td>
            <td style="text-align:right;">${avgRate}%</td>
            <td></td>
            <td style="text-align:right;">${fmt(inv.igst)}</td>
          </tr>
        `;
      } else {
        taxLedgerRows += `
          <tr>
            <td></td>
            <td style="padding-left:16px;"><em>Output CGST</em></td>
            <td></td>
            <td></td>
            <td style="text-align:right;">${(avgRate/2).toFixed(2)}%</td>
            <td></td>
            <td style="text-align:right;">${fmt(inv.cgst)}</td>
          </tr>
          <tr>
            <td></td>
            <td style="padding-left:16px;"><em>Output SGST</em></td>
            <td></td>
            <td></td>
            <td style="text-align:right;">${(avgRate/2).toFixed(2)}%</td>
            <td></td>
            <td style="text-align:right;">${fmt(inv.sgst)}</td>
          </tr>
        `;
      }
      if (inv.cess) {
        taxLedgerRows += `
          <tr>
            <td></td>
            <td style="padding-left:16px;"><em>Cess</em></td>
            <td></td><td></td><td></td><td></td>
            <td style="text-align:right;">${fmt(inv.cess)}</td>
          </tr>
        `;
      }
      if (inv.roundOff) {
        taxLedgerRows += `
          <tr>
            <td></td>
            <td style="padding-left:16px;"><em>Round Off</em></td>
            <td></td><td></td><td></td><td></td>
            <td style="text-align:right;">${fmt(inv.roundOff)}</td>
          </tr>
        `;
      }

      // Height spacer row to give authentic Tally accounting proportions
      const spacerHeight = Math.max(30, 160 - ((inv.items || []).length * 25));

      // QR Code data URL
      const qrDataUrl = (eInvData || inv.signedQr)
        ? this.getQRCodeDataURL(eInvData?.irn || inv.signedQr || `${inv.invoiceNo}|${inv.date}|${inv.grandTotal}`)
        : '';

      // E-Invoice IRN Top Block
      const irnHeader = eInvData ? `
        <div class="tally-irn-box">
          <div>
            <div><strong>IRN:</strong> ${eInvData.irn || '-'}</div>
            <div style="margin-top:2px;"><strong>Ack No:</strong> ${eInvData.ackNo || '-'} &nbsp;|&nbsp; <strong>Ack Date:</strong> ${eInvData.ackDate || '-'}</div>
          </div>
          ${qrDataUrl ? `<div><img src="${qrDataUrl}" style="width:50px;height:50px;display:block;"></div>` : ''}
        </div>
      ` : '';

      // Build HSN breakdown rows
      const hsnSummary = this.calculateHSNSummary(inv.items || [], isIGST);

      printWin.document.write(`
        <div class="tally-sheet">
          <!-- Centered TAX INVOICE Header -->
          <div class="tally-tax-inv-title">TAX INVOICE</div>
          <div class="tally-copy-title">(${copies[c]})</div>

          ${irnHeader}

          <!-- Main Tally Box -->
          <div class="tally-box">

            <!-- Two-Column Header -->
            <div class="tally-grid-2col">
              <!-- Left Column: Seller & Buyer -->
              <div class="tally-left-col">
                <!-- Seller (Company) -->
                <div class="tally-cell-pad">
                  <div class="tally-company-name">${(co?.name || 'Company Name').toUpperCase()}</div>
                  <div class="tally-addr-line">${co?.addr1 || ''} ${co?.city ? co.city + ',' : ''} ${coState.name} ${co?.pin ? '- ' + co.pin : ''}</div>
                  <div class="tally-field"><strong>GSTIN/UIN:</strong> ${co?.gstin || '-'}</div>
                  <div class="tally-field"><strong>State Name :</strong> ${coState.name || '-'}, <strong>Code :</strong> ${coState.code || '-'}</div>
                  <div class="tally-field"><strong>Contact :</strong> ${co?.mobile || '-'} ${co?.email ? ' | ' + co.email : ''}</div>
                  ${co?.pan ? `<div class="tally-field"><strong>PAN :</strong> ${co.pan}</div>` : ''}
                  ${co?.cin ? `<div class="tally-field"><strong>CIN :</strong> ${co.cin}</div>` : ''}
                </div>

                <!-- Buyer (Bill to) -->
                <div class="tally-border-top tally-cell-pad" style="flex:1;">
                  <div class="tally-sec-tag">Buyer (Bill to)</div>
                  <div class="tally-party-name">${inv.partyName || '-'}</div>
                  <div class="tally-addr-line">${inv.partyAddress || party?.address || ''} ${inv.partyCity || party?.city ? (inv.partyCity || party?.city) + ',' : ''} ${partyState.name} ${inv.partyPin ? '- ' + inv.partyPin : ''}</div>
                  <div class="tally-field"><strong>GSTIN/UIN   :</strong> ${inv.partyGSTIN || party?.gstin || 'Unregistered'}</div>
                  <div class="tally-field"><strong>State Name  :</strong> ${partyState.name || '-'}, <strong>Code :</strong> ${partyState.code || '-'}</div>
                </div>
              </div>

              <!-- Right Column: Meta Details Grid -->
              <div class="tally-right-col">
                <table class="tally-meta-table">
                  <tr>
                    <td style="width:50%;">
                      <span class="tally-meta-lbl">Invoice No.</span>
                      <div class="tally-meta-val"><strong>${inv.invoiceNo}</strong></div>
                    </td>
                    <td style="width:50%;">
                      <span class="tally-meta-lbl">Dated</span>
                      <div class="tally-meta-val"><strong>${formatTallyDate(inv.date)}</strong></div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span class="tally-meta-lbl">Delivery Note</span>
                      <div class="tally-meta-val">${inv.deliveryNote || '-'}</div>
                    </td>
                    <td>
                      <span class="tally-meta-lbl">Mode/Terms of Payment</span>
                      <div class="tally-meta-val">${inv.paymentTerms ? 'Credit ' + inv.paymentTerms + ' Days' : (inv.dueDate ? 'Due: ' + formatTallyDate(inv.dueDate) : 'Immediate')}</div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span class="tally-meta-lbl">Supplier's Ref.</span>
                      <div class="tally-meta-val">${inv.supplierRef || '-'}</div>
                    </td>
                    <td>
                      <span class="tally-meta-lbl">Other Reference(s)</span>
                      <div class="tally-meta-val">${inv.otherRef || '-'}</div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span class="tally-meta-lbl">Buyer's Order No.</span>
                      <div class="tally-meta-val">${inv.orderNo || '-'}</div>
                    </td>
                    <td>
                      <span class="tally-meta-lbl">Dated</span>
                      <div class="tally-meta-val">${inv.orderDate ? formatTallyDate(inv.orderDate) : '-'}</div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span class="tally-meta-lbl">Dispatch Doc No.</span>
                      <div class="tally-meta-val">${inv.dispatchDocNo || '-'}</div>
                    </td>
                    <td>
                      <span class="tally-meta-lbl">Delivery Note Date</span>
                      <div class="tally-meta-val">${inv.deliveryDate ? formatTallyDate(inv.deliveryDate) : '-'}</div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span class="tally-meta-lbl">Dispatched through</span>
                      <div class="tally-meta-val">${inv.dispatchThrough || (ewbData ? 'Road' : '-') || '-'}</div>
                    </td>
                    <td>
                      <span class="tally-meta-lbl">Destination</span>
                      <div class="tally-meta-val">${inv.destination || inv.partyCity || party?.city || '-'}</div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span class="tally-meta-lbl">Bill of Lading/LR-RR No.</span>
                      <div class="tally-meta-val">${inv.lrNo || '-'}</div>
                    </td>
                    <td>
                      <span class="tally-meta-lbl">Motor Vehicle No.</span>
                      <div class="tally-meta-val">${inv.vehicleNo || (ewbData?.transPortion?.vehicleNo) || '-'}</div>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2">
                      <span class="tally-meta-lbl">Terms of Delivery</span>
                      <div class="tally-meta-val">${inv.termsOfDelivery || co?.terms || '-'}</div>
                    </td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- Items Table (Tally Accounting Voucher Format) -->
            <table class="tally-items-table">
              <thead>
                <tr>
                  <th style="width:32px; text-align:center;">Sl<br>No.</th>
                  <th style="text-align:left;">Description of Goods</th>
                  <th style="width:70px; text-align:center;">HSN/SAC</th>
                  <th style="width:85px; text-align:right;">Quantity</th>
                  <th style="width:75px; text-align:right;">Rate</th>
                  <th style="width:45px; text-align:center;">per</th>
                  <th style="width:95px; text-align:right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
                ${taxLedgerRows}
                <tr style="height:${spacerHeight}px;">
                  <td style="border-right:1px solid #000;"></td>
                  <td style="border-right:1px solid #000;"></td>
                  <td style="border-right:1px solid #000;"></td>
                  <td style="border-right:1px solid #000;"></td>
                  <td style="border-right:1px solid #000;"></td>
                  <td style="border-right:1px solid #000;"></td>
                  <td></td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="text-align:right; font-weight:bold;">Total</td>
                  <td style="text-align:right; font-weight:bold;">${totalQty.toFixed(2)} ${primaryUnit}</td>
                  <td></td>
                  <td></td>
                  <td style="text-align:right; font-weight:bold; font-size:10.5px;">₹ ${fmt(inv.grandTotal)}</td>
                </tr>
              </tfoot>
            </table>

            <!-- Amount in Words -->
            <div class="tally-amt-words">
              <span style="float:right; font-size:9px; font-weight:bold; color:#444;">E. & O.E</span>
              <span style="font-size:8.5px; text-transform:uppercase; color:#333;">Amount Chargeable (in words):</span><br>
              <strong style="font-size:10px;">INR ${tallyWords(inv.grandTotal)}</strong>
            </div>

            <!-- HSN/SAC Tax Summary Table (Signature Tally GST Breakdown) -->
            <table class="tally-hsn-table">
              <thead>
                ${isIGST ? `
                  <tr>
                    <th rowspan="2" style="width:90px; text-align:center;">HSN/SAC</th>
                    <th rowspan="2" style="width:110px; text-align:right;">Taxable<br>Value</th>
                    <th colspan="2" style="text-align:center;">Integrated Tax</th>
                    <th rowspan="2" style="width:110px; text-align:right;">Total<br>Tax Amount</th>
                  </tr>
                  <tr>
                    <th style="width:65px; text-align:center;">Rate</th>
                    <th style="width:95px; text-align:right;">Amount</th>
                  </tr>
                ` : `
                  <tr>
                    <th rowspan="2" style="width:90px; text-align:center;">HSN/SAC</th>
                    <th rowspan="2" style="width:100px; text-align:right;">Taxable<br>Value</th>
                    <th colspan="2" style="text-align:center;">Central Tax</th>
                    <th colspan="2" style="text-align:center;">State Tax</th>
                    <th rowspan="2" style="width:100px; text-align:right;">Total<br>Tax Amount</th>
                  </tr>
                  <tr>
                    <th style="width:55px; text-align:center;">Rate</th>
                    <th style="width:80px; text-align:right;">Amount</th>
                    <th style="width:55px; text-align:center;">Rate</th>
                    <th style="width:80px; text-align:right;">Amount</th>
                  </tr>
                `}
              </thead>
              <tbody>
                ${hsnSummary.rowsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td style="text-align:right; font-weight:bold;">Total</td>
                  <td style="text-align:right; font-weight:bold;">₹ ${fmt(hsnSummary.totalTaxable)}</td>
                  ${isIGST ? `
                    <td></td>
                    <td style="text-align:right; font-weight:bold;">₹ ${fmt(hsnSummary.totalIGST)}</td>
                  ` : `
                    <td></td>
                    <td style="text-align:right; font-weight:bold;">₹ ${fmt(hsnSummary.totalCGST)}</td>
                    <td></td>
                    <td style="text-align:right; font-weight:bold;">₹ ${fmt(hsnSummary.totalSGST)}</td>
                  `}
                  <td style="text-align:right; font-weight:bold;">₹ ${fmt(hsnSummary.totalTax)}</td>
                </tr>
              </tfoot>
            </table>

            <!-- Tax Amount in Words -->
            <div class="tally-tax-words">
              Tax Amount (in words) : <strong>INR ${tallyWords(hsnSummary.totalTax)}</strong>
            </div>

            ${inv.narration ? `<div class="tally-narration"><strong>Remarks:</strong> ${inv.narration}</div>` : ''}

            <!-- Bottom Section: Bank Details & Signatory -->
            <div class="tally-footer-grid">
              <div class="tally-ftr-left">
                <div class="tally-bank-block">
                  <div style="font-weight:bold; text-decoration:underline; margin-bottom:3px;">Company's Bank Details</div>
                  <div><span class="k">Bank Name</span> : ${co?.bankName || '-'}</div>
                  <div><span class="k">A/c No.</span> : <strong>${co?.accountNo || '-'}</strong></div>
                  <div><span class="k">Branch & IFS Code</span> : ${co?.branch || ''} & <strong>${co?.ifsc || ''}</strong></div>
                  ${co?.upi ? `<div><span class="k">UPI ID</span> : ${co.upi}</div>` : ''}
                </div>
                ${co?.pan ? `<div style="margin-top:4px; padding-top:2px; border-top:1px dashed #999;"><strong>Company's PAN :</strong> ${co.pan}</div>` : ''}
                <div class="tally-decl-block">
                  <div style="font-weight:bold; margin-bottom:2px;">Declaration:</div>
                  <div>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
                </div>
              </div>

              <div class="tally-ftr-right">
                <div class="tally-sign-for">for <strong>${(co?.name || '').toUpperCase()}</strong></div>
                <div class="tally-sign-space">
                  ${qrDataUrl ? `<img src="${qrDataUrl}" style="width:65px; height:65px; margin:2px auto; display:block;">` : ''}
                </div>
                <div class="tally-sign-title">Authorised Signatory</div>
              </div>
            </div>

          </div> <!-- End tally-box -->

          <div class="tally-bottom-note">This is a Computer Generated Invoice</div>
        </div>
      `);
    }

    // Optional E-Way Bill Section
    if (ewbData) {
      printWin.document.write(this.buildEWBSection(JSON.parse(ewbData.payload || '{}'), inv));
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

  // Calculate HSN summary for Tally format
  calculateHSNSummary(items, isIGST) {
    const map = {};
    let totalTaxable = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalTax = 0;

    const fmt = (n) => Number(n || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    for (const item of items) {
      const hsn = item.hsn || 'OTHERS';
      const rate = Number(item.gstRate || 0);
      const key = `${hsn}_${rate}`;

      if (!map[key]) {
        map[key] = {
          hsn,
          rate,
          taxable: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          totalTax: 0,
        };
      }

      const taxable = Number(item.taxable || 0);
      const cgst = Number(item.cgst || 0);
      const sgst = Number(item.sgst || 0);
      const igst = Number(item.igst || 0);
      const tax = isIGST ? igst : (cgst + sgst);

      map[key].taxable += taxable;
      map[key].cgst += cgst;
      map[key].sgst += sgst;
      map[key].igst += igst;
      map[key].totalTax += tax;

      totalTaxable += taxable;
      totalCGST += cgst;
      totalSGST += sgst;
      totalIGST += igst;
      totalTax += tax;
    }

    const rowsHtml = Object.values(map).map(h => {
      if (isIGST) {
        return `
          <tr>
            <td style="text-align:center;">${h.hsn}</td>
            <td style="text-align:right;">${fmt(h.taxable)}</td>
            <td style="text-align:center;">${h.rate}%</td>
            <td style="text-align:right;">${fmt(h.igst)}</td>
            <td style="text-align:right;"><strong>${fmt(h.totalTax)}</strong></td>
          </tr>
        `;
      } else {
        return `
          <tr>
            <td style="text-align:center;">${h.hsn}</td>
            <td style="text-align:right;">${fmt(h.taxable)}</td>
            <td style="text-align:center;">${(h.rate / 2).toFixed(2)}%</td>
            <td style="text-align:right;">${fmt(h.cgst)}</td>
            <td style="text-align:center;">${(h.rate / 2).toFixed(2)}%</td>
            <td style="text-align:right;">${fmt(h.sgst)}</td>
            <td style="text-align:right;"><strong>${fmt(h.totalTax)}</strong></td>
          </tr>
        `;
      }
    }).join('');

    return {
      rowsHtml,
      totalTaxable,
      totalCGST,
      totalSGST,
      totalIGST,
      totalTax,
    };
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

  buildEWBSection(ewb, inv) {
    return `<div class="tally-sheet" style="page-break-before:always;">
      <div class="tally-tax-inv-title">E-WAY BILL REPORT</div>
      <div class="tally-copy-title">(Transporter Copy)</div>
      <div class="tally-box" style="padding:10px;">
        <div style="font-weight:bold;font-size:12px;margin-bottom:8px;border-bottom:1px solid #000;padding-bottom:4px;">PART-A (Vehicle & Goods Information)</div>
        <table class="tally-meta-table" style="border:1px solid #000;margin-bottom:10px;">
          <tr>
            <td><strong>Document No:</strong> ${ewb.docNo || inv.invoiceNo}</td>
            <td><strong>Document Date:</strong> ${ewb.docDate || ''}</td>
            <td><strong>Supply Type:</strong> Outward (Supply)</td>
          </tr>
          <tr>
            <td><strong>From:</strong> ${ewb.fromPlace || ''} (${ewb.fromPincode || ''})</td>
            <td><strong>To:</strong> ${ewb.toPlace || ''} (${ewb.toPincode || ''})</td>
            <td><strong>Distance:</strong> ${ewb.transPortion?.transDistance || 0} KM</td>
          </tr>
          <tr>
            <td><strong>Transporter Name:</strong> ${ewb.transPortion?.transporterName || '-'}</td>
            <td><strong>Transporter ID:</strong> ${ewb.transPortion?.transporterId || '-'}</td>
            <td><strong>Vehicle No:</strong> ${ewb.transPortion?.vehicleNo || '-'}</td>
          </tr>
          <tr>
            <td><strong>Mode:</strong> ${['','Road','Rail','Air','Ship'][parseInt(ewb.transPortion?.transMode||1)] || 'Road'}</td>
            <td><strong>Taxable Value:</strong> ₹${Number(ewb.totalValue || inv.taxableAmount || 0).toFixed(2)}</td>
            <td><strong>Total Invoice Value:</strong> ₹${Number(ewb.totInvValue || inv.grandTotal || 0).toFixed(2)}</td>
          </tr>
        </table>
      </div>
    </div>`;
  },

  // ---- PAYMENT RECEIPT PRINT ----
  printPaymentReceipt(co, payment) {
    const win = window.open('', '_blank');
    const modeMap = { cash: 'Cash', bank: 'Bank Transfer', upi: 'UPI', cheque: 'Cheque' };
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Payment Receipt</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;padding:15mm;color:#000;font-size:11px}
        .receipt-box{border:1.5px solid #000;padding:12px}
        .header{display:flex;justify-content:space-between;border-bottom:1px solid #000;padding-bottom:8px;margin-bottom:10px}
        .co{font-size:16px;font-weight:bold;text-transform:uppercase}
        .band{text-align:center;font-size:13px;font-weight:bold;margin:8px 0;letter-spacing:1px}
        .row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dotted #ccc;font-size:10px}
        .lbl{font-weight:bold;color:#333}
        .amt-box{border:1px solid #000;background:#f9f9f9;padding:10px;text-align:center;margin:12px 0}
        .amt{font-size:20px;font-weight:bold}
        .sign-area{display:flex;justify-content:space-between;margin-top:24px}
        .sign-box{text-align:center}
        .sign-line{width:120px;height:1px;background:#000;margin:28px auto 4px}
        @media print{@page{margin:0;size:A5 landscape}}
      </style>
    </head><body>
      <div class="receipt-box">
        <div class="header">
          <div><div class="co">${co?.name || ''}</div><div style="font-size:9px;color:#333;margin-top:2px">${co?.addr1||''}, ${co?.city||''} | GSTIN: ${co?.gstin||''}</div></div>
          <div style="text-align:right;font-size:10px">Receipt No: RCP-${payment.id || Date.now()}<br>Date: ${payment.date || ''}</div>
        </div>
        <div class="band">PAYMENT RECEIPT</div>
        <div class="row"><span class="lbl">Received From</span><span>${payment.partyName||'-'}</span></div>
        <div class="row"><span class="lbl">Payment Mode</span><span>${modeMap[payment.mode]||payment.mode||'-'}</span></div>
        ${payment.refNo ? `<div class="row"><span class="lbl">Reference / UTR</span><span>${payment.refNo}</span></div>` : ''}
        ${payment.chequeNo ? `<div class="row"><span class="lbl">Cheque No</span><span>${payment.chequeNo} (${payment.chequeBank||''})</span></div>` : ''}
        ${payment.narration ? `<div class="row"><span class="lbl">Narration</span><span>${payment.narration}</span></div>` : ''}
        <div class="amt-box">
          <div style="font-size:10px;font-weight:bold;margin-bottom:4px">Amount Received</div>
          <div class="amt">₹ ${(payment.amount||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</div>
          <div style="font-size:9.5px;margin-top:4px">${typeof App !== 'undefined' ? App.amountToWords(payment.amount||0) : ''}</div>
        </div>
        <div class="sign-area">
          <div class="sign-box"><div class="sign-line"></div><div style="font-size:9px">Party Signature</div></div>
          <div class="sign-box"><div class="sign-line"></div><div style="font-size:9px">for ${co?.name||''}<br>Authorised Signatory</div></div>
        </div>
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
        <td style="text-align:center;">${e.date || ''}</td>
        <td>${e.narration || e.type}</td>
        <td>${e.refNo || '-'}</td>
        <td style="text-align:right;">${e.side === 'DR' ? `₹ ${e.amount.toFixed(2)}` : ''}</td>
        <td style="text-align:right;">${e.side === 'CR' ? `₹ ${e.amount.toFixed(2)}` : ''}</td>
        <td style="text-align:right;font-weight:bold;">₹ ${Math.abs(balance).toFixed(2)} ${balance>=0?'DR':'CR'}</td>
      </tr>`;
    }
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Party Ledger - ${party?.name}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;padding:10mm;font-size:10px}
        .header{display:flex;justify-content:space-between;border-bottom:1px solid #000;padding-bottom:5px;margin-bottom:8px}
        .co{font-size:16px;font-weight:bold;text-transform:uppercase}
        .band{text-align:center;font-size:12px;font-weight:bold;margin:6px 0;letter-spacing:1px}
        table{width:100%;border-collapse:collapse;border:1px solid #000}
        th{background:#f0f0f0;border:1px solid #000;padding:5px;font-size:9px}
        td{border:1px solid #000;padding:4px 6px;font-size:9px}
        .closing{font-weight:bold;background:#f9f9f9}
        @media print{@page{margin:6mm;size:A4}}
      </style>
    </head><body>
      <div class="header">
        <div><div class="co">${co?.name||''}</div><div style="font-size:9px">${co?.addr1||''}, ${co?.city||''} | GSTIN: ${co?.gstin||''}</div></div>
        <div style="text-align:right;font-size:9px">Date: ${new Date().toLocaleDateString('en-IN')}</div>
      </div>
      <div class="band">STATEMENT OF ACCOUNT (LEDGER)</div>
      <div style="display:flex;justify-content:space-between;margin:6px 0;font-size:9.5px;">
        <div><strong>Party:</strong> ${party?.name||''} &nbsp;|&nbsp; <strong>GSTIN:</strong> ${party?.gstin||'Unregistered'}</div>
        <div><strong>State:</strong> ${party?.state||''}</div>
      </div>
      <table>
        <thead><tr><th>Date</th><th>Particulars</th><th>Ref#</th><th style="text-align:right">Debit (₹)</th><th style="text-align:right">Credit (₹)</th><th style="text-align:right">Balance (₹)</th></tr></thead>
        <tbody>
          ${rows || '<tr><td colspan="6" style="text-align:center;padding:16px;color:#888;">No transactions found</td></tr>'}
          <tr class="closing">
            <td colspan="3"><strong>Closing Balance</strong></td>
            <td colspan="3" style="text-align:right;font-size:11px;">₹ ${Math.abs(balance).toFixed(2)} ${balance>=0?'DR':'CR'}</td>
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
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;padding:10mm;font-size:10px}
        .co{font-size:16px;font-weight:bold;text-transform:uppercase}
        .band{text-align:center;font-size:12px;font-weight:bold;margin:8px 0;letter-spacing:1px}
        table{width:100%;border-collapse:collapse;border:1px solid #000}
        th{background:#f0f0f0;border:1px solid #000;padding:5px;font-size:9px}
        td{border:1px solid #000;padding:4px 6px;font-size:9px}
        @media print{@page{margin:6mm;size:A4 landscape}}
      </style>
    </head><body>
      <div class="co">${co?.name||''}</div>
      <div class="band">STOCK SUMMARY — ${new Date().toLocaleDateString('en-IN')}</div>
      <table>
        <thead><tr><th>#</th><th>Item Description</th><th>HSN/SAC</th><th>Unit</th><th>Purchase Price</th><th>Sale Price</th><th style="text-align:right">Closing Stock</th><th>Reorder Level</th><th>Status</th></tr></thead>
        <tbody>${items.map((item, i) => {
          const s = item.stock || 0;
          const r = item.reorderLevel || 0;
          let status = 'In Stock';
          if (s <= 0) status = 'Out of Stock';
          else if (r > 0 && s <= r) status = 'Low Stock';
          return `<tr>
            <td style="text-align:center;">${i+1}</td>
            <td><strong>${item.name}</strong></td>
            <td style="text-align:center;">${item.hsn||'-'}</td>
            <td style="text-align:center;">${item.unit||'NOS'}</td>
            <td style="text-align:right;">₹ ${(item.purchasePrice||0).toFixed(2)}</td>
            <td style="text-align:right;">₹ ${(item.salePrice||0).toFixed(2)}</td>
            <td style="text-align:right;font-weight:bold;">${s}</td>
            <td style="text-align:right;">${r||'-'}</td>
            <td style="text-align:center;">${status}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 400);
  },
};
