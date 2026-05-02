# 🚀 How to Run All Servers Easily

Welcome to the **Seva Marg Donation System**! To make your development workflow smoother, I have created a one-click launcher and a step-by-step guide to get everything running in seconds.

---

## ⚡ Option 1: The One-Click Launcher (Recommended)

I have created a file called `run_all.bat` in the root directory. This is the fastest way to start everything.

1.  Open your project folder: `c:\Users\pc\Downloads\donation-main\donation-main\`
2.  Double-click on **`run_all.bat`**.
3.  **Result**: Three separate terminal windows will open, automatically activating the backend and starting the frontend servers.

---

## 🛠️ Option 2: Manual Start (Step-by-Step)

If you prefer to start them manually or need to debug, follow these steps in order:

### 1. The Backend (Core API)
The backend manages your data, donations, and users.
*   **Command**: 
    ```powershell
    cd backend
    .\venv\Scripts\activate
    python manage.py runserver
    ```
*   **URL**: `http://localhost:8000`

### 2. The User Side (Donation Portal)
This is where donors view causes and make donations with the new **Modern Glassmorphic Look**.
*   **Command**:
    ```powershell
    cd user
    npm run dev
    ```
*   **URL**: `http://localhost:5173`

### 3. The Admin Side (Dashboard)
This is where administrators manage the donation lifecycle and inventory.
*   **Command**:
    ```powershell
    cd admin
    npm run dev
    ```
*   **URL**: `http://localhost:5174`

---

## 📋 Prerequisites
Before running, ensure you have:
*   **Python 3.x** installed.
*   **Node.js** installed (for `npm` commands).
*   The virtual environment (`venv`) set up in the `backend` folder.

---

## 💡 Troubleshooting
*   **Port Conflicts**: If a port is already in use, the script might fail. Make sure you don't have other servers running on ports 8000, 5173, or 5174.
*   **Missing Dependencies**: If a frontend fails, run `npm install` inside the `user` or `admin` folders.
