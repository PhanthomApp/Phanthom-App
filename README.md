# PHANTHOM Business App

A deploy-ready React + Vite web app for PHANTHOM Official.

## Features

- Services display
- Order entry
- Invoice and receipt numbering
- Partial payment tracking
- Remaining balance calculation
- WhatsApp-ready customer message link
- Browser local storage persistence

## Run locally

```bash
npm install
npm run dev
```

## Build for production

```bash
npm install
npm run build
```

## Deploy on Vercel

1. Create a new GitHub repository.
2. Upload all files from this project folder.
3. Push to GitHub.
4. In Vercel, click **Add New Project** or connect the repo.
5. Framework preset: **Vite**.
6. Build command: `npm run build`
7. Output directory: `dist`
8. Click **Deploy**.

## Notes

This MVP stores data in browser local storage. To support multi-device sync, authentication, and database storage, add a backend in a later phase. update
