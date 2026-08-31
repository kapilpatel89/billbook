# 🏢 Pro Billbook — Indian GST Invoice & Business WebApp

A fully offline-capable, Indian GST-compliant business invoice, billing, inventory, and accounting software built with pure HTML5, CSS3, and JavaScript, powered by IndexedDB.

---

## 🌟 Key Features

### 🏢 Company Setup & Configuration
- **4-Step First-Run Wizard**: Business identity, Tax & GSTIN format validation, Bank/UPI details, and customizable invoice numbering rules.
- Complete settings manager for updating terms, bank details, and business profile anytime.

### 🧾 Full GST Invoicing Engine
- **Intrastate vs Interstate Auto-Detection**: Automatically computes CGST + SGST (Intrastate) or IGST (Interstate) based on Party state vs Company state.
- **Dynamic Line Items**: Real-time tax calculation, discount %, Cess, HSN code search, UOMs, and automatic round-off.
- **Indian Currency in Words**: Automatic conversion (Rupees, Lakhs, Crores, and Paise).

### 🛒 Purchase Entry & Inventory Management
- Record supplier bills with GSTIN & tax details.
- Automatically increments inventory stock levels and logs stock movements (`IN`/`OUT`).
- Real-time stock status, low-stock warnings, and reorder levels.

### 👥 Party Management & Ledger
- Customers & Suppliers management with 15-character GSTIN validator.
- Full party ledger with running debit/credit balance and transaction history.
- **Share via WhatsApp**: Send instant ledger balances and statements to parties.
- Daily transaction **Day Book** with date range filtering.

### 📋 GSTR NIC-Compatible JSON Generators
- **GSTR-1 JSON**: Outward supplies formatted into B2B, B2CL, B2CS, Exports, HSN Summary, and Nil-rated tables for direct GST portal upload.
- **GSTR-3B JSON**: Monthly summary containing outward taxable supplies, interstate unregistered sales, and Input Tax Credit (ITC).
- **GSTR-9 JSON**: Annual return summary for the entire financial year.

### ⚡ E-Invoice & 🚚 E-Way Bill
- **E-Invoice (IRP Schema v1.1)**: 64-character IRN hash generation, dynamic QR Code, acknowledgement number & date tracking.
- **E-Way Bill**: JSON generator with transporter GSTIN, vehicle number, distance (KM), and transport modes (Road, Rail, Air, Ship).

### 🖨️ Complete Print Center
- **3-Page Tax Invoice**:
  - `ORIGINAL FOR BUYER`
  - `DUPLICATE FOR TRANSPORTER`
  - `TRIPLICATE FOR SUPPLIER`
- E-Invoice QR Code & IRN block embedded in invoice print.
- E-Way Bill attached document print.
- Party Ledger statement print (A4).
- Stock inventory sheet print (A4 Landscape).
- Payment receipt print (A5).

### 🔒 100% Offline & Private
- Client-side data storage using **IndexedDB**.
- Bundled offline `qrcode.min.js` library.
- JSON-based **Backup & Restore** feature.

---

## 📁 Project Structure

```
├── index.html          # Main SPA shell & UI pages
├── style.css           # Complete CSS design system & print styles
├── app.js              # Application controller, router & utilities
├── db.js               # IndexedDB database layer
├── server.js           # Lightweight static server
├── assets/
│   └── qrcode.min.js   # Offline QR code generator
├── data/
│   └── hsn_data.js     # Preloaded HSN/SAC master database & Indian states
└── modules/
    ├── company.js      # Setup wizard & settings
    ├── parties.js      # Party management & WhatsApp ledger sharing
    ├── items.js        # Stock management & HSN master
    ├── sales.js        # GST Sales Invoices & Purchase Entries
    ├── payments.js     # Payments & ledger day book
    ├── gstr.js         # GSTR-1, 3B, 9, E-Invoice & E-Way Bill JSON engines
    └── print.js        # Print templates (3-copy invoice, ledger, receipts)
```

---

## 🚀 Quick Start

1. Clone this repository:
   ```bash
   git clone https://github.com/kapilpatel89/billbook.git
   cd billbook
   ```

2. Start the local server:
   ```bash
   node server.js
   ```

3. Open in your browser:
   ```
   http://localhost:3000/
   ```

---

## 📄 License
MIT License
