// ============================================================
// Pro Billbook - Company Setup Module
// ============================================================

const CompanyModule = {
  currentStep: 1,
  totalSteps: 4,

  async showSetup() {
    const overlay = document.getElementById('setup-overlay');
    if (overlay) overlay.style.display = 'flex';
    this.currentStep = 1;
    this.initWizardDOM();
    this.renderStep(1);
    this.bindWizardEvents();
  },

  hideSetup() {
    const overlay = document.getElementById('setup-overlay');
    if (overlay) overlay.style.display = 'none';
  },

  initWizardDOM() {
    const container = document.getElementById('setup-step-content');
    if (!container) return;
    container.innerHTML = `
      <div id="setup-step-pane-1" class="setup-step-pane">
        ${this.stepBusinessHTML()}
      </div>
      <div id="setup-step-pane-2" class="setup-step-pane" style="display:none">
        ${this.stepTaxHTML()}
      </div>
      <div id="setup-step-pane-3" class="setup-step-pane" style="display:none">
        ${this.stepBankHTML()}
      </div>
      <div id="setup-step-pane-4" class="setup-step-pane" style="display:none">
        ${this.stepInvoiceHTML()}
      </div>
    `;

    // Populate state dropdowns
    const stateSelects = container.querySelectorAll('select[data-states]');
    stateSelects.forEach(sel => {
      sel.innerHTML = '<option value="">-- Select State --</option>' +
        INDIA_STATES.map(s => `<option value="${s.code}">${s.name}</option>`).join('');
    });
  },

  renderStep(step) {
    const steps = document.querySelectorAll('.wizard-step');
    steps.forEach((s, i) => {
      s.classList.toggle('active', i + 1 === step);
      s.classList.toggle('done', i + 1 < step);
    });
    const connectors = document.querySelectorAll('.wizard-connector');
    connectors.forEach((c, i) => c.classList.toggle('done', i + 1 < step));

    const titles = ['Business Identity', 'Tax & Compliance', 'Bank Details', 'Invoice Settings'];
    const titleEl = document.getElementById('setup-step-title');
    if (titleEl) titleEl.textContent = titles[step - 1];

    // Toggle panes
    for (let i = 1; i <= this.totalSteps; i++) {
      const pane = document.getElementById(`setup-step-pane-${i}`);
      if (pane) pane.style.display = i === step ? 'block' : 'none';
    }

    const prevBtn = document.getElementById('setup-prev-btn');
    if (prevBtn) prevBtn.style.display = step > 1 ? '' : 'none';

    const nextBtn = document.getElementById('setup-next-btn');
    if (nextBtn) nextBtn.textContent = step === this.totalSteps ? '🚀 Save & Get Started' : 'Next →';
  },

  stepBusinessHTML: () => `
    <div class="form-group">
      <label>Company / Business Name <span class="req">*</span></label>
      <input class="form-control" id="co-name" placeholder="e.g. ABC Traders Pvt Ltd" required>
    </div>
    <div class="form-row-2">
      <div class="form-group">
        <label>Mobile Number <span class="req">*</span></label>
        <input class="form-control" id="co-mobile" placeholder="+91 98765 43210" maxlength="15">
      </div>
      <div class="form-group">
        <label>Email Address</label>
        <input class="form-control" id="co-email" type="email" placeholder="billing@company.com">
      </div>
    </div>
    <div class="form-group">
      <label>Address Line 1 <span class="req">*</span></label>
      <input class="form-control" id="co-addr1" placeholder="Shop/House No, Street Name">
    </div>
    <div class="form-row-3">
      <div class="form-group">
        <label>City</label>
        <input class="form-control" id="co-city" placeholder="City">
      </div>
      <div class="form-group">
        <label>State <span class="req">*</span></label>
        <select class="form-control" id="co-state" data-states></select>
      </div>
      <div class="form-group">
        <label>PIN Code</label>
        <input class="form-control" id="co-pin" placeholder="400001" maxlength="6">
      </div>
    </div>
    <div class="form-group">
      <label>Business Logo URL (optional)</label>
      <input class="form-control" id="co-logo" placeholder="https://... or leave blank">
      <div class="form-hint">Appears on invoice header. Use a public image URL.</div>
    </div>`,

  stepTaxHTML: () => `
    <div class="form-row-2">
      <div class="form-group">
        <label>GSTIN <span class="req">*</span></label>
        <input class="form-control font-mono" id="co-gstin" placeholder="22AAAAA0000A1Z5" maxlength="15" style="text-transform:uppercase">
        <div class="form-hint">15-digit GST Identification Number</div>
      </div>
      <div class="form-group">
        <label>PAN Number</label>
        <input class="form-control font-mono" id="co-pan" placeholder="AAAAA0000A" maxlength="10" style="text-transform:uppercase">
      </div>
    </div>
    <div class="form-row-2">
      <div class="form-group">
        <label>CIN (if applicable)</label>
        <input class="form-control" id="co-cin" placeholder="U12345MH2020PTC123456">
      </div>
      <div class="form-group">
        <label>Business Type</label>
        <select class="form-control" id="co-btype">
          <option value="regular">Regular</option>
          <option value="composition">Composition Scheme</option>
          <option value="sez">SEZ Unit</option>
        </select>
      </div>
    </div>
    <div class="form-row-2">
      <div class="form-group">
        <label>E-Invoice Enabled</label>
        <select class="form-control" id="co-einv">
          <option value="no">No (Turnover below ₹5 Cr)</option>
          <option value="yes">Yes (Mandatory)</option>
        </select>
      </div>
      <div class="form-group">
        <label>E-Way Bill Enabled</label>
        <select class="form-control" id="co-ewb">
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>
    </div>
    <div class="alert alert-info">
      ℹ️ GSTIN format: <strong>2 digit State Code + 10 digit PAN + 1 digit Entity + Z + 1 check digit</strong>
    </div>`,

  stepBankHTML: () => `
    <div class="form-group">
      <label>Bank Name</label>
      <input class="form-control" id="co-bank" placeholder="State Bank of India">
    </div>
    <div class="form-row-2">
      <div class="form-group">
        <label>Account Number</label>
        <input class="form-control font-mono" id="co-accno" placeholder="1234567890">
      </div>
      <div class="form-group">
        <label>IFSC Code</label>
        <input class="form-control font-mono" id="co-ifsc" placeholder="SBIN0001234" style="text-transform:uppercase">
      </div>
    </div>
    <div class="form-row-2">
      <div class="form-group">
        <label>Account Holder Name</label>
        <input class="form-control" id="co-accholder" placeholder="As per bank records">
      </div>
      <div class="form-group">
        <label>Branch Name</label>
        <input class="form-control" id="co-branch" placeholder="Main Branch, Mumbai">
      </div>
    </div>
    <div class="form-group">
      <label>UPI ID (optional)</label>
      <input class="form-control" id="co-upi" placeholder="business@upi">
    </div>`,

  stepInvoiceHTML: () => `
    <div class="form-row-2">
      <div class="form-group">
        <label>Invoice Prefix</label>
        <input class="form-control" id="co-invpfx" placeholder="INV" value="INV">
      </div>
      <div class="form-group">
        <label>Financial Year Start</label>
        <select class="form-control" id="co-fystart">
          <option value="2425">2024-25</option>
          <option value="2526" selected>2025-26</option>
          <option value="2627">2026-27</option>
        </select>
      </div>
    </div>
    <div class="form-row-2">
      <div class="form-group">
        <label>Invoice Number Format</label>
        <select class="form-control" id="co-invfmt">
          <option value="PREFIX/FY/NUM">INV/2526/0001</option>
          <option value="PREFIX/NUM">INV/0001</option>
          <option value="PREFIXNUM">INV0001</option>
        </select>
      </div>
      <div class="form-group">
        <label>Starting Invoice Number</label>
        <input class="form-control" id="co-invstart" type="number" value="1" min="1">
      </div>
    </div>
    <div class="form-row-2">
      <div class="form-group">
        <label>Default Payment Terms</label>
        <select class="form-control" id="co-terms">
          <option value="0">Immediate</option>
          <option value="7">7 Days</option>
          <option value="15">15 Days</option>
          <option value="30" selected>30 Days</option>
          <option value="45">45 Days</option>
          <option value="60">60 Days</option>
        </select>
      </div>
      <div class="form-group">
        <label>Default Currency</label>
        <select class="form-control" id="co-curr">
          <option value="INR" selected>INR - Indian Rupee (₹)</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Invoice Terms & Conditions</label>
      <textarea class="form-control" id="co-tc" rows="3" placeholder="Goods once sold will not be taken back. Subject to local jurisdiction."></textarea>
    </div>
    <div class="form-group">
      <label>Invoice Signature Name</label>
      <input class="form-control" id="co-signname" placeholder="Authorised Signatory">
    </div>`,

  bindWizardEvents() {
    const nextBtn = document.getElementById('setup-next-btn');
    if (nextBtn) nextBtn.onclick = () => this.nextStep();
    const prevBtn = document.getElementById('setup-prev-btn');
    if (prevBtn) prevBtn.onclick = () => this.prevStep();
  },

  nextStep() {
    if (!this.validateStep(this.currentStep)) return;
    if (this.currentStep === this.totalSteps) {
      this.saveAndFinish();
      return;
    }
    this.currentStep++;
    this.renderStep(this.currentStep);
  },

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.renderStep(this.currentStep);
    }
  },

  validateStep(step) {
    if (step === 1) {
      const name = document.getElementById('co-name')?.value?.trim();
      if (!name) { App.toast('Company name is required', 'error'); return false; }
      const state = document.getElementById('co-state')?.value;
      if (!state) { App.toast('Please select state', 'error'); return false; }
    }
    if (step === 2) {
      const gstin = document.getElementById('co-gstin')?.value?.trim()?.toUpperCase();
      if (!gstin) { App.toast('GSTIN is required', 'error'); return false; }
      if (gstin.length !== 15) { App.toast('GSTIN must be 15 characters', 'error'); return false; }
    }
    return true;
  },

  async saveAndFinish() {
    try {
      const getVal = (id, def = '') => document.getElementById(id)?.value?.trim() || def;
      const data = {
        name: getVal('co-name', 'My Business'),
        mobile: getVal('co-mobile'),
        email: getVal('co-email'),
        addr1: getVal('co-addr1'),
        city: getVal('co-city'),
        state: getVal('co-state'),
        stateCode: getVal('co-state'),
        pin: getVal('co-pin'),
        logo: getVal('co-logo'),
        gstin: getVal('co-gstin').toUpperCase(),
        pan: getVal('co-pan').toUpperCase(),
        cin: getVal('co-cin'),
        businessType: getVal('co-btype', 'regular'),
        eInvoiceEnabled: getVal('co-einv') === 'yes',
        eWayBillEnabled: getVal('co-ewb', 'yes') === 'yes',
        bankName: getVal('co-bank'),
        accountNo: getVal('co-accno'),
        ifsc: getVal('co-ifsc').toUpperCase(),
        accountHolder: getVal('co-accholder'),
        branch: getVal('co-branch'),
        upi: getVal('co-upi'),
        invoicePrefix: getVal('co-invpfx', 'INV'),
        invoiceFormat: getVal('co-invfmt', 'PREFIX/FY/NUM'),
        fyear: getVal('co-fystart', '2526'),
        invoiceStart: parseInt(getVal('co-invstart', '1')) || 1,
        paymentTerms: getVal('co-terms', '30'),
        currency: getVal('co-curr', 'INR'),
        terms: getVal('co-tc'),
        signName: getVal('co-signname', 'Authorised Signatory'),
        createdAt: new Date().toISOString(),
      };

      await db.saveCompany(data);
      // Set invoice sequence
      const seqVal = (data.invoiceStart || 1) - 1;
      await db.resetSequence('invoice', seqVal);
      this.hideSetup();
      App.company = data;
      App.updateTopbar();
      App.toast('Company setup complete! Welcome to Pro Billbook 🎉', 'success');
      App.navigate('dashboard');
    } catch (err) {
      console.error('Save company error:', err);
      App.toast('Failed to save company: ' + (err.message || err), 'error');
    }
  },

  // Company Settings Page
  async renderSettings() {
    const co = await db.getCompany();
    if (!co) return;
    const stateOpts = INDIA_STATES.map(s => `<option value="${s.code}" ${co.state === s.code ? 'selected' : ''}>${s.name}</option>`).join('');
    document.getElementById('settings-content').innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">🏢 Company Information</div>
          <button class="btn btn-primary btn-sm" onclick="CompanyModule.saveSettings()">💾 Save Changes</button>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label>Company Name <span class="req">*</span></label>
            <input class="form-control" id="s-name" value="${co.name || ''}">
          </div>
          <div class="form-group">
            <label>GSTIN</label>
            <input class="form-control font-mono" id="s-gstin" value="${co.gstin || ''}" style="text-transform:uppercase">
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label>PAN</label>
            <input class="form-control font-mono" id="s-pan" value="${co.pan || ''}" style="text-transform:uppercase">
          </div>
          <div class="form-group">
            <label>Mobile</label>
            <input class="form-control" id="s-mobile" value="${co.mobile || ''}">
          </div>
        </div>
        <div class="form-group">
          <label>Address</label>
          <input class="form-control" id="s-addr1" value="${co.addr1 || ''}">
        </div>
        <div class="form-row-3">
          <div class="form-group">
            <label>City</label>
            <input class="form-control" id="s-city" value="${co.city || ''}">
          </div>
          <div class="form-group">
            <label>State</label>
            <select class="form-control" id="s-state">
              <option value="">-- Select --</option>${stateOpts}
            </select>
          </div>
          <div class="form-group">
            <label>PIN Code</label>
            <input class="form-control" id="s-pin" value="${co.pin || ''}">
          </div>
        </div>
        <hr class="divider">
        <div class="card-title" style="margin-bottom:12px">🏦 Bank Details</div>
        <div class="form-row-2">
          <div class="form-group">
            <label>Bank Name</label>
            <input class="form-control" id="s-bank" value="${co.bankName || ''}">
          </div>
          <div class="form-group">
            <label>Account Number</label>
            <input class="form-control font-mono" id="s-accno" value="${co.accountNo || ''}">
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label>IFSC Code</label>
            <input class="form-control font-mono" id="s-ifsc" value="${co.ifsc || ''}" style="text-transform:uppercase">
          </div>
          <div class="form-group">
            <label>UPI ID</label>
            <input class="form-control" id="s-upi" value="${co.upi || ''}">
          </div>
        </div>
        <hr class="divider">
        <div class="card-title" style="margin-bottom:12px">🧾 Invoice Settings</div>
        <div class="form-row-2">
          <div class="form-group">
            <label>Invoice Prefix</label>
            <input class="form-control" id="s-invpfx" value="${co.invoicePrefix || 'INV'}">
          </div>
          <div class="form-group">
            <label>Signature Name</label>
            <input class="form-control" id="s-signname" value="${co.signName || 'Authorised Signatory'}">
          </div>
        </div>
        <div class="form-group">
          <label>Terms & Conditions</label>
          <textarea class="form-control" id="s-tc" rows="3">${co.terms || ''}</textarea>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label>E-Invoice</label>
            <select class="form-control" id="s-einv">
              <option value="no" ${!co.eInvoiceEnabled ? 'selected' : ''}>Not Required</option>
              <option value="yes" ${co.eInvoiceEnabled ? 'selected' : ''}>Enabled</option>
            </select>
          </div>
          <div class="form-group">
            <label>E-Way Bill</label>
            <select class="form-control" id="s-ewb">
              <option value="yes" ${co.eWayBillEnabled ? 'selected' : ''}>Enabled</option>
              <option value="no" ${!co.eWayBillEnabled ? 'selected' : ''}>Disabled</option>
            </select>
          </div>
        </div>
      </div>
    `;
  },

  async saveSettings() {
    const co = await db.getCompany();
    const updated = {
      ...co,
      name: document.getElementById('s-name').value.trim(),
      gstin: document.getElementById('s-gstin').value.trim().toUpperCase(),
      pan: document.getElementById('s-pan').value.trim().toUpperCase(),
      mobile: document.getElementById('s-mobile').value.trim(),
      addr1: document.getElementById('s-addr1').value.trim(),
      city: document.getElementById('s-city').value.trim(),
      state: document.getElementById('s-state').value,
      pin: document.getElementById('s-pin').value.trim(),
      bankName: document.getElementById('s-bank').value.trim(),
      accountNo: document.getElementById('s-accno').value.trim(),
      ifsc: document.getElementById('s-ifsc').value.trim().toUpperCase(),
      upi: document.getElementById('s-upi').value.trim(),
      invoicePrefix: document.getElementById('s-invpfx').value.trim(),
      signName: document.getElementById('s-signname').value.trim(),
      terms: document.getElementById('s-tc').value.trim(),
      eInvoiceEnabled: document.getElementById('s-einv').value === 'yes',
      eWayBillEnabled: document.getElementById('s-ewb').value === 'yes',
    };
    await db.saveCompany(updated);
    App.company = updated;
    App.updateTopbar();
    App.toast('Settings saved successfully!', 'success');
  }
};
