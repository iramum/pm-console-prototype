// Deal Console prototype — fictional data only. No real clients, names or figures.
// "Today" in the prototype is fixed so deadlines read the same for every viewer.
window.TODAY = new Date(2024, 10, 22); // Fri 22 Nov 2024

window.STAGES = [
  { n: 1, name: "Client Alignment", ideal: 5 },
  { n: 2, name: "Set up SPV", ideal: 14 },
  { n: 3, name: "KYC", ideal: 21 },
  { n: 4, name: "Split Shares", ideal: 10 },
  { n: 5, name: "Contracts", ideal: 7 },
  { n: 6, name: "Buying", ideal: 10 },
  { n: 7, name: "After Buying", ideal: 3 },
  { n: 8, name: "Payments", ideal: null },
  { n: 9, name: "Exit", ideal: null },
];

window.MANAGERS = ["Anna K.", "Omar H.", "Lina R."];

// whose: you | client | csp | valuer | ceo
// chip: late | left | today | silent | new
window.BASE_DEALS = [
  {
    id: "a", client: "Client A", type: "Individual", source: "Website form", origin: { type: "Client", who: "Website form" },
    property: { label: "Apartment, Downtown", kind: "Apartment, 2 bedrooms", area: "Downtown", building: "Burj Vista", size: "1,350 sq ft", market: 1650000, valuation: 1600000, valDate: "5 Nov 2024", valUntil: "5 Nov 2025", ltv: 69, mortgage: "None", deed: "Received, check pending" },
    spv: { name: "SPV Cedar 07", status: "Registered", reg: "FZ-204518", regOn: "12 Nov 2024", jurisdiction: "Free zone, Dubai", address: "Office 1204, Business Bay, Dubai", renewal: "11 Nov 2025", trn: "1004 2231 8890 003", vat: "Not registered", csp: "Harbour CS", bank: "Opening" },
    terms: { amount: 1100000, asked: 1250000, rate: 14, months: 12, neededBy: "15 Jan 2025", purpose: "Bridge until another property is sold", fee: "Monthly", serviceFee: 15000, serviceFeePaid: "Invoice paid 08 Nov" },
    stage: 3, parallel: 4, day: 31,
    forecast: { date: "27 Dec 2024", cond: "if KYC closes this week", spare: "15 Jan 2025, 19 days to spare", holds: "Client's 2 KYC documents, 10 days late" },
    actions: [
      { id: "a1", whose: "client", stage: "03 KYC", title: "Send 2 documents", sub: "Employment letter, CSP forms", chip: ["late", "10 days late"], btn: "Remind", panel: "remind" },
      { id: "a2", whose: "you", stage: "Needs your check", title: "Check 5 uploaded files", sub: "One may be the wrong document", chip: ["new", "New"], btn: "Check files", panel: "check" },
      { id: "a3", whose: "you", stage: "04 Split Shares", title: "Send share form to CSP", sub: "Does not wait for KYC", chip: ["left", "10 days left"], btn: "Send form", panel: "form" },
    ],
    missing: ["Employment letter", "Signed CSP forms"],
    uploads: [
      { file: "title_deed_p1.pdf", as: "Title Deed" }, { file: "title_deed_p2.pdf", as: "Title Deed" },
      { file: "title_deed_p3.pdf", as: "Title Deed" }, { file: "title_deed_p4.pdf", as: "Title Deed" },
      { file: "scan_0412.pdf", as: "Title Deed", suspect: "Looks like a Sales Purchase Agreement" },
    ],
    docs: {
      "03 KYC": { done: 4, total: 7, received: ["Passport", "Proof of address", "Bank statement", "Tax return"], csp: ["Source of wealth form"] },
      "04 Split Shares": { done: 0, total: 3, received: [], csp: [] },
    },
    contact: { last: "Call, 19 Nov, 12 min", quote: "Will ask HR for the letter, expects it by Friday.", next: "Follow-up call", nextWhen: "Fri 22 Nov, after 17:00", today: true, reach: "WhatsApp, after 17:00", prefs: "English, portal last in 18 Nov", also: "Also: email, phone" },
    team: [["AK", "Anna K., manager, you", "Call with the client, 19 Nov"], ["MS", "Mira S., documents", "Checked the KYC pack, 18 Nov"], ["CEO", "CEO and CFO, economics", "Signed the economics, 06 Nov"]],
    activity: [["Client", "Uploaded 5 files", "18 Nov, 1 needs your check"], ["CSP", "Started the wealth review", "18 Nov, nothing needed from you"], ["Mira S.", "Checked the KYC pack", "18 Nov, 4 files fine, 1 sent back"], ["Mira S.", "Sent the KYC pack to the CSP", "06 Nov"], ["CSP", "Asked for the employment letter", "14 Nov, now in Next actions"], ["You", "Called the client about the employment letter", "15 Nov"], ["CEO", "CEO and CFO signed the economics", "06 Nov"], ["Client", "Signed the Service Agreement", "01 Nov"]],
    history: [
      ["19 Nov", "Call, 12 min", "You", "Client will ask HR for the employment letter, expects it by Friday."],
      ["18 Nov", "Portal", "Client", "Uploaded 5 files as Title Deed. «I uploaded all documents.»"],
      ["14 Nov", "Email", "CSP", "Needs an employment letter, signed, not older than 30 days."],
      ["12 Nov", "WhatsApp", "You", "Reminder about the signed CSP forms."],
      ["06 Nov", "Team note", "Mira S.", "KYC pack sent to Harbour CS."],
    ],
  },
  {
    id: "b", client: "Client B", type: "Company", source: "Broker", origin: { type: "Broker", who: "Prime Realty", pct: 1.5 },
    property: { label: "Townhouse, JVC", kind: "Townhouse, 3 bedrooms", area: "JVC", building: "Bloom Gardens", size: "2,100 sq ft", market: 1250000, valuation: 1200000, valDate: "1 Nov 2024", valUntil: "1 Nov 2025", ltv: 63, mortgage: "None", deed: "Received" },
    spv: { name: "SPV not yet", status: "Not set up yet", reg: "", regOn: "", jurisdiction: "Free zone, Dubai", address: "", renewal: "", trn: "Waiting on the CSP", vat: "Not registered", csp: "Harbour CS", bank: "Not yet" },
    terms: { amount: 750000, asked: 800000, rate: 16, months: 12, neededBy: "20 Jan 2025", purpose: "Working capital", fee: "Monthly" },
    stage: 2, day: 18,
    forecast: { date: "14 Jan 2025", cond: "if the SPV is registered this week", spare: "20 Jan 2025, 6 days to spare", holds: "Tax registration number from the CSP, 4 days late" },
    actions: [{ id: "b1", whose: "csp", stage: "02 Set up SPV", title: "Tax registration number", sub: "Harbour CS promised it on 18 Nov", chip: ["late", "4 days late"], btn: "Email CSP", panel: "remind" }],
    missing: ["Tax registration number"],
  },
  {
    id: "e", client: "Client E", type: "Individual", source: "Referral", origin: { type: "Partner", who: "Gulf Wealth Partners", pct: 1 },
    property: { label: "Townhouse, Dubai Hills", kind: "Townhouse, 4 bedrooms", area: "Dubai Hills", building: "Maple 2", size: "2,900 sq ft", market: 2900000, valuation: 2800000, valDate: "3 Apr 2024", valUntil: "3 Apr 2025", ltv: 64, mortgage: "None", deed: "Held by the SPV" },
    spv: { name: "SPV Elm 02", status: "Registered", reg: "FZ-198764", regOn: "10 Apr 2024", jurisdiction: "Free zone, Dubai", address: "Office 602, JLT, Dubai", renewal: "9 Apr 2025", trn: "1004 1987 6410 003", vat: "Not registered", csp: "Harbour CS", bank: "Open" },
    terms: { amount: 1800000, rate: 14, months: 12, neededBy: "30 May 2024", purpose: "Buy before selling another home", fee: "Monthly" },
    stage: 8, day: 0,
    payments: { paid: 5, of: 12, fee: 21000, lateNo: 6, lateDays: 4, nextDue: "18 Dec 2024" },
    forecast: { date: "Fee 6 of 12", cond: "was due 18 Nov", spare: "Exit planned May 2025", holds: "Fee 6 of 12 not paid, 4 days late" },
    actions: [{ id: "e1", whose: "client", stage: "08 Payments", title: "Fee 6 of 12", sub: "Was due 18 Nov, reminder sent 20 Nov", chip: ["late", "4 days late"], btn: "Remind", panel: "remind" }],
    missing: [],
  },
  {
    id: "f", client: "Client F", type: "Company", source: "Referral", origin: { type: "Partner", who: "Atlas Family Office", pct: 1 }, step01: 1,
    property: { label: "Villa, Arabian Ranches", kind: "Villa, 4 bedrooms", area: "Arabian Ranches", building: "Saheel", size: "4,200 sq ft", market: 3200000, valuation: 3100000, valDate: "15 Nov 2024", valUntil: "15 Nov 2025", ltv: 68, mortgage: "None", deed: "Received" },
    spv: { name: "SPV not yet", status: "Not started", reg: "", regOn: "", jurisdiction: "", address: "", renewal: "", trn: "", vat: "", csp: "Harbour CS", bank: "" },
    terms: { amount: 2100000, asked: 2400000, rate: 18, months: 12, neededBy: "1 Feb 2025", purpose: "Working capital for a fit-out", fee: "Monthly" },
    stage: 1, day: 4, ceo: true,
    forecast: { date: "After the CEO and CFO sign", cond: "expected by 25 Nov", spare: "1 Feb 2025", holds: "Economics with the CEO and the CFO, version 2" },
    actions: [{ id: "f1", whose: "ceo", stage: "01 Client Alignment", title: "Economics: CEO and CFO sign", sub: "Version 2 after the valuation: $2.1M of $2.4M asked. Sent 20 Nov", chip: ["left", "decision by 25 Nov"], btn: "View request", panel: "ceo" }],
    missing: [],
  },
  {
    id: "c", client: "Client C", type: "Individual", source: "Broker", origin: { type: "Broker", who: "Skyline Brokers", pct: 1.5 },
    property: { label: "Office, Business Bay", kind: "Office", area: "Business Bay", building: "Bay Square 4", size: "1,100 sq ft", market: 1400000, valuation: 1370000, valDate: "2 Oct 2024", valUntil: "2 Oct 2025", ltv: 62, mortgage: "None", deed: "Received" },
    spv: { name: "SPV Birch 05", status: "Registered", reg: "FZ-203977", regOn: "10 Oct 2024", jurisdiction: "Free zone, Dubai", address: "Office 803, JLT, Dubai", renewal: "9 Oct 2025", trn: "1004 2231 8711 120", vat: "Not registered", csp: "Harbour CS", bank: "Open" },
    terms: { amount: 850000, asked: 900000, rate: 15, months: 12, neededBy: "20 Dec 2024", purpose: "Buy before another sale closes", fee: "Monthly" },
    stage: 5, day: 3,
    forecast: { date: "12 Dec 2024", cond: "if contracts are signed this week", spare: "20 Dec 2024, 8 days to spare", holds: "Your move: send contracts" },
    actions: [{ id: "c1", whose: "you", stage: "05 Contracts", title: "Send contracts to sign", sub: "Drafts approved 20 Nov", chip: ["left", "4 days left"], btn: "Send", panel: "form" }, { id: "c2", whose: "you", stage: "05 Contracts", title: "Hand over to funding", sub: "After signing and the down payment. The CEO allocates the capital", chip: ["left", "after signing"], btn: "Hand over", panel: "fund" }],
    missing: [],
  },
  {
    id: "d", client: "Client D", type: "Individual", source: "Website form", origin: { type: "Client", who: "Instagram ad" },
    property: { label: "Apartment, Marina", kind: "Apartment, 1 bedroom", area: "Dubai Marina", building: "Marina Gate 2", size: "820 sq ft", market: 1150000, valuation: 1100000, valDate: "20 Sep 2024", valUntil: "20 Sep 2025", ltv: 66, mortgage: "None", deed: "Received" },
    spv: { name: "SPV Pine 03", status: "Registered", reg: "FZ-202113", regOn: "30 Sep 2024", jurisdiction: "Free zone, Dubai", address: "Office 410, Business Bay, Dubai", renewal: "29 Sep 2025", trn: "1004 2021 1301 220", vat: "Not registered", csp: "Harbour CS", bank: "Open" },
    terms: { amount: 720000, asked: 720000, rate: 14, months: 12, neededBy: "5 Dec 2024", purpose: "Bridge until another property is sold", fee: "Monthly" },
    stage: 6, day: 6,
    forecast: { date: "2 Dec 2024", cond: "if the registry fee is paid today", spare: "5 Dec 2024, 3 days to spare", holds: "Your move: pay the registry fee" },
    actions: [{ id: "d1", whose: "you", stage: "06 Buying", title: "Pay the registry fee", sub: "Invoice from the registry, 19 Nov", chip: ["left", "4 days left"], btn: "Pay", panel: "form" }],
    missing: [],
  },
];

