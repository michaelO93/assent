// How Assent maps to children's data-protection law. Kept honest on purpose: "partial" and
// "gap" rows are the roadmap. This is a prototype analysis, not legal advice.

export type Status = "addressed" | "partial" | "gap";

export type Requirement = { rule: string; cite: string; how: string; status: Status; note?: string };

export type Law = {
  id: string;
  name: string;
  scope: string;
  requirements: Requirement[];
};

export const LAWS: Law[] = [
  {
    id: "coppa",
    name: "COPPA (United States)",
    scope: "16 CFR Part 312, as amended in 2025. Children under 13.",
    requirements: [
      {
        rule: "Verifiable parental consent before collecting a child's personal information",
        cite: "§312.5",
        how: "The parent passes an identity check once, then signs each consent with a key only they hold. The app checks the registry before processing anything.",
        status: "partial",
        note: "The ID check is simulated in this prototype. A real government-ID check is among the methods the FTC recognises; as with those methods, the verified adult attests to being the parent.",
      },
      {
        rule: "Direct notice to parents of what is collected, how it is used and who receives it",
        cite: "§312.4",
        how: "The consent screen lists every data use with its purpose, data types, retention and recipients, plus the operator's contact details and a link to the full privacy policy. The receipt binds the consent to that exact notice version, and older versions stay auditable.",
        status: "addressed",
      },
      {
        rule: "Separate consent before disclosing a child's data to third parties",
        cite: "§312.5, 2025 amendments",
        how: "Every use that shares data with someone else is its own optional permission, unticked by default and recorded separately.",
        status: "addressed",
      },
      {
        rule: "Parents can revoke consent and stop further collection",
        cite: "§312.6",
        how: "One tap withdraws consent. The app's next check fails, and the withdrawal time is on the record.",
        status: "addressed",
      },
      {
        rule: "Parents can have their child's data deleted",
        cite: "§312.6",
        how: "Withdrawal tells the app to stop and delete, but Assent cannot yet confirm that the app did.",
        status: "gap",
        note: "Roadmap: apps post a signed deletion confirmation to the registry, visible to the parent.",
      },
      {
        rule: "Collect no more than reasonably necessary",
        cite: "§312.7",
        how: "Apps receive an age band and a random per-app ID. Never a name, birthday or anything that links the child across apps.",
        status: "addressed",
      },
      {
        rule: "Written data retention policy",
        cite: "§312.10, 2025 amendments",
        how: "Each data use states how long it is kept; the parent sees it and the receipt records it.",
        status: "partial",
        note: "The app still needs its own written policy. Assent makes the commitment visible and provable.",
      },
    ],
  },
  {
    id: "gdpr",
    name: "GDPR (European Union)",
    scope: "Articles 5, 7, 8, 17 and 25. Parental consent below the national age of 13 to 16.",
    requirements: [
      {
        rule: "Below the national digital-consent age, consent is given or authorised by the parent",
        cite: "Art. 8(1)",
        how: "The child's age band decides whether parental consent is needed, and only the parent can sign it.",
        status: "partial",
        note: "Bands are under 13, 13 to 15 and 16 to 17, so countries that set the age at 14 or 15 cannot be told apart. Roadmap: bands per jurisdiction.",
      },
      {
        rule: "Reasonable efforts to verify that consent comes from the parent",
        cite: "Art. 8(2)",
        how: "An identity check on the adult plus a cryptographic signature on every grant and withdrawal.",
        status: "addressed",
        note: "With a real identity provider in place of the simulated one.",
      },
      {
        rule: "The controller must be able to demonstrate consent",
        cite: "Art. 7(1)",
        how: "Every consent is signed by the parent and recorded on a public ledger. Anyone can rebuild the receipt and check its hash. Neither the app nor Assent can backdate or alter it.",
        status: "addressed",
      },
      {
        rule: "Withdrawal at any time, as easy as giving consent",
        cite: "Art. 7(3)",
        how: "Withdrawing is one tap from the same dashboard, and it takes effect on the app's next check.",
        status: "addressed",
      },
      {
        rule: "Data minimisation and data protection by design",
        cite: "Art. 5(1)(c), Art. 25",
        how: "The child's name and birth year never leave the parent's device. The ledger holds only pseudonyms, an age band, permissions and hashes.",
        status: "addressed",
      },
      {
        rule: "Right to erasure, on an append-only ledger",
        cite: "Art. 17, Recital 26",
        how: "No direct identifiers go on-chain. The child pseudonym is derived from a secret on the parent's device; deleting that secret leaves the on-chain value unlinkable to anyone.",
        status: "partial",
        note: "Pseudonymised data is still personal data, and the parent's signing address stays linkable while in use. The EDPB's 2025 blockchain guidelines favour keeping personal data off-chain. Roadmap: a fresh key per consent and commitments in place of addresses.",
      },
    ],
  },
  {
    id: "uk",
    name: "UK Children's Code",
    scope: "ICO Age Appropriate Design Code, under-18s. UK GDPR consent age is 13.",
    requirements: [
      {
        rule: "High privacy by default",
        cite: "Standard 7",
        how: "Every optional data use starts switched off. The parent must choose to turn it on.",
        status: "addressed",
      },
      {
        rule: "Data sharing and profiling off by default",
        cite: "Standards 9 and 12",
        how: "Sharing with third parties and usage analytics are separate optional permissions, off unless the parent turns them on.",
        status: "addressed",
      },
      {
        rule: "No nudge techniques toward weaker privacy",
        cite: "Standard 13",
        how: "No pre-ticked boxes, optional uses start off, and Approve and Decline are the same size and style.",
        status: "addressed",
      },
      {
        rule: "Transparency the child can understand",
        cite: "Standard 4",
        how: "Before asking a grown-up, the child sees a plain-language summary of what the app needs, what it optionally asks for, and that it never learns their name or birthday.",
        status: "partial",
        note: "The wording is not yet tailored to each age band, and nothing has been tested with children.",
      },
      {
        rule: "Tell the child when a parent controls their account",
        cite: "Standard 11",
        how: "The app shows a “Grown-up approved” badge and explains when access has been switched off.",
        status: "partial",
      },
    ],
  },
  {
    id: "ndpa",
    name: "Nigeria Data Protection Act 2023",
    scope: "Applies to children under 18.",
    requirements: [
      {
        rule: "Consent of a parent or guardian, with appropriate age and consent verification",
        cite: "s. 31",
        how: "Verified-adult parents sign each consent, and apps learn the child's age band without seeing their identity.",
        status: "addressed",
        note: "With a Nigerian identity provider (e.g. Smile ID, Dojah, VerifyMe) in place of the simulated check.",
      },
      {
        rule: "Consent must be demonstrable and can be withdrawn at any time",
        cite: "s. 26",
        how: "Signed, tamper-evident records and one-tap withdrawal.",
        status: "addressed",
      },
      {
        rule: "Covers every minor, not just under-13s",
        cite: "s. 31, s. 65",
        how: "Age bands run to 17, so the same flow covers teenagers.",
        status: "addressed",
      },
      {
        rule: "Data minimisation and purpose limitation",
        cite: "s. 24",
        how: "Each permission states one purpose and the data it needs; apps get nothing beyond the age band and a per-app ID.",
        status: "addressed",
      },
    ],
  },
];

