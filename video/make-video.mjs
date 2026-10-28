// Records the Assent demo video end to end: narrates each scene with TTS, drives the live site
// in a real browser (child's app and parent's phone side by side), and muxes voice + video with ffmpeg.
//
//   npm run make --prefix video            # macOS "Daniel" voice, free, offline
//   ELEVENLABS_API_KEY=... in video/.env   # more natural voice (optional ELEVENLABS_VOICE_ID)
//   SITE=http://localhost:3100 npm run make --prefix video
//
// Output: video/out/assent-demo.mp4. Uses real Base Sepolia transactions on the target site.

import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "out");
const SITE = (process.env.SITE ?? "https://assent-sage.vercel.app").replace(/\/$/, "");
loadEnv(join(HERE, ".env"));
loadEnv(join(HERE, "..", ".env.local"), "ELEVENLABS_");

// One entry per scene: what the voice says and the short chapter label shown on screen.
const SCENES = [
  {
    id: "hook",
    label: "The problem",
    text: "Ask a nine-year-old, are you over thirteen? and they tap yes. That's how most kids' apps get consent. Apps that check properly collect parents' IDs and card details instead. And when a regulator asks for proof, the app has a row in its own database.",
  },
  {
    id: "what",
    label: "Assent",
    text: "Assent fixes all three. Parents give revocable consent, apps get proof without learning who the child is, and every consent is signed by the parent on a ledger nobody can quietly edit.",
  },
  {
    id: "child",
    label: "The child asks",
    text: "Doodle Quest, a kids' drawing app, uses Assent. Before collecting anything, it explains to the child in plain words what it wants, and shows a QR code for their parent.",
  },
  {
    id: "scan",
    label: "The parent decides",
    text: "The parent scans it on their own phone. They proved once that they're an adult. Here that ID check is simulated; in production it's a provider like Smile ID or Yoti.",
  },
  {
    id: "review",
    label: "The parent decides",
    text: "They see each use: why, what data, how long it's kept, and who it's shared with. Optional ones start off, and Approve and Decline look the same, so nothing nudges them to share.",
  },
  {
    id: "approve",
    label: "The parent decides",
    text: "Sharing drawings with friends: yes. Voice and analytics: no. Approve and sign, with a key only the parent holds.",
  },
  {
    id: "unlock",
    label: "The app gets proof, not identity",
    text: "The child's device unlocks on its own, with only what the parent allowed. And the app knows just this: a random ID that only works here, and under thirteen. No name, no birthday, nothing linking this child across apps.",
  },
  {
    id: "withdraw",
    label: "Withdraw any time",
    text: "Parents can change their mind at any time. One tap, and the app's next check fails. The child's device locks within seconds, and the app is told to delete the data.",
  },
  {
    id: "audit",
    label: "Proof for regulators",
    text: "Now the part lawyers care about. Any auditor or regulator can look up this consent: when it was granted, when it was withdrawn, and the exact notice the parent agreed to. The matching hash proves nothing changed since they signed.",
  },
  {
    id: "legal",
    label: "Mapped to the law",
    text: "We mapped Assent against COPPA, GDPR Article 8, the UK Children's Code and Nigeria's Data Protection Act, and we marked honestly where it's not there yet.",
  },
  {
    id: "close",
    label: "",
    text: "Assent: parents decide, apps get proof, children stay anonymous.",
  },
];

await main();