window.LEADS = [
  { client: "Client M", today: true, start: true, act: "start", btn: "Start the deal", amount: 1150000, og: "Broker", src: "Dune Property, 12 Nov", done: 4, docs: 5, ltv: 62, line: "Screening passed, first reply sent", prop: "Villa, The Springs", chip: ["new", "Ready today"] },
  { client: "Client R", today: true, act: "wa", btn: "Call", amount: 1300000, og: "Partner", src: "Gulf Wealth Partners, 1 hour ago", done: 0, docs: 0, ltv: null, line: "New application: reply first", prop: "Office, JLT", chip: ["new", "New"] },
  { client: "Client G", today: true, act: "wa", amount: 600000, og: "Client", src: "Website form, 2 hours ago", done: 1, docs: 0, ltv: null, line: "First contact due today, by WhatsApp", btn: "WhatsApp", prop: "Apartment, JVC", chip: ["today", "Due today"] },
  { client: "Client H", today: true, coral: true, act: "ceo", amount: 1770000, og: "Partner", src: "Atlas Family Office, 30 Oct", done: 3, docs: 5, ltv: 68, line: "Screening: LTV 68%, above the 65% standard", pill: "LTV 68%", btn: "Send to CEO and CFO", prop: "Villa, Dubai Hills", chip: ["today", "Reply due today"] },
  { client: "Client P", today: true, act: "decline", amount: 900000, og: "Client", src: "Instagram ad, 19 Nov", done: 3, docs: 4, ltv: 55, line: "Leasehold: does not fit", btn: "Close as Declined", prop: "Apartment, Palm Jumeirah", chip: ["today", "Reply due today"] },
  { client: "Client N", act: "remind", amount: 450000, og: "Client", src: "Website form, 18 Nov", done: 2, docs: 3, ltv: null, line: "3 of 5 screening documents in", btn: "Remind", prop: "Apartment, Business Bay", chip: ["left", "2 days left"] },
  { client: "Client O", follow: true, act: "follow", amount: 700000, og: "Broker", src: "Prime Realty, 10 Nov", done: 1, docs: 0, ltv: null, line: "No reply for 5 days after the first call", btn: "Set follow-up", prop: "Townhouse, Damac Hills", chip: ["silent", "No reply 5 days"] },
];

