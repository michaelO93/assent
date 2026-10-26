// Data-use manifests for the demo apps. In production an app would register its manifest
// with Assent; the manifest version is part of every consent receipt, so a parent's consent
// is bound to exactly the notice they were shown. Published versions are never edited:
// a change means a new version, and old versions stay so older consents remain auditable.

export type Scope = {
  id: string;
  label: string;
  purpose: string;
  data: string[];
  retention: string;
  sharedWith: string[];
  required: boolean;
};

export type AppManifest = {
  slug: string;
  name: string;
  operator: string;
  tagline: string;
  policyUrl: string;
  /** Who parents contact about their child's data (COPPA direct notice). Added in v2. */
  contact?: { email: string; address: string };
  manifestVersion: number;
  accent: string;
  scopes: Scope[];
};

export const APPS: Record<string, AppManifest> = {
  "doodle-quest": {
    slug: "doodle-quest",
    name: "Doodle Quest",
    operator: "Doodle Quest Studios Ltd (demo)",
    tagline: "Draw, colour and go on drawing adventures",
    policyUrl: "https://example.com/doodle-quest/privacy",
    contact: { email: "privacy@doodlequest.example", address: "12 Example Street, Lagos, Nigeria" },
    manifestVersion: 2,
    accent: "#f97316",
    scopes: [
      {
        id: "account.nickname",
        label: "A nickname for their profile",
        purpose: "Show the child's chosen nickname inside the app",
        data: ["nickname"],
        retention: "Until the account is deleted",
        sharedWith: [],
        required: true,
      },
      {
        id: "progress.save",
        label: "Save drawings and game progress",
        purpose: "Let the child pick up where they left off",
        data: ["drawings", "levels completed"],
        retention: "Until the account is deleted",
        sharedWith: [],
        required: true,
      },
      {
        id: "gallery.share",
        label: "Share drawings with approved friends",
        purpose: "Show drawings to friends the parent has approved",
        data: ["drawings", "nickname"],
        retention: "Until the drawing is deleted",
        sharedWith: ["Friends approved by the parent"],
        required: false,
      },
      {
        id: "voice.narration",
        label: "Record voice narration for stories",
        purpose: "Let the child narrate their drawing stories",
        data: ["voice recordings"],
        retention: "30 days",
        sharedWith: [],
        required: false,
      },
      {
        id: "analytics.product",
        label: "Anonymous usage statistics",
        purpose: "Find which levels are too hard",
        data: ["anonymous gameplay events"],
        retention: "13 months",
        sharedWith: ["Analytics processor (EU)"],
        required: false,
      },
    ],
  },
  "math-sprout": {
    slug: "math-sprout",
    name: "Math Sprout",
    operator: "Sprout Learning (demo)",
    tagline: "Daily maths practice that grows with your child",
    policyUrl: "https://example.com/math-sprout/privacy",
    contact: { email: "privacy@mathsprout.example", address: "4 Sample Road, London, UK" },
    manifestVersion: 2,
    accent: "#16a34a",
    scopes: [
      {
        id: "account.nickname",
        label: "A nickname for their profile",
        purpose: "Show the child's chosen nickname inside the app",
        data: ["nickname"],
        retention: "Until the account is deleted",
        sharedWith: [],
        required: true,
      },
      {
        id: "progress.save",
        label: "Track practice results",
        purpose: "Adapt question difficulty to the child",
        data: ["answers", "scores"],
        retention: "2 years",
        sharedWith: [],
        required: true,
      },
      {
        id: "teacher.report",
        label: "Weekly report to their teacher",
        purpose: "Let a teacher the parent names follow progress",
        data: ["scores", "nickname"],
        retention: "End of school year",
        sharedWith: ["Teacher named by the parent"],
        required: false,
      },
    ],
  },
};

export function getApp(slug: string | null | undefined): AppManifest | undefined {
  return slug ? APPS[slug] : undefined;
}

/** v1 was the current notice minus operator contact details. */
const PREVIOUS: AppManifest[] = Object.values(APPS).map((m) => ({ ...m, contact: undefined, manifestVersion: 1 }));

/** Every published version of an app's notice, newest first. */
export function getAppVersions(slug: string | null | undefined): AppManifest[] {
  const latest = getApp(slug);
  return latest ? [latest, ...PREVIOUS.filter((m) => m.slug === latest.slug)] : [];
}

