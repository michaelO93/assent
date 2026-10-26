# Assent demo video script

**Target length:** 2:45 (keep it under 3:00). **Format:** screen recording with voiceover, laptop + phone.
**Live site:** https://assent-sage.vercel.app

The story in one line: *a child asks, the parent decides on their own phone, the app only learns what it needs, and
the parent can take it back. Every step is provable.*

---

## Before you record

- [ ] **Laptop browser:** a fresh profile or private window (no old Assent data), zoom 125% so text is readable.
      Open https://assent-sage.vercel.app/demo/doodle-quest in one tab.
- [ ] **Phone:** open https://assent-sage.vercel.app/parent once, then **Create my parent key**, **Run ID check**, and
      add a child named **Ada**. That way the recording skips setup, and you show it in one line instead.
- [ ] **Phone on screen:** on a Mac, use **iPhone Mirroring** or QuickTime → New Movie Recording → choose the iPhone, so
      the phone appears next to the laptop. On Android, use scrcpy, or film the phone separately and cut it in.
- [ ] **Second tab, ready but hidden:** https://assent-sage.vercel.app/legal
- [ ] Do one full dry run. Each approval or withdrawal takes about 3–5 seconds on Base Sepolia; that's fine on camera.
- [ ] Silence notifications. Record the voiceover separately if your room is noisy.

---

## Script

### 0:00 – 0:20 · Hook (landing page)

**Screen:** https://assent-sage.vercel.app, scroll slowly past the three problem cards.

> "When a children's app asks *'Are you over 13?'*, a nine-year-old taps *yes*. That's how most apps 'get consent'
> today. The apps that do check properly ask parents for ID and card details, and end up holding even more sensitive
> data. And when a regulator asks for proof of consent, all the app has is a row in its own database."

### 0:20 – 0:35 · What Assent is

**Screen:** stay on the landing page, then scroll to "How it works".

> "Assent fixes all three. Parents give verifiable, revocable consent. Apps get proof without ever learning who the
> child is. And every consent is signed by the parent and recorded on a public ledger nobody can quietly edit."

### 0:35 – 0:55 · The child asks (laptop)

**Screen:** laptop, Doodle Quest demo app. Point at the QR code, then the "What does this mean?" box.

> "Here's Doodle Quest, a drawing app for kids, using Assent. Before it collects anything, it asks for a grown-up.
> The child gets a plain-language explanation of what the app wants, and a QR code for their parent."

### 0:55 – 1:35 · The parent decides (phone)

**Screen:** phone scans the QR code → consent screen. Scroll through the permissions slowly. Tick **Share drawings
with approved friends**; leave voice and analytics off. Tap **Approve and sign**.

> "The parent scans it on their own phone. They verified once that they're an adult. *In this prototype that ID check
> is simulated; in production it's a provider like Smile ID or Yoti.*
>
> They see exactly what the app wants: each use, why, what data, how long it's kept, and who it's shared with.
> Everything optional starts switched off, and Approve and Decline look the same, so the design doesn't push them
> to share.
>
> They'll allow sharing drawings with friends, but not voice recordings or analytics. Approve and sign. That signature
> comes from a key on the parent's phone, so not even Assent can fake it."

### 1:35 – 1:55 · The app unlocks with the minimum (laptop)

**Screen:** laptop. The app unlocks by itself. Point at the green "Share drawings" chip and the crossed-out ones, then
scroll to "What Doodle Quest knows about this child".

> "Back on the child's device, the app unlocks on its own, and only with what the parent allowed. Look at what the app
> actually knows: a random ID that only works in this app, and the age band *under 13*. No name. No birthday. Nothing
> that links this child to any other app."

### 1:55 – 2:15 · The parent changes their mind (phone → laptop)

**Screen:** phone → https://assent-sage.vercel.app/parent → **Withdraw permission**. Then cut to the laptop as it
switches to "Your grown-up turned off Doodle Quest".

> "Parents can change their mind at any time. One tap, and the app's next check fails. The child's device locks
> within seconds, and the app is told to delete the data."

### 2:15 – 2:35 · Proof for regulators (laptop)

**Screen:** phone dashboard → **View audit record** (or open it on the laptop). Show the timeline, then the green
**"Hash matches the signed record"** badge and the receipt.

> "Now the part lawyers care about. Anyone (an auditor, a regulator, the app's compliance team) can look up this
> consent. They see when it was granted and withdrawn, and the exact notice the parent agreed to. That hash proves the
> record hasn't been altered since the parent signed it."

### 2:35 – 2:50 · The law, and the close

**Screen:** switch to the /legal tab and scroll slowly through the four laws and the status badges.

> "We mapped Assent against COPPA, GDPR Article 8, the UK Children's Code and Nigeria's Data Protection Act, and we
> marked honestly where it's not there yet.
>
> Assent: parents decide, apps get proof, children stay anonymous."

**End card (3 seconds):** `assent-sage.vercel.app` · `github.com/michaelO93/assent`

---

## If you're short on time

- **Cut to 2:00:** drop the hook to one sentence and skip the legal-page segment. Mention it in the submission text
  instead.
- **No phone available:** on the laptop, click **"Open the request link on this computer instead"** under the QR code.
  It opens the parent's view in a new tab and the original tab still unlocks by itself. Say: *"In real life this opens
  on the parent's phone."*

## Things not to say

- Don't say the ID check is real. It's simulated, and the script says so once.
- Don't claim compliance with any law. Say "mapped against" and point to the legal page, which shows the gaps.
- Don't say it runs on mainnet. It's on the Base Sepolia test network.