window.CLOSED = [
  { client: "Client Q", property: "Apartment, Marina Gate tower", area: "Dubai Marina", spv: "SPV Oak 11", stage: "09 Exit, Mar 2024" },
];

// 50-client scenario: extra synthetic deals so the same list scales.
(function () {
  const areas = [["Apartment", "JLT"], ["Apartment", "Business Bay"], ["Villa", "Jumeirah Golf Estates"], ["Townhouse", "Mira"], ["Apartment", "Creek Harbour"], ["Villa", "Dubai Hills"], ["Office", "JLT"], ["Apartment", "Marina"], ["Townhouse", "Damac Hills"], ["Apartment", "Palm Jumeirah"], ["Villa", "The Springs"], ["Apartment", "City Walk"]];
  const trees = ["Ash", "Fir", "Larch", "Rowan", "Willow", "Yew", "Alder", "Hazel", "Juniper", "Poplar", "Spruce", "Lime"];
  const tpl = [
    { stage: 8, whose: "client", title: "Fee {k} of 12", chip: ["late", "2 days late"] },
    { stage: 1, whose: "you", title: "Send the Term Sheet", chip: ["today", "Due today"] },
    { stage: 3, whose: "you", title: "Check 3 new files", chip: ["new", "3 new files"] },
    { stage: 3, whose: "client", title: "Send proof of address", chip: ["silent", "No reply for 50 h"] },
    { stage: 8, whose: "you", title: "Plan the exit with the client", chip: ["today", "Due today"] },
    { stage: 1, whose: "you", title: "Economics signed: issue the term sheet", chip: ["new", "Signed today"] },
    { stage: 5, whose: "you", title: "Signed contracts came back: check them", chip: ["new", "Signed today"] },
    { stage: 1, whose: "ceo", title: "Concentration above the limit", chip: ["left", "decision by 27 Nov"] },
  ];
  const calm = [
    { stage: 8, whose: "client", title: "Next fee", chip: ["left", "6 days left"] },
    { stage: 8, whose: "client", title: "Next fee", chip: ["left", "12 days left"] },
    { stage: 3, whose: "client", title: "Send bank statement", chip: ["left", "5 days left"] },
    { stage: 2, whose: "csp", title: "Register the SPV", chip: ["left", "8 days left"] },
    { stage: 4, whose: "csp", title: "Update the share register", chip: ["left", "6 days left"] },
    { stage: 6, whose: "you", title: "Book the registry slot", chip: ["left", "7 days left"] },
    { stage: 5, whose: "client", title: "Sign the contracts", chip: ["left", "3 days left"] },
    { stage: 7, whose: "you", title: "File the new title deed", chip: ["left", "2 days left"] },
    { stage: 9, whose: "client", title: "Capital returns at exit", chip: ["left", "21 days left"] },
  ];
  const letters = "IJKLMNOPRSTUVWXYZ".split("");
  const extra = [];
  for (let i = 0; i < 44; i++) {
    const urgent = i < 8;
    const t = urgent ? tpl[i] : calm[i % calm.length];
    const [kind, area] = areas[i % areas.length];
    const name = i < letters.length ? "Client " + letters[i] : "Client " + letters[i % letters.length] + (Math.floor(i / letters.length) + 1);
    const k = 3 + (i % 8);
    extra.push({
      id: "x" + i, client: name, synthetic: true, type: i % 3 ? "Individual" : "Company", source: ["Website form", "Broker", "Referral"][i % 3],
      property: { label: kind + ", " + area, kind, area, building: "", market: 900000 + i * 37000, valuation: 880000 + i * 36000, ltv: 55 + (i % 14), mortgage: "None", deed: "Received" },
      spv: t.stage >= 3 ? { name: "SPV " + trees[i % trees.length] + " " + String(10 + i).padStart(2, "0"), reg: "FZ-2" + String(105120 + i * 37), status: "Registered", csp: "Harbour CS" } : { name: "SPV not yet", csp: "Harbour CS" },
      terms: { amount: 500000 + (i % 9) * 150000, asked: 500000 + (i % 9) * 150000 + (i % 3 === 0 ? 100000 : 0), rate: 14 + (i % 5), months: 12, neededBy: "", fee: "Monthly" },
      step01: t.stage === 1 ? (/term sheet/i.test(t.title) ? 3 : t.whose === "ceo" ? 1 : 0) : null,
      stage: t.stage, day: 2 + (i % 9),
      payments: t.stage === 8 ? { paid: k - 1, of: 12, fee: 9000 + (i % 7) * 1500, nextDue: "" } : null,
      actions: [{ id: "x" + i + "a", whose: t.whose, stage: "", title: t.title.replace("{k}", k), sub: "", chip: t.chip, btn: "Open", panel: null }],
      ceo: t.whose === "ceo", missing: [],
    });
  }
  window.EXTRA_DEALS = extra;
})();