async function main() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(join(OUT, "audio"), { recursive: true });

  console.log("1/4 Generating narration…");
  for (const s of SCENES) Object.assign(s, await narrate(s));
  const speech = SCENES.reduce((n, s) => n + s.duration, 0);
  console.log(`    ${SCENES.length} clips, ${speech.toFixed(1)}s of speech (${voiceName()})`);

  const browser = await chromium.launch();
  try {
    console.log("2/4 Setting up a verified test parent…");
    const storageState = await setupParent(browser);

    console.log("3/4 Recording the demo…");
    const { videoPath, starts } = await record(browser, storageState);

    console.log("4/4 Mixing voice and video…");
    const file = mux(videoPath, starts);
    const length = probe(file);
    console.log(`\nDone: ${file} (${length.toFixed(1)}s)`);
    if (length > 180) console.log("Warning: longer than 3 minutes. Trim the narration in SCENES.");
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------- narration

function voiceName() {
  return process.env.ELEVENLABS_API_KEY ? "ElevenLabs" : `macOS ${process.env.SAY_VOICE ?? "Daniel"}`;
}

async function narrate(scene) {
  const base = join(OUT, "audio", scene.id);
  let file;
  if (process.env.ELEVENLABS_API_KEY) {
    const voice = process.env.ELEVENLABS_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb";
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({ text: scene.text, model_id: "eleven_multilingual_v2" }),
    });
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
    file = `${base}.mp3`;
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  } else {
    const aiff = `${base}.aiff`;
    execFileSync("say", ["-v", process.env.SAY_VOICE ?? "Daniel", "-r", "168", "-o", aiff, scene.text]);
    file = `${base}.wav`;
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", aiff, "-ar", "44100", file]);
  }
  return { audio: file, duration: probe(file) };
}

function probe(file) {
  const out = execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file,
  ]);
  return Number(out.toString().trim());
}

// ---------------------------------------------------------------- browser

