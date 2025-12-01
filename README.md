# MKU Cat Reminder 🐱⏰

A small React + TypeScript app built with Vite to help MKU students (and cat lovers) remember to feed, check on, and take care of the campus cats on time.

Use it to:
- Schedule feeding times
- Track which cats you’ve seen or fed
- Get gentle reminders so no cat is forgotten

---

## Features

- 🕒 **Reminders & Schedule** – Keep track of daily/weekly feeding times.  
- 📋 **Cat List / Profiles** – Store basic info about each cat (name, location, notes).  
- ✅ **Task Checklists** – Mark tasks as done (fed, water changed, meds, etc.).  
- 💾 **Local Storage** – Data can be persisted in the browser (no backend required yet).  
- ⚡ **Fast & Modern** – Built with React, TypeScript, and Vite for a smooth developer experience.

> Note: The exact feature set depends on how far the implementation has gone in this repo. You can adjust this section to match the current UI and code.

---

## Tech Stack

- **Framework:** React
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** (Fill in: CSS / Tailwind / MUI / etc.)
- **Package Manager:** npm / yarn / pnpm (adjust based on what you use)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (recommended: latest LTS)
- npm / yarn / pnpm installed globally

### Installation

Clone the repository:

```bash
git clone https://github.com/Daniel-1600/mku-cat-reminder-.git
cd mku-cat-reminder-
```

Install dependencies:

```bash
# choose one
npm install
# or
yarn install
# or
pnpm install
```

### Running the App in Development

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Vite will print a local URL (usually `http://localhost:5173`). Open it in your browser.

---

## Building for Production

Create an optimized production build:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

Preview the production build locally:

```bash
npm run preview
# or
yarn preview
# or
pnpm preview
```

---

## Project Structure

This is the typical structure for a React + TypeScript + Vite app (actual files may vary):

```text
mku-cat-reminder-/
├─ public/              # Static assets
├─ src/
│  ├─ components/       # Reusable UI components (e.g. CatCard, ReminderList)
│  ├─ pages/            # Top-level views/screens
│  ├─ hooks/            # Custom React hooks (e.g. useReminders, useLocalStorage)
│  ├─ types/            # TypeScript type definitions & interfaces
│  ├─ App.tsx           # Root component
│  ├─ main.tsx          # Entry point
│  └─ ...               # Other files (styles, utils, etc.)
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
└─ README.md
```

Adjust this section to exactly match your repo once the structure is finalized.

---

## Development Notes

- **Linting & Formatting:**  
  If you’ve configured ESLint/Prettier, you can usually run:

  ```bash
  npm run lint
  ```

  (Update this command if your `package.json` uses a different script.)

- **Environment Variables:**  
  If you later add APIs (notifications, backend, etc.), document them here, e.g.:

  ```bash
  VITE_API_BASE_URL=https://example.com/api
  ```

  and place them in a `.env` file (which should not be committed if it contains secrets).

---

## Roadmap / Ideas

You can track planned features here:

- [ ] Push/browser notifications for reminders  
- [ ] Support for multiple locations (different MKU spots)  
- [ ] Simple login or profiles (if you add a backend)  
- [ ] Sharing schedules between volunteers  
- [ ] Dark mode (for late-night cat checks)

---

## Contributing

Contributions are welcome!

1. Fork the repo
2. Create a feature branch:  
   ```bash
   git checkout -b feature/my-new-feature
   ```
3. Commit your changes:  
   ```bash
   git commit -m "Add some feature"
   ```
4. Push the branch:  
   ```bash
   git push origin feature/my-new-feature
   ```
5. Open a Pull Request

If you’re only using this as a personal project, you can simplify this section or note that it’s mainly for your use.

---

## License

Add your preferred license here (e.g. MIT). Example:

```text
MIT License

Copyright (c) 2025 Daniel
```

(Or remove/replace this section if you haven’t chosen a license yet.)

---

## Acknowledgements

- Built with [React](https://react.dev/) + [Vite](https://vitejs.dev/).  
- Inspired by the cats at MKU and everyone who takes care of them. 🐾
