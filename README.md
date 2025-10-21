# LearningApp

[![Deploy](https://github.com/hoangcuongvnit/LearningApp/actions/workflows/deploy.yml/badge.svg)](https://github.com/hoangcuongvnit/LearningApp/actions/workflows/deploy.yml)
# LearningApp

Vite + React + TypeScript + Bootstrap starter

Quick start

1. npm install
2. npm run dev

Bootstrap is imported in `src/main.tsx` via `import 'bootstrap/dist/css/bootstrap.min.css'`.

Continuous Deployment


This repository includes a GitHub Actions workflow that builds the Vite app and deploys the `dist/` folder to your host via FTP when you push to the `main` branch.

Required repository secrets (Settings → Secrets → Actions):
- `FTP_HOST` — the FTP server host or IP.
- `FTP_USERNAME` — the FTP account username.
- `FTP_PASSWORD` — the FTP account password.
- `FTP_DEST` — the destination directory on the FTP server (e.g. `/public_html/learningapp`).
- `FTP_PORT` (optional) — server port (default 21).
- `FTP_PROTOCOL` (optional) — protocol to use (e.g. `ftps`).

The workflow runs on pushes to `main`. It executes `npm ci`, `npm run build` and then uploads `./dist/` to the FTP server using the `SamKirkland/FTP-Deploy-Action`.

Make sure the FTP user has write permissions to `FTP_DEST`.
Note about the badge

The badge at the top shows the status of the `deploy.yml` workflow on the `main` branch. It will display once the workflow has run at least once on GitHub Actions.

