# PurpleDroid Web (Vite + React)

## Run

```bash
npm install
npm run dev
```

Default API base:

- development: `http://localhost:8001/api/v1`
- production build: `/api/v1` on the same origin

To override:

```bash
VITE_API_BASE_URL=http://localhost:8001 npm run dev
```

You can still use `VITE_API_BASE` for backward compatibility.

## Implemented flow

- Create/load session token (`localStorage`)
- Load challenges list (`GET /challenges`)
- Load challenge detail (`GET /challenges/{id}`)
- Fake terminal via `xterm.js` (`POST /terminal/exec`)
- Flag submit (`POST /submit-flag`)
- Patch toggle and submit (`POST /submit-patch`)
- Player status (`GET /me`)