export const HARD_QUESTIONS = [
  {
    q: "Isn't a public blockchain the opposite of privacy?",
    a: "Only what is on it matters. Assent's ledger holds no names, birthdays or documents: just a pseudonymous signing address, a per-app pseudonym, an age band and hashes. What the ledger adds is that the parent's signature, not the app's database, is the evidence.",
  },
  {
    q: "How do you know the adult is actually the child's parent?",
    a: "The same way existing recognised methods do: a verified adult attests to it. Where official records allow, a provider could also check the parent–child link, and Assent would record only that the check passed.",
  },
  {
    q: "Couldn't a child set up the parent key themselves?",
    a: "They would need to pass an adult identity check. The remaining risk, a child using a parent's ID, is the same as with credit-card verification today, and the parent's dashboard shows every consent made in their name.",
  },
  {
    q: "Doesn't Assent just become the new gatekeeper of who counts as a parent?",
    a: "Not with the Chainlink CRE workflow. Instead of an Assent key, a decentralized oracle network checks each ID session with the provider and only writes a verification if its nodes agree. The registry records who verified each parent, so an auditor can tell the two routes apart.",
  },
  {
    q: "Who is the data controller?",
    a: "The app remains the controller for its own processing. Assent acts as a consent-management service for the app, and the registry holds no direct identifiers of either parent or child.",
  },
];