/** Creates a parent key, passes the (simulated) ID check and adds a child, off camera. */
async function setupParent(browser) {
  const context = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${SITE}/parent`);
  await page.getByRole("button", { name: "Create my parent key" }).click();
  await page.getByRole("button", { name: "Run ID check" }).click();
  await page.getByRole("heading", { name: "Verified adult" }).waitFor({ timeout: 90_000 });
  await page.getByPlaceholder("e.g. Ada").fill("Ada");
  await page.getByRole("button", { name: "Add child" }).click();
  await page.getByText("born ").first().waitFor();
  const state = await context.storageState();
  await context.close();
  return state;
}

async function record(browser, storageState) {
  const size = { width: 1920, height: 1080 };
  const context = await browser.newContext({
    storageState,
    viewport: size,
    deviceScaleFactor: 1,
    recordVideo: { dir: join(OUT, "raw"), size },
  });
  const page = await context.newPage();
  const videoStart = Date.now();
  const now = () => Date.now() - videoStart;

  // The stage is served on the site's own origin so both frames share the parent's storage.
  await page.route(`${SITE}/__stage`, (route) =>
    route.fulfill({ contentType: "text/html", body: stageHtml(readFileSync(join(HERE, "..", "src", "app", "icon.svg"), "utf8")) }),
  );
  await page.goto(`${SITE}/__stage`);
  const main = page.frame({ name: "main" });
  const phone = page.frame({ name: "phone" });

  const starts = [];
  const scene = async (id, actions) => {
    const s = SCENES.find((x) => x.id === id);
    const t0 = now();
    starts.push({ audio: s.audio, at: t0 });
    if (s.label) await page.evaluate((l) => window.stage.label(l), s.label);
    await actions();
    const left = s.duration * 1000 + 700 - (now() - t0);
    if (left > 0) await page.waitForTimeout(left);
  };

  const mode = (m) => page.evaluate((x) => window.stage.mode(x), m);
  const go = async (frame, path) => {
    await frame.goto(path.startsWith("http") ? path : `${SITE}${path}`);
    await frame.waitForLoadState("networkidle").catch(() => {});
  };

  await mode("full");
  await go(main, "/");
  await page.waitForTimeout(600);

  await scene("hook", async () => {
    await page.waitForTimeout(3500);
    await smoothScroll(main, "Tick-box age gates prove nothing");
  });

  await scene("what", async () => {
    await smoothScroll(main, "How it works");
  });

  await scene("child", async () => {
    await go(main, "/demo/doodle-quest");
    await go(phone, "/parent");
    await mode("split");
    await main.getByText("What does this mean?").waitFor();
    await page.waitForTimeout(3000);
    await smoothScroll(main, "Waiting for your grown-up");
  });

  let requestUrl;
  await scene("scan", async () => {
    requestUrl = await main.getByRole("link", { name: /Open the request link/ }).getAttribute("href");
    await flash(main.locator("img[alt*='QR code']"));
    await go(phone, requestUrl);
    await phone.getByText("would like your permission").waitFor();
  });

  await scene("review", async () => {
    await smoothScroll(phone, "What Doodle Quest is asking for");
    await page.waitForTimeout(2500);
    await smoothScroll(phone, "Anonymous usage statistics");
  });

  await scene("approve", async () => {
    await click(phone.getByRole("checkbox", { name: "Share drawings with approved friends" }));
    await smoothScroll(phone, "Approve and sign");
    await click(phone.getByRole("button", { name: "Approve and sign" }));
    await phone.getByText("is now allowed").waitFor({ timeout: 90_000 });
  });

  await scene("unlock", async () => {
    await main.getByText("Grown-up approved").waitFor({ timeout: 60_000 });
    await page.waitForTimeout(2500);
    await smoothScroll(main, "What Doodle Quest knows about this child");
  });

  let auditUrl;
  await scene("withdraw", async () => {
    await go(phone, "/parent");
    await smoothScroll(phone, "Permissions you");
    auditUrl = await phone.getByRole("link", { name: "View audit record" }).first().getAttribute("href");
    await click(phone.getByRole("button", { name: "Withdraw permission" }).first());
    await main.getByText(/turned off Doodle Quest/).waitFor({ timeout: 60_000 });
  });

  await scene("audit", async () => {
    await mode("full");
    await go(main, auditUrl);
    await main.getByText("Hash matches the signed record").waitFor({ timeout: 30_000 });
    await page.waitForTimeout(3000);
    await smoothScroll(main, "Consent receipt");
    await flash(main.getByText("Hash matches the signed record"));
  });

  await scene("legal", async () => {
    await go(main, "/legal");
    await page.waitForTimeout(1500);
    await smoothScroll(main, "COPPA (United States)");
    await page.waitForTimeout(1500);
    await smoothScroll(main, "Nigeria Data Protection Act 2023");
  });

  await scene("close", async () => {
    await page.evaluate(() => window.stage.endCard());
  });
  await page.waitForTimeout(2500);

  const video = page.video();
  await context.close();
  return { videoPath: await video.path(), starts };
}

async function smoothScroll(frame, text) {
  await frame
    .getByText(text, { exact: false })
    .first()
    .evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" }));
  await frame.page().waitForTimeout(1200);
}

/** Highlights an element briefly so viewers can see what's being clicked. */
async function flash(locator) {
  await locator.first().evaluate((el) => {
    el.style.transition = "outline-color .2s";
    el.style.outline = "5px solid #f59f00";
    el.style.outlineOffset = "4px";
    setTimeout(() => (el.style.outline = "none"), 1400);
  });
  await locator.first().page().waitForTimeout(900);
}

async function click(locator) {
  await locator.first().scrollIntoViewIfNeeded();
  await flash(locator);
  await locator.first().click();
}

function stageHtml(logoSvg) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box} html,body{margin:0;height:100%}
  body{font-family:-apple-system,"Helvetica Neue",Arial,sans-serif;background:radial-gradient(circle at 20% 0%,#2b3a8c,#151a33 60%);
    color:#fff;overflow:hidden}
  header{position:absolute;top:0;left:0;right:0;height:72px;display:flex;align-items:center;gap:14px;padding:0 40px}
  header svg{width:40px;height:40px} header b{font-size:26px;letter-spacing:.3px}
  #label{margin-left:auto;font-size:22px;padding:8px 18px;border-radius:999px;background:rgba(255,255,255,.12)}
  #stage{position:absolute;top:84px;left:40px;right:40px;bottom:64px;display:flex;gap:40px;align-items:center;justify-content:center}
  .laptop{position:relative;flex:1;height:100%;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 20px 60px rgba(0,0,0,.45);transition:flex .6s}
  .laptop iframe,.phone iframe{border:0;width:100%;height:100%;background:#fff}
  /* Render the site at a narrower width and scale it up, so text stays readable on a 1080p video. */
  .laptop iframe{position:absolute;top:0;left:0;width:calc(100% / 1.35);height:calc(100% / 1.35);transform:scale(1.35);transform-origin:0 0}
  .phonewrap{width:0;opacity:0;transition:width .6s,opacity .6s;display:flex;flex-direction:column;align-items:center}
  .split .phonewrap{width:430px;opacity:1}
  .phone{width:410px;height:860px;border-radius:48px;border:14px solid #0d0f1a;overflow:hidden;background:#fff;
    box-shadow:0 20px 60px rgba(0,0,0,.5)}
  .tag{font-size:18px;opacity:.8;margin:10px 0 0}
  .lap-tag{position:absolute;bottom:16px;left:56px;margin:0;font-size:18px;opacity:0;transition:opacity .6s}
  .split .lap-tag{opacity:.8}
  #end{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:28px;
    background:radial-gradient(circle at 50% 30%,#2b3a8c,#151a33 70%)}
  #end svg{width:180px;height:180px} #end h1{font-size:72px;margin:0} #end p{font-size:30px;margin:0;opacity:.85}
</style></head><body>
<header>${logoSvg}<b>Assent</b><span id="label"></span></header>
<div id="stage">
  <div class="laptop"><iframe name="main" src="about:blank"></iframe></div>
  <div class="phonewrap"><div class="phone"><iframe name="phone" src="about:blank"></iframe></div><p class="tag">Parent's phone</p></div>
</div>
<p class="lap-tag">Child's device: Doodle Quest</p>
<div id="end">${logoSvg}<h1>Assent</h1><p>Parents decide. Apps get proof. Children stay anonymous.</p>
  <p style="font-size:24px;opacity:.7">assent-sage.vercel.app &middot; github.com/michaelO93/assent</p></div>
<script>
window.stage={
  mode(m){document.body.classList.toggle('split',m==='split')},
  label(t){document.getElementById('label').textContent=t},
  endCard(){document.getElementById('end').style.display='flex'}
};
</script></body></html>`;
}

