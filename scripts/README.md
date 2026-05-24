# CampusVault Bulk Import Script

Batch-uploads an entire local folder of study materials (PDFs, images, ZIPs) to Cloudinary + Firestore in one command.

---

## One-Time Setup

### Step 1 — Download your Google Drive folder

1. Open Google Drive → right-click your **MCA** folder
2. Click **Download** — it downloads as a ZIP
3. Extract the ZIP somewhere, e.g. `C:\Users\Chirag\Downloads\MCA`

Your folder should look like:
```
MCA/
├── 4TH SEM/
│   ├── DATA SCIENCE/
│   ├── DIGITAL MARKETING/
│   └── ...
├── FIRST SEM/
├── SEM 2/
├── SEM 3/
└── BRIDGE COURSE/
```

### Step 2 — Get Firebase Service Account Key

1. Go to **[Firebase Console](https://console.firebase.google.com)** → your project
2. Click **⚙️ Project Settings** → **Service Accounts** tab
3. Click **"Generate new private key"** → confirm → download the JSON file
4. **Rename it** to `service-account.json`
5. **Move it** to: `campusvault/scripts/service-account.json`

> ⚠️ IMPORTANT: This file is in `.gitignore` — never commit it to git!

### Step 3 — Get your Firebase UID

1. Firebase Console → **Authentication** → **Users** tab
2. Find your account → copy the **UID** column value

---

## Running the Script

### Dry run first (preview without uploading):
```powershell
node scripts/bulk-import.js "C:\Users\Chirag\Downloads\MCA" --dry-run --branch=mca --uploader-uid=YOUR_UID_HERE --uploader-name="Chirag Kashyap"
```

### Actual upload:
```powershell
node scripts/bulk-import.js "C:\Users\Chirag\Downloads\MCA" --branch=mca --uploader-uid=YOUR_UID_HERE --uploader-name="Chirag Kashyap"
```

### Or use the npm shortcut:
```powershell
# Dry run
npm run import:dry -- "C:\Users\Chirag\Downloads\MCA" --branch=mca --uploader-uid=abc123 --uploader-name="Chirag Kashyap"

# Actual import
npm run import -- "C:\Users\Chirag\Downloads\MCA" --branch=mca --uploader-uid=abc123 --uploader-name="Chirag Kashyap"
```

---

## All Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--dry-run` | false | Preview only — no files are uploaded |
| `--branch=mca` | `mca` | Branch for all files |
| `--uploader-uid=xxx` | `admin` | Your Firebase UID (from Auth console) |
| `--uploader-name="Name"` | `CampusVault Admin` | Your display name on resources |
| `--skip-existing` | false | Skip files with same title already in DB |
| `--approved=false` | `true` | Set to false to put files in pending queue |

---

## How Metadata is Auto-detected

The script reads folder names and file names to guess the metadata:

| Folder Name Contains | Detected As |
|---------------------|-------------|
| `4TH SEM`, `SEM 4` | Semester 4 |
| `FIRST SEM`, `SEM 1` | Semester 1 |
| `CT`, `CLASS TEST` | Type: CT Paper |
| `PYQ`, `PREVIOUS YEAR` | Type: PYQ Paper |
| `LAB`, `PRACTICAL` | Type: Lab Manual |
| `ASSIGNMENT` | Type: Assignment |
| `SOFTWARE`, `.zip` | Type: Software |
| Everything else | Type: PDF/Study Material |

The immediate parent folder name becomes the **subject**.

Example: `MCA/4TH SEM/DIGITAL MARKETING/CT1_2024.pdf`
→ Semester: **4**, Subject: **Digital Marketing**, Type: **CT Paper**

---

## After Running

Resources marked `approved: true` appear **immediately** in the Resource Library.
No need to go through the admin panel — they're live instantly!

Check them at: **http://localhost:3000/resources**
