# Demo video generator

Records the Assent demo end to end with a real browser and an AI voiceover, so every take is identical.

```bash
npm install --prefix video
npx --prefix video playwright install chromium
npm run make --prefix video          # writes video/out/assent-demo.mp4
```

- **Voice:** the free macOS "Daniel" voice by default (`SAY_VOICE=...` to change it). For a more natural voice, put
  `ELEVENLABS_API_KEY=...` (and optionally `ELEVENLABS_VOICE_ID=...`) in `video/.env` or the app's `.env.local`;
  git ignores both.
- **Script:** the narration lives in `SCENES` in `make-video.mjs`. Each scene lasts as long as its narration (or its
  blockchain transaction, if slower), so editing a line re-times the video automatically.
- **Target:** the live site by default; `SITE=http://localhost:3100` records a local server instead.
- Each run creates a fresh test parent and makes real Base Sepolia transactions (ID check, grant, withdrawal), and
  uses one of the site's 5 ID checks per hour per IP.