// ---------------------------------------------------------------- ffmpeg

function mux(videoPath, starts) {
  // Trim the blank moment before the first scene, and shift every clip to match.
  const trim = Math.max(0, starts[0].at - 300) / 1000;
  const inputs = ["-y", "-loglevel", "error", "-ss", trim.toFixed(3), "-i", videoPath];
  const filters = [];
  starts.forEach((s, i) => {
    inputs.push("-i", s.audio);
    const ms = Math.max(0, Math.round(s.at - trim * 1000));
    filters.push(`[${i + 1}:a]aresample=44100,adelay=${ms}|${ms}[a${i}]`);
  });
  filters.push(`${starts.map((_, i) => `[a${i}]`).join("")}amix=inputs=${starts.length}:normalize=0[aout]`);

  const file = join(OUT, "assent-demo.mp4");
  execFileSync("ffmpeg", [
    ...inputs,
    "-filter_complex", filters.join(";"),
    "-map", "0:v", "-map", "[aout]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "30",
    "-c:a", "aac", "-b:a", "192k",
    "-movflags", "+faststart",
    file,
  ]);
  return file;
}

/** Loads KEY=value lines into process.env; with `prefix`, only keys starting with it. */
function loadEnv(path, prefix = "") {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && m[1].startsWith(prefix) && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
