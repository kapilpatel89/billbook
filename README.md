# 🏢 Pro Billbook — Indian GST Invoice & Business Software
### 100% Offline Local Windows Installation | Local Disk File Database | No Online Database

A complete, standalone, Indian GST-compliant billing, invoicing, inventory, and accounting system engineered specifically for **100% offline local execution on Windows**. All invoices, parties, items, and accounting ledgers are saved physically into local disk files and folders right on your machine (`database/` and `data/invoices/`).

---

## ⚡ Windows Quick Start (1-Click)

### Option 1: Run Installer (First Time Setup)
Double-click `install.bat` in this folder:
- Automatically verifies or helps you install Node.js runtime.
- Creates all local database and bills folders (`database/`, `data/invoices/`, `data/parties/`).
- Configures full local read/write permissions via Windows `icacls`.
- Creates a **"Pro Billbook GST"** shortcut directly on your Windows Desktop.

### Option 2: 1-Click Daily Run
Double-click `start.bat` (or `run.bat` or the Desktop Shortcut):
- Starts the local file database server.
- Automatically launches your default web browser at `http://localhost:3000/`.
- All changes are immediately written to your local disk.

---

## 💾 Local File Database Architecture (No Online Database)

Unlike cloud apps, **Pro Billbook does not use any online or external database**. Everything resides inside your local project directory:

```
e:\Pro Billbook\
├── database\                     # Core Local Database Files (JSON Format)
│   ├── company.json              # Business identity, GSTIN, bank & settings
│   ├── parties.json              # Customer & supplier directory with balances
│   ├── items.json                # Stock inventory, prices & HSN codes
│   ├── invoices.json             # All sales invoices & bills master
│   ├── purchases.json            # Inward purchase bills master
│   ├── payments.json             # Receipts & payment vouchers
│   ├── ledger.json               # Full double-entry financial ledger
│   ├── sequences.json            # Auto-increment invoice & voucher sequences
│   └── backups\                  # Automatic timestamped database snapshots
│
├── data\                         # Physical Document Folders
│   ├── invoices\                 # Individual invoice JSON files (e.g. PE_2526_0001.json)
│   ├── parties\                  # Individual party statement files
│   ├── purchases\                # Individual purchase bill records
│   └── exports\                  # GSTR-1, GSTR-3B, GSTR-9 JSON exports
│
├── install.bat                   # 1-Click Windows Setup & Prerequisites Installer
├── start.bat                     # 1-Click Launcher (starts server + opens browser)
├── setup.bat                     # Folder & permissions configuration utility
└── server.js                     # High-performance local file database engine
```

### 📂 Direct Windows Explorer Integration
Click the **"📂 Bills Folder"** or **"🟢 Local Disk: database\"** badge in the top navigation bar at any time to open your physical bills folder directly in Windows File Explorer!

---

## 🌟 Comprehensive Features

### 🏢 Business Identity & GST Setup
- **4-Step Setup Wizard**: Legal trade name, GSTIN validator, State code mapping, Bank/UPI details, and customizable invoice numbering prefix.
- Multi-financial year support (`FY 25-26`).

### 🧾 Indian GST Invoicing Engine
- **Intrastate vs Interstate Auto-Calculation**:
  - Intrastate (Same State) -> `CGST` + `SGST`
  - Interstate (Different State) -> `IGST`
- Dynamic line items with HSN search, unit of measure, discount %, cess, and automatic round-off.
- Automatic Indian currency conversion to words (*Rupees, Lakhs, Crores, and Paise*).

### 🛒 Purchase Entries & Inventory Control
- Record inward supplier invoices with GST breakdown.
- Real-time stock movement ledger (`IN` / `OUT`) with reorder alerts.

### 👥 Party Management & WhatsApp Ledger
- Dedicated party directory with 15-digit GSTIN validation.
- Live outstanding balance calculation.
- Instant **WhatsApp Ledger Share** for customer statements.
- Complete financial Day Book.

### 📋 GSTR NIC Portal JSON Generators
- **GSTR-1 JSON**: B2B, B2CL, B2CS, Exports, and HSN summary tables for direct upload to `gst.gov.in`.
- **GSTR-3B JSON**: Monthly summary containing outward taxable supplies and Input Tax Credit (ITC).
- **GSTR-9 JSON**: Annual return consolidated summary.

### ⚡ E-Invoice & 🚚 E-Way Bill
- **E-Invoice (IRP Schema v1.1)**: IRN hash generator, QR code, and acknowledgement tracking.
- **E-Way Bill**: Part-A & Part-B JSON with transporter GSTIN, vehicle number, distance (KM), and transport mode.

### 🖨️ Complete 3-Copy Print Center
- Professional A4 Tax Invoice with 3 standard copies:
  - `ORIGINAL FOR BUYER`
  - `DUPLICATE FOR TRANSPORTER`
  - `TRIPLICATE FOR SUPPLIER`
- Embedded offline QR Code and IRN block.
- Party Ledger A4 print.
- Inventory stock sheet print (A4 Landscape).
- Payment vouchers & receipts (A5).

---

## 🔒 Complete Offline Privacy
- Zero tracking, zero telemetry, zero cloud dependencies.
- Dual-engine storage: High-speed local browser cache (IndexedDB) synchronized in real-time with physical Windows JSON files on disk.

---

## 📄 License
MIT License - Free for commercial and personal business use.
