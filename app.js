// Workspace — interactive prototype. Vanilla JS, no build step.
(function () {
  const $app = document.getElementById("app");
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const S = {
    scale: 6, filter: "all", q: "", searchOpen: false, exportOpen: false, shown: 10, crmOpen: false,
    pop: null, drawer: null, dialog: null, docTab: null, toast: null,
    files: {}, fileChoice: null, request: null, payFilter: "all", docFilter: "all", logType: "Call", logResult: "Reached",
    variant: (new URLSearchParams(location.search).get("v") || "C").toUpperCase(), channel: "WhatsApp", histFilter: "All", dash: null, recent: ["a", "f"], leadSent: false, sort: "urgent", sortOpen: false, filtOpen: false, f: {},
  };
  let DEALS = clone(window.BASE_DEALS).concat(clone(window.EXTRA_DEALS));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  S.notes = store.get("mw_board", [
    { id: "n1", col: "todo", text: "Call Client A after 17:00 about the HR letter", deal: "a" },
    { id: "n2", col: "todo", text: "Ask the CFO which fee schedule template to use", deal: "" },
    { id: "n3", col: "doing", text: "Collect the valuation pack for Client F", deal: "f", carried: true },
    { id: "n4", col: "done", text: "Send the share form to the CSP", deal: "a" },
  ]);
  const COLS = [["todo", "To do"], ["doing", "Doing"], ["done", "Done"]];
  const PIN_SVG = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M5.5 1.5h5l-.8 4.2 2.8 2.8v1h-4v5l-.5.8-.5-.8v-5h-4v-1l2.8-2.8z" /></svg>';
  const isPinned = (d) => S.pins.includes(d.id);
  const onBoard = (d) => S.notes.some((n) => n.deal === d.id && n.text === mainAct(d).title && n.col !== "done");
  const pinBtn = (d, big) => `<button class="pinb ${isPinned(d) ? "on" : ""} ${big ? "big" : ""}" data-a="pinToggle" data-id="${d.id}" title="${isPinned(d) ? "Unpin from Home" : "Pin to Home"}" aria-pressed="${isPinned(d)}">${PIN_SVG}${big ? `<span>${isPinned(d) ? "Pinned" : "Pin to Home"}</span>` : ""}</button>`;
  S.pins = store.get("mw_pins", ["e", "c"]);
  S.pinHidden = store.get("mw_pinhide", false);
  S.plan = [];
  S.hist = store.get("mw_hist2", [
    { day: "Thu 21 Nov", items: [["done", "Client K", "Check 3 new files", "09:40"], ["done", "Client C", "Approve the contract drafts", "11:15"], ["done", "", "Prepare the weekly update for the CEO", "15:30"], ["moved", "Client F", "Collect the valuation pack for Client F", "18:00"]] },
    { day: "Wed 20 Nov", items: [["done", "Client J", "Collect the AML documents", "10:05"], ["done", "Client F", "Send the economics for signing", "12:20"], ["done", "Client A", "Send a reminder to the client", "16:45"]] },
    { day: "Tue 19 Nov", items: [["done", "Client A", "Call the client about the employment letter", "14:10"], ["moved", "Client B", "Chase the CSP for the tax number", "18:00"]] },
  ]);
  S.today = store.get("mw_today", []);
  S.stickies = store.get("mw_stickies2", [
    { id: "s1", c: "coral", t: "Client A prefers WhatsApp after 17:00. Never call in the morning.", at: "19 Nov, 12:05" },
    { id: "s2", c: "blue", t: "Friday: ask the CFO about the new fee template.", at: "21 Nov, 16:40" },
    { id: "s3", c: "grey", t: "Harbour CS answers faster by phone than by email.", at: "14 Nov, 10:20" },
  ]);
  const nowStamp = () => { const t = new Date(); return "22 Nov, " + String(t.getHours()).padStart(2, "0") + ":" + String(t.getMinutes()).padStart(2, "0"); };
  const logToday = (kind, deal, text) => { const t = new Date(); S.today = [[kind, deal, text, String(t.getHours()).padStart(2, "0") + ":" + String(t.getMinutes()).padStart(2, "0")]].concat(S.today); store.set("mw_today", S.today); };
  const boardDone = (dealId, title) => { let n = 0; S.notes = S.notes.map((x) => { if (x.deal === dealId && x.col !== "done" && (!title || x.text === title)) { n++; logToday("done", byId(dealId) ? dealName(byId(dealId)) : "", x.text); return Object.assign({}, x, { col: "done", auto: true }); } return x; }); if (n) store.set("mw_board", S.notes); return n; };
  const byId = (id) => DEALS.find((d) => d.id === id);
  const inScale = () => DEALS.filter((d) => !d.closed && (!d.synthetic || ["x0", "x1", "x2", "x3"].includes(d.id)));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const money = (n) => (n >= 1e6 ? "$" + (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + "M" : "$" + Math.round(n / 1000) + "K");
  const num = (n) => "$" + n.toLocaleString("en-US");
  const two = (n) => String(n).padStart(2, "0");
  const stageName = (n) => two(n) + " " + window.STAGES[n - 1].name;

  // ---------- urgency model
  const chipDays = (c) => { const m = /(\d+)/.exec(c[1]); return m ? +m[1] : 0; };
  const mainAct = (d) => d.actions.find((a) => !a.done) || d.actions[0];
  const isToday = (d) => { const a = mainAct(d); return ["late", "today", "silent", "new"].includes(a.chip[0]); };
  const urgency = (d) => { const c = mainAct(d).chip; return { late: 1000 + chipDays(c), silent: 800, today: 700, new: 600 }[c[0]] || (d.ceo ? 400 : 300 - chipDays(c)); };
  const group = (d) => { const w = mainAct(d).whose; return w === "you" ? "you" : w === "ceo" ? "ceo" : "others"; };
  const WHOSE = { you: ["Your move", "p-you"], client: ["Waiting on client", "p-client"], csp: ["Waiting on the CSP", "p-csp"], valuer: ["Waiting on the valuer", "p-valuer"], ceo: ["With CEO and CFO", "p-ceo"], done: ["Done", "p-done"] };
  const whosePill = (w) => `<span class="pill ${WHOSE[w][1]}">${WHOSE[w][0]}</span>`;
  const dlChip = (c) => `<span class="pill d-${c[0]}">${["late", "left", "today"].includes(c[0]) ? "◷&nbsp;&nbsp;" : ""}${esc(c[1])}</span>`;
  const dots = (d) => {
    const late = mainAct(d).chip[0] === "late" && d.stage < 8 || (d.stage === 8 && mainAct(d).chip[0] === "late");
    let h = '<div class="dots">';
    for (let i = 1; i <= 9; i++) {
      let c = "dot";
      if (i === d.stage) c += late ? " late" : " cur";
      else if (i === d.parallel) c += " cur";
      else if (i < d.stage) c += " done";
      h += `<span class="${c}"></span>`;
    }
    return h + "</div>";
  };
  const S01 = [["Valuation and papers", "Underwriting"], ["Economics signed", "IC Review"], ["AML check", null], ["Term sheet", "Term Sheet Issued"], ["Service Agreement and fee", null], ["KYC list to the client", null]];
  const step01 = (d) => (d.step01 == null ? 0 : d.step01);
  const maxStatus = (d) => d.stage === 1 ? ["Underwriting", "IC Review", "IC Review", "Term Sheet Issued", "Term Sheet Issued", "Term Sheet Issued"][step01(d)] : d.stage <= 7 ? "Approved" : d.stage === 8 ? "Funded" : "Repaid or Extension";
  const BROKERS = ["Prime Realty", "Skyline Brokers", "Dune Property"], PARTNERS = ["Gulf Wealth Partners", "Atlas Family Office"];
  function originOf(d) {
    if (d.origin) return d.origin;
    const i = parseInt(String(d.id).replace(/\D/g, "") || "0", 10);
    return d.source === "Broker" ? { type: "Broker", who: BROKERS[i % 3], pct: 1.5 } : d.source === "Referral" ? { type: "Partner", who: PARTNERS[i % 2], pct: 1 } : { type: "Client", who: d.source || "Website form" };
  }
  const ogPill = (d, btn) => { const o = originOf(d); return btn ? `<button class="pill og ${o.type}" data-a="pop" data-v="origin">${o.type}&nbsp;▾</button>` : `<span class="pill og ${o.type}">${o.type}</span>`; };
  const asked = (d) => d.terms.asked || d.terms.amount;
  const stageText = (d) => d.stage === 1 ? "01 Client Alignment, " + S01[step01(d)][0].toLowerCase() : d.stage === 8 && d.payments ? `08 Payments, ${d.payments.paid} of ${d.payments.of}` : stageName(d.stage) + (d.parallel ? ", " + stageName(d.parallel) : "");

  // ---------- shell
  function nav(active) {
    const n = Object.fromEntries(navTabs());
    const cur = curDeal();
    const sub = (t) => t ? `<span class="ssub">${t}</span>` : "";
    const nb = (x) => x ? `<span class="nb">${x}</span>` : "";
    const item = (t, href, on, s2) => OFF_TABS.includes(t)
      ? `<span class="sitem off" aria-disabled="true" title="Not part of this prototype"><span class="stx">${t}${sub("Not in this case")}</span>${nb(n[t])}</span>`
      : `<a class="sitem ${on ? "on" : ""}" href="${href}"><span class="stx">${t}${sub(s2)}</span>${nb(n[t])}</a>`;
    const rec = S.recent.map(byId).filter((d) => d && !d.closed).slice(0, 3);
    return `<aside class="side"><div class="brand">Workspace</div><nav class="snav" aria-label="Sections">
      <a class="sitem ${active === "Home" ? "on" : ""}" href="#/home"><span class="stx">Home<span class="ssub">Your day and your board</span></span></a>
      ${item("Leads")}
      ${item("Deal portfolio", "#/deals", active === "Deal portfolio" && !cur, "All deals in work")}
      ${rec.length ? `<div class="srec"><div class="slab">Recently opened</div>
        ${rec.map((d) => `<div class="sroomw ${cur && cur.id === d.id ? "on" : ""}"><a class="sroom" href="#/deal/${d.id}"><span>${esc(dealName(d))}</span><span class="ssub">${esc(stageText(d))}</span></a><button class="sx" data-a="unrecent" data-v="${d.id}" title="Remove from the menu" aria-label="Remove ${esc(d.client)} from the menu">×</button></div>`).join("")}
      </div>` : ""}
      ${item("Payments")}
      ${item("Documents", "#/documents", active === "Documents", "Open documents")}
      </nav><div class="sfoot"><span class="sitem off" aria-disabled="true" title="Not part of this prototype"><span class="stx">Settings</span></span><span class="sitem off" aria-disabled="true" title="Not part of this prototype"><span class="stx">Profile</span></span></div><div class="me"><span class="avatar">AK</span><span class="stx"><span>Anna K.</span><span class="ssub">Deal manager</span></span></div></aside>`;
  }
  const OFF_TABS = ["Leads", "Payments"];
  function navTabs() {
    const ds = inScale();
    return [["Leads", window.LEADS.filter((l) => l.today).length], ["Deal portfolio", ds.filter(isToday).length], ["Payments", ds.filter((d) => d.stage === 8 && mainAct(d).chip[0] === "late").length], ["Documents", ds.filter((d) => d.actions.some((a) => !a.done && (a.panel === "check" || /^Check/.test(a.title)))).length]];
  }
  const VARIANTS = [["A", "Block"], ["B", "Strip"], ["C", "Ready leads in the list"], ["D", "Nothing"]];
  function demo() { return route().p === "deals" && new URLSearchParams(location.search).has("test") ? `<div class="demo"><span>Test: leads on Deals</span>${VARIANTS.map(([k, t]) => `<button class="${S.variant === k ? "on" : ""}" data-a="variant" data-v="${k}">${k}&nbsp;&nbsp;${t}</button>`).join("")}</div>` : ""; }
  function toast() { return S.toast ? `<div class="toast">${esc(S.toast)}</div>` : ""; }
  function say(t) { S.toast = t; render(); clearTimeout(say.t); say.t = setTimeout(() => { S.toast = null; render(); }, 3200); }

  // ---------- HOME
  function home() {
    const all = inScale();
    const today = all.filter(isToday), mine = all.filter((d) => group(d) === "you").sort((a, b) => urgency(b) - urgency(a));
    const docsOpen = navTabs().find((x) => x[0] === "Documents")[1];
    const ready = window.LEADS.filter((l) => l.start).length, leadsToday = window.LEADS.filter((l) => l.today).length;
    const lateFees = all.filter((d) => isFunded(d) && mainAct(d).chip[0] === "late");
    const tile = (href, lab, num, line, off) => `${off ? '<div class="htile off">' : `<a class="htile" href="${href}">`}<span class="mlab">${lab}</span><span class="mnum">${num}</span><span class="mline">${line}</span>${off ? '<span class="small muted">Not in this case</span></div>' : '<span class="aarr">→</span></a>'}`;
    const pinned = S.pins.map(byId).filter((d) => d && !d.closed);
    const doneHere = (d) => S.notes.some((n) => n.deal === d.id && n.text === mainAct(d).title && n.col === "done");
    const pool = all.filter((d) => (group(d) === "you" || isToday(d)) && !doneHere(d)).sort((a, b) => urgency(b) - urgency(a));
    const doneToday = all.filter(doneHere).length;
    const cnt = (k) => all.filter((d) => mainAct(d).chip[0] === k).length;
    const missingDocs = all.reduce((n, d) => n + (d.missing || []).length, 0);
    const fcParts = [[cnt("late"), "past deadline", "goDash", true, "late"], [missingDocs, "documents missing", "goDocs", true, "client"], [cnt("silent"), "silent client" + (cnt("silent") === 1 ? "" : "s"), "goDash", false, "silent"], [cnt("new"), "new upload" + (cnt("new") === 1 ? "" : "s") + " to check", "goDash", false, "new"], [cnt("today"), "due today", "goDash", false, "today"]].filter((x) => x[0]);
    const dealOpts = all.map((d) => `<option value="${d.id}">${esc(dealName(d))}</option>`).join("");
    const plan = `<div class="card pad"><div class="dhead"><span class="eyebrow blue">Plan your day</span>${doneToday ? `<span class="small muted">${doneToday} done today</span>` : ""}</div>
          ${(S.planMore ? pool : pool.slice(0, 3)).map((d) => { const a = mainAct(d); const card = S.notes.find((n) => n.deal === d.id && n.text === a.title && n.col !== "done");
            return `<div data-a="open" data-id="${d.id}" class="arow drow2 rowlink prow"><div class="atx"><span class="at">${esc(dealName(d))}: ${esc(a.title)}</span><span class="small bodyc">${esc(stageText(d))}, ${esc(a.chip[1].toLowerCase())}</span></div>${card ? `<span class="pdone s-${card.col}">${card.col === "doing" ? "In Doing" : "In To do"}</span>` : `<span class="pbtns"><button class="btn b-doing" data-a="planTo" data-v="doing" data-id="${d.id}" title="Put it into Doing">Today</button><button class="btn b-todo" data-a="planTo" data-v="todo" data-id="${d.id}" title="Put it into To do">Later</button></span>`}<span class="aarr">→</span></div>`; }).join("")}
          <div class="pfoot2">${pool.length > 3 ? `<button class="link small" data-a="more3" data-v="planMore">${S.planMore ? "Show less&nbsp;&nbsp;↑" : "Show " + (pool.length - 3) + " more&nbsp;&nbsp;↓"}</button>` : "<span></span>"}<button class="link small" data-a="ownTask">+ Your own task</button></div></div>`;
    const kbtn = (n, to, label) => `<button class="kmove" data-a="moveNote" data-v="${n.id}|${to}">${label}</button>`;
    const board = `<div class="card pad board">
        <div class="dhead"><span class="eyebrow blue">My board</span><span style="display:flex;gap:14px;align-items:center"><button class="link small" data-a="boardHist">History</button><button class="link small" data-a="boardCsv">Export CSV&nbsp;&nbsp;↓</button></span></div>
        <div class="nrow owntask"><input id="noteText" class="field" placeholder="Your own task" style="flex:2"><select id="noteDeal" class="field mini" style="flex:1"><option value="">Not linked to a deal</option>${dealOpts}</select><button class="btn b-doing" data-a="addNote" data-v="doing">Today</button><button class="btn b-todo" data-a="addNote" data-v="todo">Later</button></div>
        <div class="kanban">${COLS.map(([k, t]) => { const items = S.notes.filter((n) => n.col === k); return `<div class="kcol k-${k}" data-col="${k}"><div class="khead"><span class="eyebrow">${t}</span><span class="small muted">${items.length}</span></div>
          ${items.map((n) => { const d = n.deal && byId(n.deal); return `<div class="kcard" draggable="true" data-note="${n.id}" title="Drag to another column"><span class="kgrip" aria-hidden="true"></span>${n.carried && n.col !== "done" ? '<span class="ktag">From yesterday</span>' : ""}${n.auto && n.col === "done" ? '<span class="ktag done">Done in the deal room</span>' : ""}<div class="ktext">${esc(n.text)}</div>${d ? `<a class="small" href="#/deal/${d.id}">${esc(dealName(d))}</a>` : ""}<div class="kbtns">${k === "todo" ? kbtn(n, "doing", "Start") : ""}<button class="sx" data-a="delNote" data-v="${n.id}" aria-label="Delete">×</button></div></div>`; }).join("") || '<div class="small muted kempty">Drop a card here</div>'}</div>`; }).join("")}</div>
      </div>`;
    const pinCard = `<div class="card pad"><div class="dhead"><span class="eyebrow blue">Pinned deals</span>${pinned.length ? "" : '<button class="sx" data-a="pinHide" title="Close this block" aria-label="Close the pinned block">×</button>'}</div>
          ${(S.pinMore ? pinned : pinned.slice(0, 3)).map((d) => `<div data-a="open" data-id="${d.id}" class="arow drow2 rowlink"><button class="sx" data-a="unpin" data-v="${d.id}" title="Unpin" aria-label="Unpin">×</button><div class="atx"><span class="at">${esc(dealName(d))}</span><span class="small bodyc">${esc(dealSub(d))}, ${esc(stageText(d))}</span></div><span class="aarr">→</span></div>`).join("") || '<div class="pinempty"><div style="font-weight:500">Nothing pinned yet</div><div class="small bodyc">Pin a deal in the list or in its room, and it shows here. Close this block if you do not need it, it comes back with the first pin.</div></div>'}
          ${pinned.length > 3 ? `<button class="link small dmore" data-a="more3" data-v="pinMore">${S.pinMore ? "Show less&nbsp;&nbsp;↑" : "Show " + (pinned.length - 3) + " more&nbsp;&nbsp;↓"}</button>` : ""}</div>`;
    const notesCard = `<div class="card pad"><div class="dhead"><span class="eyebrow blue">My notes</span><button class="link small" data-a="stickAdd">+ New note</button></div>
          <div class="stickies">${(S.stickMore ? S.stickies : S.stickies.slice(0, 3)).map((n) => `<div class="sticky c-${n.c}"><div class="sticky-at">${esc(n.at || "")}</div><div class="sticky-text" contenteditable="true" data-stick="${n.id}" data-ph="Write a note">${esc(n.t)}</div><div class="sticky-foot"><span class="sdots">${["grey", "blue", "coral"].map((c) => `<button class="sdot c-${c} ${n.c === c ? "on" : ""}" data-a="stickColor" data-v="${n.id}|${c}" aria-label="${c}"></button>`).join("")}</span><button class="link small" data-a="stickTask" data-v="${n.id}" title="Move this note to To do">Make a task</button><button class="sx" data-a="stickDel" data-v="${n.id}" aria-label="Delete note">×</button></div></div>`).join("")}</div>${S.stickies.length > 3 ? `<button class="link small" style="margin-top:10px" data-a="more3" data-v="stickMore">${S.stickMore ? "Show less&nbsp;&nbsp;↑" : "Show " + (S.stickies.length - 3) + " more&nbsp;&nbsp;↓"}</button>` : ""}</div>`;
    return nav("Home") + `<div class="page">
      <div class="head"><div><div class="eyebrow blue">Friday, 22 November</div><h1>Good morning, Anna</h1></div><div class="grow"></div></div>
      <div class="hstrip">
        ${tile("#/deals", "Deal portfolio", all.length + " deals", today.length + " need attention today, " + mine.length + " your move")}
        ${tile("#/documents", "Documents", docsOpen + " to check", "Uploaded by clients and the CSP")}
        ${tile("", "Payments", lateFees.length + " late fees", lateFees.map((d) => dealName(d)).join(", ") || "All fees on time", true)}
        ${tile("", "Leads", ready + " ready", leadsToday + " need a reply today", true)}
      </div>
      <div class="hcols2">${plan}${!pinned.length && S.pinHidden ? notesCard : pinCard.replace(/<\/div>$/, "") + '<div class="stickhead2">' + notesCard.replace('<div class="card pad">', "") + "</div>"}</div>
      ${board}
    </div>`;
  }

  // ---------- DEALS
  function searchResults() {
    const q = S.q.trim().toLowerCase();
    if (!q) return "";
    const ds = inScale();
    const props = ds.filter((d) => [d.property.label, d.property.area, d.property.building].join(" ").toLowerCase().includes(q));
    const closed = window.CLOSED.filter((c) => (c.property + " " + c.area).toLowerCase().includes(q));
    const spvs = ds.filter((d) => spvLabel(d) && spvLabel(d).toLowerCase().includes(q));
    const spvByProp = props.filter((d) => spvLabel(d));
    const spvList = Array.from(new Set(spvs.concat(spvByProp)));
    const clients = ds.filter((d) => d.client.toLowerCase().includes(q));
    const res = (d, main, sub) => `<div class="res" data-a="open" data-id="${d.id}"><div><div class="cname">${esc(main)}</div><div class="small bodyc">${esc(sub)}</div></div><div class="r">${whosePill(mainAct(d).whose)}<span class="small muted">${esc(stageText(d))}</span></div></div>`;
    let h = `<div class="card results"><div class="small muted" style="margin:0 8px 6px">Searches client, property, building, area and SPV</div>`;
    h += `<div class="eyebrow grp">Properties&nbsp;&nbsp;${props.length + closed.length}</div>`;
    h += props.map((d) => res(d, d.property.label + (d.property.building ? ", " + d.property.building : ""), d.client + ", " + (spvLabel(d) || "SPV not set up yet"))).join("");
    h += closed.map((c) => `<div class="res" data-a="closed"><div><div class="cname">${esc(c.property)}</div><div class="small bodyc">${esc(c.client + ", " + c.spv)}</div></div><div class="r"><span class="pill p-closed">Closed</span><span class="small muted">${esc(c.stage)}</span></div></div>`).join("");
    h += `<div class="eyebrow grp">Companies (SPV)&nbsp;&nbsp;${spvList.length}</div>`;
    h += spvList.filter(spvLabel).map((d) => res(d, spvLabel(d), "Holds " + d.property.label + ", " + d.client)).join("");
    h += `<div class="eyebrow grp">Clients&nbsp;&nbsp;${clients.length}</div>`;
    h += clients.length ? clients.slice(0, 5).map((d) => res(d, d.client, d.property.label)).join("") : `<div class="small bodyc" style="margin:0 8px 8px">No client named «${esc(S.q)}».</div>`;
    return h + `<div class="small muted" style="border-top:1px solid var(--line);margin:8px 8px 0;padding-top:10px">↵ Open the first result</div></div>`;
  }
  function exportMenu(kind) {
    const n = inScale().length;
    const items = kind === "list"
      ? [["CSV", "All " + n + " deals", "Every field, one row per deal. Opens in Excel.", "csv-all"], ["CSV", "Only this view", "What the filter shows now", "csv-view"], ["PRINT", "Deal list", "Print or save as PDF", "print"]]
      : [["PDF", "Deal summary", "One page, print or save as PDF", "print"], ["CSV", "All data of this deal", "Opens in Excel", "csv-deal"], ["TEXT", "Copy summary", "Paste into a message", "copy"]];
    return `<div class="card menu"><div class="eyebrow" style="margin-bottom:6px">Export</div>${items.map((i) => `<div class="it" data-a="export" data-v="${i[3]}"><span class="badge">${i[0]}</span><div><div class="t">${i[1]}</div><div class="small muted">${i[2]}</div></div></div>`).join("")}</div>`;
  }
  function leadCard(l) {
    const sent = l.coral && S.leadSent;
    const btn = sent ? "" : l.start ? `<button class="btn fill" data-a="startDeal" data-v="${esc(l.client)}">Start the deal&nbsp;&nbsp;→</button>` : `<button class="btn ${l.coral ? "" : "fill"}" data-a="${l.coral ? "ceoReview" : "callLead"}" data-v="${esc(l.client)}">${l.btn}&nbsp;&nbsp;→</button>`;
    return `<div class="lead ${l.coral && !sent ? "hot2" : ""}"><div class="lhead"><span class="cname">${l.client}</span><span class="pill og ${l.og || "Client"}">${l.og || "Client"}</span><span class="small muted">${l.src}</span>${l.pill && !sent ? `<span class="pill lp">${l.pill}</span>` : ""}</div>
      <div class="steps">${["Lead", "First contact", "Documents", "Screening", "Passed"].map((s, i) => `<div class="${i < l.done ? "done" : i === l.done ? "cur" : ""}">${s}</div>`).join("")}</div>
      <div class="lfoot"><div class="small" style="font-weight:500;${l.coral && !sent ? "color:var(--coral)" : ""}">${sent ? "Sent to the CEO and the CFO, answer by 27 Nov" : l.line}</div>${btn}</div></div>`;
  }
  const SORTS = [["urgent", "Most urgent first"], ["deadline", "Deadline, soonest first"], ["newest", "Newest deals first"], ["stage", "Stage, early to late"], ["amount", "Amount, largest first"], ["client", "Client name, A to Z"]];
  const FGROUPS = [
    ["stage", "Stage", window.STAGES.map((x) => [String(x.n), two(x.n) + " " + x.name])],
    ["due", "Deadline", [["late", "Late"], ["today", "Due today"], ["week", "Within 7 days"]]],
    ["type", "Client type", [["Individual", "Individual"], ["Company", "Company"]]],
    ["phase", "Phase", [["prep", "In preparation, 01 to 05"], ["funding", "Funding in progress, 06 to 07"], ["funded", "Funded, 08 to 09"]]],
    ["spv", "SPV", [["none", "Not set up yet"], ["reg", "Registered"], ["bank", "Bank account open"]]],
    ["dtype", "Deal type", [["HML", "HML"], ["Bridge", "Bridge"], ["Flipping", "Flipping"], ["Refinance", "Refinance"]]],
  ];
  function passF(d) {
    const f = S.f, a = mainAct(d), c = a.chip;
    const on = (k) => f[k] && f[k].length;
    if (on("stage") && !f.stage.includes(String(d.stage)) && !f.stage.includes(String(d.parallel))) return false;
    if (on("due") && !f.due.some((v) => (v === "late" && c[0] === "late") || (v === "today" && c[0] === "today") || (v === "week" && c[0] === "left" && chipDays(c) <= 7))) return false;
    if (on("src") && !f.src.includes(originOf(d).type)) return false;
    if (on("ltv") && !f.ltv.includes(d.property.ltv > 65 ? "over" : "in")) return false;
    if (on("type") && !f.type.includes(d.type)) return false;
    if (on("phase") && !f.phase.includes(phaseOf(d))) return false;
    if (on("dtype") && !f.dtype.includes(typeOf(d))) return false;
    if (on("spv") && !f.spv.some((v) => (v === "none" && !spvLabel(d)) || (v === "reg" && spvLabel(d)) || (v === "bank" && d.spv.bank === "Open"))) return false;
    return true;
  }
  function sortFn(a, b) {
    const dl = (d) => { const c = mainAct(d).chip; return c[0] === "late" ? -chipDays(c) : c[0] === "today" || c[0] === "silent" ? 0 : c[0] === "new" ? 0.5 : chipDays(c); };
    switch (S.sort) {
      case "deadline": return dl(a) - dl(b);
      case "newest": return (b.fresh ? 1 : 0) - (a.fresh ? 1 : 0) || DEALS.indexOf(a) - DEALS.indexOf(b);
      case "stage": return a.stage - b.stage;
      case "amount": return b.terms.amount - a.terms.amount;
      case "client": return a.client.localeCompare(b.client);
      default: return urgency(b) - urgency(a);
    }
  }
  const phaseOf = (d) => d.stage <= 5 ? "prep" : d.stage <= 7 ? "funding" : "funded";
  function fcount() { return Object.values(S.f).reduce((n, v) => n + (v ? v.length : 0), 0); }
  function sortMenu() { return `<div class="card menu" style="width:280px"><div class="eyebrow" style="margin-bottom:6px">Sort</div>${SORTS.map(([k, t]) => `<div class="it" data-a="sort" data-v="${k}"><span class="radio ${S.sort === k ? "on" : ""}"></span><div class="t">${t}</div></div>`).join("")}</div>`; }
  function filtPanel(list) {
    return `<div class="card menu fpanel"><div style="display:flex;justify-content:space-between;align-items:center"><span class="eyebrow">Filters</span><button class="link small" data-a="fclear">Clear all</button></div>
      <div class="fgrid">${FGROUPS.map(([k, t, opts]) => `<div class="fg ${k === "stage" ? "wide" : ""}"><div class="small" style="font-weight:500;margin-bottom:8px">${t}</div><div class="fopts">${opts.map(([v, l]) => `<button class="opt ${(S.f[k] || []).includes(v) ? "on" : ""}" data-a="fopt" data-v="${k}|${v}">${l}</button>`).join("")}</div></div>`).join("")}</div>
      <div class="pfoot"><button class="btn fill" data-a="fdone">Show ${list.length} deals</button><span class="small muted">Filters combine with the chips above.</span></div></div>`;
  }
  function fchips() {
    const out = [];
    FGROUPS.forEach(([k, t, opts]) => (S.f[k] || []).forEach((v) => { const o = opts.find((x) => x[0] === v); out.push(`<button class="chip fchip" data-a="fopt" data-v="${k}|${v}">${t}: ${o ? o[1] : v}&nbsp;&nbsp;×</button>`); }));
    return out.length ? `<div class="filters" style="margin-top:10px">${out.join("")}<button class="link small" data-a="fclear">Clear all</button></div>` : "";
  }
  const G_prepSpv = (all) => all.filter((d) => phaseOf(d) === "prep" && spvLabel(d)).length;
  const isExitSoon = (d) => d.stage >= 8 && d.payments && d.payments.of - d.payments.paid <= 3;
  function money4(all) {
    const sum = (ds) => ds.reduce((n, d) => n + d.terms.amount, 0);
    const funded = all.filter((d) => phaseOf(d) === "funded");
    const prep = all.filter((d) => phaseOf(d) === "prep"), buying = all.filter((d) => phaseOf(d) === "funding");
    const progress = prep.concat(buying);
    const fee = (d) => (d.payments && d.payments.fee) || Math.round(d.terms.amount * d.terms.rate / 100 / 12);
    const late = funded.filter((d) => mainAct(d).chip[0] === "late");
    const due = funded.filter((d) => d.stage === 8 && mainAct(d).chip[0] !== "late");
    const isOn = (list) => { const f = S.f.phase || []; return f.length === list.length && list.every((x) => f.includes(x)); };
    const exits = funded.filter(isExitSoon).sort((x, y) => (x.payments.of - x.payments.paid) - (y.payments.of - y.payments.paid));
    const nx = exits[0];
    const T = (cls, on, a, v, lab, num, line, why) => `<button class="mtile ${cls} ${on ? "on" : ""}" data-a="${a}" ${v ? `data-v="${v}"` : ""}><span class="mlab">${lab}</span><span class="mnum">${num}</span><span class="mline">${line}</span><span class="mwhy">${why}</span></button>`;
    const nd = (n) => n + " deal" + (n === 1 ? "" : "s");
    return `<div class="mstrip">
      ${T("warm", isOn(["funded"]) && S.dash === "late", "feesLate", "", "Late fees", money(late.reduce((n, d) => n + fee(d), 0)), nd(late.length) + ": " + (late.map((d) => esc(dealName(d))).join(", ") || "none"), "A monthly fee is late. From 30 days late the deal goes to the CEO and the CFO.")}
      ${T("", S.dash === "exit", "exitsSoon", "", "Exits in 90 days", money(exits.reduce((n, d) => n + d.terms.amount, 0)), nd(exits.length) + ": " + (exits.map((d) => esc(dealName(d))).join(", ") || "none"), nx ? "Fee " + nx.payments.paid + " of " + nx.payments.of + " paid. The capital returns at the exit, so plan it now." : "No exit in the next 90 days.")}
      ${T("", isOn(["prep", "funding"]), "phase", "prep,funding", "Funding in progress", money(sum(progress)), nd(progress.length) + ", stages 01 to 07", "In preparation 01 to 05: " + money(sum(prep)) + ", " + nd(prep.length) + ". Buying 06 to 07: " + money(sum(buying)) + ", " + nd(buying.length) + ".")}
      ${T("blue", isOn(["funded"]) && !S.dash, "phase", "funded", "Funded, capital deployed", money(sum(funded)), nd(funded.length) + ", stages 08 to 09", "Monthly fees run until the exit: " + money(due.reduce((n, d) => n + fee(d), 0)) + " due in the next 30 days.")}
    </div>`;
  }
  function leadsBlock() {
    const ready = window.LEADS.filter((l) => l.start);
    if (!ready.length) return "";
    const total = ready.reduce((n, l) => n + (l.amount || 0), 0);
    const row = (l) => `<div class="lrow2"><span class="at">${esc(l.client)}, ${esc(l.prop)}</span>${l.dealType ? typeChip(l.dealType) : ""}<span class="small bodyc">${money(l.amount)} asked. Documents ${l.docs} of 5, LTV ${l.ltv}%. ${esc(l.chip[1])}</span><span style="flex:1"></span><button class="btn fill" data-a="startDeal" data-v="${esc(l.client)}">Start The Deal&nbsp;&nbsp;<span class="arr">→</span></button></div>`;
    if (ready.length === 1) return `<div class="card leadblock one"><span class="eyebrow blue">Ready to become a deal</span>${row(ready[0])}</div>`;
    const shown = S.leadsMore ? ready : ready.slice(0, 1);
    return `<div class="card leadblock many"><div class="lhead2"><span class="eyebrow blue">Ready to become a deal</span><span class="small bodyc">${ready.length} leads passed Screening, ${money(total)} asked in total.</span></div>
      ${shown.map(row).join("")}
      <button class="link small" style="margin-top:8px" data-a="more3" data-v="leadsMore">${S.leadsMore ? "Show less&nbsp;&nbsp;↑" : "Show " + (ready.length - 1) + " more&nbsp;&nbsp;↓"}</button></div>`;
  }
  function dashboard(all) {
    const names = (ds) => ds.slice(0, 2).map((d) => dealName(d)).join(", ") + (ds.length > 2 ? " and " + (ds.length - 2) + " more" : "");
    const by = (k) => all.filter((d) => mainAct(d).chip[0] === k);
    const today = all.filter(isToday);
    const att = [["late", "Past the deadline"], ["silent", "No reply for 48 hours"], ["new", "New files or news to check"], ["today", "Due today"]].map(([k, t]) => [k, by(k).length, t, names(by(k)), k === "late"]).filter((x) => x[1]);
    const attRow = (x) => `<button class="arow ${x[4] ? "warm" : ""} ${S.dash === x[0] ? "on" : ""}" data-a="dash" data-v="${x[0]}"><span class="anum">${x[1]}</span><span class="atx"><span class="at">${x[2]}</span><span class="small bodyc">${esc(x[3])}</span></span><span class="aarr" title="Show them in the list below">↓</span></button>`;
    const mine = all.filter((d) => group(d) === "you").sort((a, b) => urgency(b) - urgency(a));
    const decRow = (d) => { const a = mainAct(d); const hot = ["late", "today", "new"].includes(a.chip[0]);
      return `<div data-a="open" data-id="${d.id}" class="arow drow2 rowlink"><div class="atx"><span class="at">${esc(dealName(d))}: ${esc(a.title)}</span><span class="small bodyc">${esc(stageText(d))}, ${esc(a.chip[1].toLowerCase())}</span></div><span class="aarr">→</span></div>`; };
    const more = (n, key) => n > 2 ? `<button class="link small dmore" data-a="more3" data-v="${key}">${S[key] ? "Show less&nbsp;&nbsp;↑" : "Show " + (n - 2) + " more&nbsp;&nbsp;↓"}</button>` : '<span class="dmore"></span>';
    return `<div class="dash">
      <div class="card pad dcard"><div class="dhead"><span class="eyebrow blue">Needs attention today</span><span class="small muted">${today.length} deals</span></div>
        ${(S.attMore ? att : att.slice(0, 2)).map(attRow).join("")}${more(att.length, "attMore")}</div>
      <div class="card pad dcard"><div class="dhead"><span class="eyebrow blue">Your move</span><span class="small muted">${mine.length} deals</span></div>
        ${(S.decMore ? mine : mine.slice(0, 2)).map(decRow).join("") || '<div class="small bodyc" style="margin-top:12px">Nothing waits for you right now.</div>'}${more(mine.length, "decMore")}</div>
    </div>`;
  }
  // one line per section: what is hot here today; every part filters the list right below
  function todayLine(parts) {
    const ps = parts.filter((x) => x.n);
    if (!ps.length) return '<div class="forecast"><span class="fclab">Today</span><span class="small bodyc">Nothing urgent in this section.</span></div>';
    return `<div class="forecast"><span class="fclab">Today</span>${ps.map((x) => `<button class="fcp ${x.warm ? "warm" : ""} ${x.on ? "on" : ""}" data-a="${x.a}" data-v="${x.v}"><b>${x.n}</b> ${x.t}</button>`).join("")}</div>`;
  }
  function deals() {
    const all = inScale();
    const counts = { all: all.length, today: all.filter(isToday).length, you: all.filter((d) => group(d) === "you").length, others: all.filter((d) => group(d) === "others").length, ceo: all.filter((d) => group(d) === "ceo").length };
    const F = [["all", "All"], ["today", "Needs attention today"], ["you", "Your move"], ["others", "Waiting on others"], ["ceo", "With CEO and CFO"]];
    let list = all.filter((d) => S.filter === "all" || (S.filter === "today" ? isToday(d) : group(d) === S.filter));
    list = list.filter(passF);
    if (listSpv()) list = list.filter(isFunded);
    if (S.dash) list = list.filter((d) => S.dash === "exit" ? isExitSoon(d) : mainAct(d).chip[0] === S.dash);
    list.sort(sortFn);
    list = list.filter(isPinned).concat(list.filter((d) => !isPinned(d)));
    const big = false;
    const shown = big ? list.slice(0, S.shown) : list;
    const hot = window.LEADS.filter((l) => l.today);
    const ready = window.LEADS.filter((l) => l.start);
    const strip = `<div class="card crmline"><span class="eyebrow blue">Leads</span><span class="pill d-today">${hot.length} need you today</span><span class="small bodyc">${hot.map((l) => `<b>${esc(l.client)}</b> ${esc(l.line.charAt(0).toLowerCase() + l.line.slice(1))}`).join(";&nbsp; ")}</span><span style="flex:1"></span>${ready.map((l) => `<button class="btn fill" data-a="startDeal" data-v="${esc(l.client)}">Start ${esc(l.client)}&nbsp;&nbsp;→</button>`).join("")}<button class="link" data-a="offtab" data-v="Leads">Open Leads&nbsp;&nbsp;→</button></div>`;
    const leadRows = false ? ready.map((l) => `<tr class="leadrow"><td><div class="cname">${esc(l.client)} <span class="pill d-new">Lead</span></div><div class="small muted">${esc(l.prop)}</div></td><td><div style="font-weight:500">${money(l.amount || 0)}</div><div class="small muted">asked</div></td><td><div class="small bodyc">Screening passed</div></td><td>${whosePill("you")}</td><td style="font-weight:500">Start the deal</td><td><span class="pill d-new">Ready today</span></td><td style="text-align:right"><button class="btn fill" data-a="startDeal" data-v="${esc(l.client)}">Start&nbsp;&nbsp;→</button></td></tr>`).join("") : "";
    const blocks = { A: null, B: strip, C: "", D: "" };
    const leads0 = `<div class="card crm"><div class="top"><span class="eyebrow blue">Leads</span><span class="pill d-today">${hot.length} of ${window.LEADS.length} leads need you today</span><span class="small muted">A lead becomes a deal when Screening is passed.</span><span style="flex:1"></span><button class="link" data-a="offtab" data-v="Leads">Open Leads&nbsp;&nbsp;→</button></div><div class="leads three">${hot.map(leadCard).join("")}</div></div>`;
    const leads = blocks[S.variant] === null || blocks[S.variant] === undefined ? leads0 : blocks[S.variant];
    return nav("Deal portfolio") + `<div class="page">
      <div class="head"><div><h1>Deal portfolio</h1>${(() => { const c = (k) => all.filter((d) => mainAct(d).chip[0] === k).length; return todayLine([{ n: c("late"), t: "past deadline", a: "dash", v: "late", warm: true, on: S.dash === "late" }, { n: c("silent"), t: "silent client" + (c("silent") === 1 ? "" : "s"), a: "dash", v: "silent", on: S.dash === "silent" }, { n: c("new"), t: "new to check", a: "dash", v: "new", on: S.dash === "new" }, { n: c("today"), t: "due today", a: "dash", v: "today", on: S.dash === "today" }]); })()}</div><div class="grow"></div>
        <div class="search"><input id="q" placeholder="Search by client, property or SPV" value="${esc(S.q)}" autocomplete="off">${S.q ? '<button class="link" data-a="clearQ" style="position:absolute;right:10px;top:9px;color:var(--muted)">×</button>' : ""}${S.searchOpen ? searchResults() : ""}</div>
        <div class="rel"><button class="btn" data-a="exportOpen">↓&nbsp;&nbsp;Export&nbsp;&nbsp;▾</button>${S.exportOpen ? exportMenu("list") : ""}</div></div>
      ${S.exportOpen || S.sortOpen || S.filtOpen || (S.searchOpen && S.q) ? '<div class="dim soft" data-a="closeAll"></div>' : ""}
      ${money4(all)}
      ${leadsBlock()}
      <div class="sechead" id="list"><h2>Deals in work</h2><span class="small bodyc">${all.length} deals</span>${S.dash ? `<button class="chip fchip" data-a="dash" data-v="${S.dash}">Showing: ${{ late: "late", silent: "no reply for 48 hours", new: "new to check", left: "fee coming", exit: "exit in 90 days" }[S.dash]}&nbsp;&nbsp;×</button>` : ""}</div>
      <div class="filters">${F.map(([k, t]) => `<button class="chip ${S.filter === k ? "on" : ""} ${k === "today" ? "warm" : ""}" data-a="filter" data-v="${k}">${t}&nbsp;&nbsp;${counts[k]}</button>`).join("")}<span class="sp"></span><div class="rel"><button class="btn ${fcount() ? "fill" : ""}" data-a="filtOpen">Filters${fcount() ? "&nbsp;&nbsp;" + fcount() : ""}&nbsp;&nbsp;▾</button>${S.filtOpen ? filtPanel(list) : ""}</div><div class="rel"><button class="btn" data-a="sortOpen">Sort: ${SORTS.find((x) => x[0] === S.sort)[1].toLowerCase()}&nbsp;&nbsp;▾</button>${S.sortOpen ? sortMenu() : ""}</div></div>${fchips()}
      ${S.filter === "today" ? '<p class="hint">Shown when the deadline has passed or is today, the client has not replied for 48 hours, or something new needs your check.</p>' : ""}
      ${leads}
      <div class="card tablecard"><table class="deals"><thead><tr><th style="width:20%"><div class="rel"><button class="thbtn" data-a="nameOpen">${nameHead()}&nbsp;&nbsp;▾</button>${S.nameOpen ? nameMenu() : ""}</div></th><th style="width:11%">Amount</th><th style="width:17%">Stage</th><th style="width:12%">Whose move</th><th>Next action</th><th style="width:14%">Deadline</th><th style="width:90px"></th></tr></thead><tbody>
      ${leadRows}${shown.map((d) => { const a = mainAct(d); return `<tr data-a="open" data-id="${d.id}"><td><div class="cname">${pinBtn(d)}${esc(listName(d))} ${typeChip(typeOf(d))}${d.fresh ? ' <span class="pill d-new">New from Leads</span>' : ""}</div><div class="small muted subpad">${esc(listSub(d))}</div></td><td><div style="font-weight:500">${money(d.terms.amount)}</div><div class="small muted">${asked(d) !== d.terms.amount ? "of " + money(asked(d)) + " asked" : "as asked"}, ${d.terms.rate}%</div></td><td>${dots(d)}<div class="small bodyc">${esc(stageText(d))}</div></td><td>${whosePill(a.whose)}</td><td style="font-weight:500">${esc(a.title)}</td><td>${dlChip(a.chip)}</td><td style="text-align:right"><span class="aarr">→</span></td></tr>`; }).join("")}
      </tbody></table>${!shown.length ? '<div class="empty">Nothing here. Every deal in this view is on time.</div>' : ""}
      ${big && list.length > shown.length ? `<div class="tfoot"><span>${shown.length} of ${list.length} shown, most urgent first.</span><button class="btn" data-a="more">Show 10 more&nbsp;&nbsp;↓</button></div>` : ""}</div>
    </div>`;
  }

  // ---------- ROOM
  const spvLabel = (d) => (d.spv.reg && /^FZ-/.test(d.spv.reg) ? "SPV " + String(d.client).replace(/^Client /, "") + "1" : null);
  const TYPES = { HML: "Hard money: capital against a property, for any purpose", Bridge: "Bridge: capital until a sale or another payment comes in", Flipping: "Flipping: buy, improve, sell", Refinance: "Refinance: replace existing financing" };
  const typeOf = (d) => d.dealType || ["Bridge", "HML", "Flipping", "Refinance"][(parseInt(String(d.id).replace(/\D/g, "") || "0", 10)) % 4];
  const typeChip = (t) => `<span class="pill dtype" title="${esc(TYPES[t] || t)}">${esc(t)}</span>`;
  const isFunded = (d) => d.stage >= 8 && !!spvLabel(d);
  // room, tiles and menu: the deal is called by its SPV once funded
  const dealName = (d) => isFunded(d) ? spvLabel(d) : d.client;
  const dealSub = (d) => isFunded(d) ? d.client + ", " + d.property.label : d.property.label;
  // the list: the first column header decides
  const listSpv = () => S.nameBy === "spv";
  const listName = (d) => listSpv() ? (spvLabel(d) || d.client) : S.nameBy === "client" ? d.client : dealName(d);
  const listSub = (d) => listSpv() ? d.client + ", " + d.property.label : S.nameBy === "client" ? (isFunded(d) ? spvLabel(d) + ", " : "") + d.property.label : dealSub(d);
  const nameHead = () => listSpv() ? "SPV and client" : S.nameBy === "client" ? "Client and property" : "All deals";
  function nameMenu() {
    const show = [["all", "All deals", "Client until funded, then the SPV"], ["client", "Client", "Every stage, by the client"], ["spv", "SPV", "Funded deals only, stages 08 to 09"]];
    const types = ["HML", "Bridge", "Flipping", "Refinance"];
    const cnt = (t) => inScale().filter((d) => typeOf(d) === t && (!listSpv() || isFunded(d))).length;
    return `<div class="card menu namemenu"><div class="eyebrow" style="margin-bottom:6px">Show</div>${show.map(([k, t, sub]) => `<div class="it" data-a="nameBy" data-v="${k}"><span class="radio ${(S.nameBy || "all") === k ? "on" : ""}"></span><div><div class="t">${t}</div><div class="small muted">${sub}</div></div></div>`).join("")}
      <div style="display:flex;justify-content:space-between;align-items:center;margin:12px 0 6px;border-top:1px solid var(--line);padding-top:12px"><span class="eyebrow">Deal type</span>${(S.f.dtype || []).length ? '<button class="link small" data-a="dtypeClear">Clear</button>' : ""}</div>
      <div class="fopts" style="padding-bottom:10px">${types.map((t) => `<button class="opt ${(S.f.dtype || []).includes(t) ? "on" : ""}" data-a="fopt" data-v="dtype|${t}" title="${esc(TYPES[t])}">${t}&nbsp;&nbsp;${cnt(t)}</button>`).join("")}</div></div>`;
  }
  function propDocs(d) {
    if (!d.propDocs) d.propDocs = [["Title deed", d.property.deed && /pending/.test(d.property.deed) ? "check" : "ok", "Client, 18 Nov"], ["Valuation report", "ok", "Valuer, " + (d.property.valDate || "")], ["Floor plan", "missing", ""], ["Service charge statement", "missing", ""]];
    return d.propDocs;
  }
  function spvDocs(d) {
    const reg = /^SPV [A-Z][a-z]+ \d/.test(d.spv.name);
    if (!d.spvDocs) d.spvDocs = reg
      ? [["Certificate of registration", "ok", "CSP, " + (d.spv.regOn || "")], ["Memorandum of association", "ok", "CSP"], ["Register of directors", "ok", "CSP"], ["Corporate tax certificate", "ok", "CSP"], ["Bank account letter", "missing", ""], ["Share register, updated", "missing", ""]]
      : [["Name reservation", d.spv.status === "In registration" ? "ok" : "missing", "CSP"], ["Certificate of registration", "missing", ""], ["Memorandum of association", "missing", ""]];
    return d.spvDocs;
  }
  const DOCST = { ok: ['<span class="pill p-done">Received</span>', ""], check: ['<span class="pill d-new">Check pending</span>', ""], missing: ['<span class="pill p-client">Missing</span>', ""], new: ['<span class="pill d-new">Uploaded now</span>', ""] };
  function docList(list, kind) {
    return list.map((x, i) => `<div class="drow"><span class="dic"></span><div class="grow"><div style="font-weight:500">${esc(x[0])}</div>${x[2] ? `<div class="small muted">${esc(x[2])}</div>` : ""}</div>${DOCST[x[1]][0]}${x[1] === "missing" ? `<label class="link small upl">Upload<input type="file" data-up="${kind}" data-i="${i}" hidden></label>` : `<button class="link small" data-a="export" data-v="file">↓</button>`}</div>`).join("");
  }
  function pop(d, which) {
    const close = `<button class="link small pclose" data-a="pop" data-v="${which}">Close ×</button>`;
    if (which === "property") {
      const p = d.property; const ltv = p.ltv; const over = ltv > 65;
      const photos = d.photos || [["Building", ""], ["Living room", ""], ["View", ""]];
      return `<div class="card pop wide">${close}<div class="eyebrow">Property</div><h3>${esc(p.kind || p.label)}${p.building ? ", " + esc(p.building) : ""}</h3><div class="bodyc">${esc(p.area)}${p.size ? ", " + p.size : ""}. Owner: ${esc(d.client)}. Mortgage: ${esc(p.mortgage)}.</div>
        <div class="pcols"><div>
        <div class="psec"><div style="display:flex;justify-content:space-between"><span class="eyebrow">Valuation</span><span class="small muted">${p.valUntil ? "Valid until " + p.valUntil : ""}</span></div>
          <div class="vgrid"><div><div class="small muted">Market value</div><div class="vnum">${num(p.market)}</div></div><div><div class="small muted">Valuation${p.valDate ? ", " + p.valDate : ""}</div><div class="vnum">${num(p.valuation)}</div></div><div><div class="small muted">Valuer</div><div style="font-weight:500;margin-top:4px">${esc(p.valuer || "Prime Valuers, DLD listed")}</div></div></div>
          </div>
        </div><div><div class="psec"><div style="display:flex;justify-content:space-between"><span class="eyebrow">Documents</span><label class="link small upl">+ Upload<input type="file" data-up="prop" data-i="-1" hidden></label></div>${docList(propDocs(d), "prop")}</div></div></div>
        <div class="psec photosec"><div class="eyebrow">Photos</div><div class="photos">${photos.map((ph) => ph[1] ? `<div class="ph" style="background-image:url('${ph[1]}')"></div>` : `<div class="ph"><span>${esc(ph[0])}</span></div>`).join("")}<label class="ph add">+ Add photos<input type="file" accept="image/*" multiple data-up="photo" hidden></label></div></div><div class="pfoot"><button class="btn" data-a="revalue">Request a new valuation</button><span class="small muted">All property documents also sit in Documents.</span></div></div>`;
    }
    if (which === "spv") {
      const s = d.spv; const reg = /^SPV [A-Z][a-z]+ \d/.test(s.name);
      return `<div class="card pop wide">${close}<div class="eyebrow">Company</div><h3>${esc(spvLabel(d) || "SPV")}</h3><div class="bodyc">The SPV holds the property for this deal. Set up by ${esc(s.csp || "the CSP")}.</div>
        <div class="pcols"><div><div class="psec"><div style="display:flex;justify-content:space-between"><span class="eyebrow">Company data</span><button class="link small" data-a="editSpv">${S.editSpv ? "Save" : "Edit"}</button></div><div class="kv" style="margin-top:10px">
          ${[["Registration no.", s.reg ? "On file with the CSP" : "Not yet"], ["Registered on", s.regOn || "Not yet"], ["Jurisdiction", s.jurisdiction || "Free zone, Dubai"], ["Registered address", s.address || "Not yet"], ["Renewal due", s.renewal || "Not yet"], ["Corporate tax TRN", s.trn && /\d/.test(s.trn) ? "On file" : (s.trn || "Not yet")], ["VAT", s.vat || "Not registered"], ["Bank account", s.bank || "Not yet"], ["Service provider", s.csp || ""]].map((r) => `<span class="k">${r[0]}</span>${S.editSpv ? `<input class="field mini" value="${esc(r[1])}">` : `<span>${esc(r[1])}</span>`}`).join("")}</div></div>
        </div><div><div class="psec"><div style="display:flex;justify-content:space-between"><span class="eyebrow">Documents</span><label class="link small upl">+ Upload<input type="file" data-up="spv" data-i="-1" hidden></label></div>${docList(spvDocs(d), "spv")}</div></div></div>
        <div class="psec sbank"><div style="display:flex;justify-content:space-between"><span class="eyebrow">Bank account of the SPV</span><span class="pill ${s.bank === "Open" ? "p-done" : "p-client"}">${esc(s.bank === "Open" ? "Open" : s.bank || "Not yet")}</span></div>
          <div class="kv" style="margin-top:10px"><span class="k">Bank</span><span>Agreed bank, Dubai</span><span class="k">IBAN</span><span>${s.bank === "Open" ? "AE07 •••• •••• •••• " + String((s.reg || "0000").replace(/\D/g, "")).slice(-4) : "After the account is opened"}</span><span class="k">Used for</span><span>The client pays the monthly fee to this account. Payments reads these details.</span></div></div>
        <div class="pfoot"><button class="btn" data-a="askCsp">Ask the CSP for what is missing</button></div></div>`;
    }
    if (which === "origin") {
      const o = originOf(d); const com = o.pct ? Math.round(d.terms.amount * o.pct / 100) : 0;
      const st = !com ? "" : d.stage < 8 ? "Not due yet" : d.payments && d.payments.paid >= 1 ? "Due, the client's payments have started" : "Due after the first monthly fee";
      return `<div class="card pop">${close}<div class="eyebrow">Origin</div><h3>${o.type === "Client" ? "Came directly" : "Brought by a " + o.type.toLowerCase()}</h3>
        <div class="kv"><span class="k">Type</span><span>${o.type}</span><span class="k">${o.type === "Client" ? "Channel" : "Who"}</span><span>${esc(o.who)}</span>
        ${com ? `<span class="k">Commission</span><span>${o.pct}%, ${num(com)}</span><span class="k">When paid</span><span>After the client's monthly payments start</span><span class="k">Status</span><span>${st}</span>` : '<span class="k">Commission</span><span>None</span>'}</div></div>`;
    }
    const t = d.terms; const fee = Math.round(t.amount * t.rate / 100 / 12); const rv = d.termsReview; const sf = t.serviceFee || 15000; const sfPaid = t.serviceFeePaid || (d.stage > 1 ? "Paid" : "Invoice not paid yet");
    return `<div class="card pop wide">${close}<div class="eyebrow">Terms</div><h3>${money(t.amount)} at ${t.rate}% a year</h3><div class="bodyc">Signed by the CEO and the CFO. The fee is set per deal, 14 to 18% a year. You see the terms, you do not change them here.</div>
      <div class="amt3">${[["Asked for", num(asked(d)), "From the application"], ["Approved", d.stage === 1 && step01(d) < 2 ? "Not yet" : num(t.amount), "Signed by the CEO and the CFO"], ["In the term sheet", d.stage === 1 && step01(d) < 4 ? "Not issued yet" : num(t.amount), "What the client accepted"]].map((x) => `<div><div class="small muted">${x[0]}</div><div class="vnum">${x[1]}</div><div class="small muted">${x[2]}</div></div>`).join("")}</div>
      ${rv ? `<div class="miss" style="background:var(--bt);border-color:var(--blue)"><b>Review requested ${esc(rv.when)}</b><div class="small bodyc" style="margin-top:4px">${esc(rv.what)}: ${esc(rv.to)}. Decision by ${esc(rv.by)}.</div></div>` : ""}
      <div class="pcols"><div><div class="psec"><div class="eyebrow">Key terms</div><div class="kgrid">
        <div><div class="small muted">Amount</div><div class="vnum">${money(t.amount)}</div></div>
        <div><div class="small muted">Fee a year</div><div class="vnum">${t.rate}% a year</div></div>
        <div><div class="small muted">Monthly fee</div><div class="vnum">${num(fee)}</div></div>
        <div><div class="small muted">Term</div><div class="vnum">${t.months} months</div></div></div>
        <div class="sfee"><div><div class="small muted">Service fee, fixed</div><div class="vnum">${num(sf)}</div></div><div class="small bodyc">Paid once, after the term sheet and the Service Agreement.<br>${esc(sfPaid)}</div></div>
        <details class="brk"><summary class="small">What the client pays in total</summary><div class="kv" style="margin-top:10px">
          <span class="k">Amount</span><span>${num(t.amount)}</span><span class="k">Rate a year</span><span>${t.rate}%</span><span class="k">A year</span><span>${num(Math.round(t.amount * t.rate / 100))}</span><span class="k">Monthly fee</span><span>${num(fee)}, every month</span><span class="k">Over ${t.months} months</span><span>${num(fee * t.months)}</span><span class="k">Service fee, once</span><span>${num(sf)}</span><span class="k"><b>Fees in total</b></span><span><b>${num(fee * t.months + sf)}</b></span><span class="k">At the exit</span><span>${num(t.amount)} capital returns</span></div></details></div>
      </div><div><div class="psec"><div class="eyebrow">What the client asked for</div><div class="kv" style="margin-top:10px">${t.neededBy ? `<span class="k">Needed by</span><span>${t.neededBy}</span>` : ""}${t.purpose ? `<span class="k">Purpose</span><span>${esc(t.purpose)}</span>` : ""}<span class="k">LTV</span><span>${d.property.ltv}% on the valuation, decided at Screening</span><span class="k">Economics</span><span>Signed by the CEO and the CFO, 06 Nov</span></div></div></div></div>
      <div class="pfoot"><button class="btn ${rv ? "" : "fill"}" data-a="termsReview">${rv ? "Change the request" : "Ask for a terms review"}&nbsp;&nbsp;→</button><span class="small muted">The client asked for another fee, amount or term. Goes to the CEO and the CFO.</span></div></div>`;
  }
  function roomFacts(d) {
    if (d.stage <= 7) {
      const f = d.forecast || { date: "On track", cond: "", spare: d.terms.neededBy || "Not set", holds: mainAct(d).title };
      return { cells: [["Funding forecast", `<b>${esc(f.date)}</b>`, f.cond ? esc(f.cond.charAt(0).toUpperCase() + f.cond.slice(1)) : ""], ["Client needs it by", esc(f.spare.split(",")[0]), f.spare.split(",").slice(1).join(",").trim()]], holds: f.holds, hot: mainAct(d).whose !== "you" };
    }
    const p = d.payments || { paid: 0, of: 12, fee: 0 };
    if (d.stage === 8) return { cells: [["Next fee", `<b>Fee ${p.lateNo || p.paid + 1} of ${p.of}</b>`, num(p.fee)], ["Paid", p.paid + " of " + p.of + " fees", ""]], holds: d.forecast ? d.forecast.holds : mainAct(d).title, hot: mainAct(d).chip[0] === "late" };
    return { cells: [["Exit", "<b>Planned</b>", ""], ["Capital to return", num(d.terms.amount), ""]], holds: mainAct(d).title, hot: false };
  }
  function moreMenu() {
    const d0 = curDeal(); const pinned = d0 && S.pins.includes(d0.id);
    const it = (a, v, t, sub) => `<div class="it" data-a="${a}" ${v ? `data-v="${v}"` : ""}><div><div class="t">${t}</div><div class="small muted">${sub}</div></div></div>`;
    return `<div class="card menu" style="width:260px">${it("export", "print", "Deal summary, PDF", "One page, print or save")}${it("export", "csv-deal", "All data, CSV", "Opens in Excel")}${it("export", "copy", "Copy summary", "Paste into a message")}${it("pinDeal", "", pinned ? "Unpin from Home" : "Pin to Home", pinned ? "Remove from your board" : "Keep it on your board")}${it("handover", "", "Hand over", "To another manager")}${it("closeDeal", "", "Close the deal", "It fell through")}</div>`;
  }
  function topbar(d) {
    const line = (items) => `<div class="card fstrip">${items.map((x, i) => `${i ? '<span class="fsep"></span>' : ""}<span class="fk">${x[0]}</span><span class="fv" ${x[2] ? 'style="color:var(--coral)"' : ""}>${x[1]}</span>`).join("")}</div>`;
    if (d.stage <= 7) {
      const f = d.forecast || { date: "On track", cond: "", spare: d.terms.neededBy || "Not set", holds: mainAct(d).title };
      return line([["Funding forecast", `<b>${esc(f.date)}</b>${f.cond ? ", " + esc(f.cond) : ""}`], ["Client needs it by", esc(f.spare)], ["What holds it", esc(f.holds), mainAct(d).whose !== "you"]]);
    }
    const p = d.payments || { paid: 0, of: 12, fee: 0 };
    if (d.stage === 8) return line([["Next fee", `<b>${p.lateNo ? "Fee " + p.lateNo + " of " + p.of : "Next fee"}</b>, ${num(p.fee)}`], ["Paid", p.paid + " of " + p.of + " fees"], ["What holds it", esc(d.forecast ? d.forecast.holds : mainAct(d).title), true]]);
    return line([["Exit", "<b>Planned</b>"], ["Capital to return", num(d.terms.amount)], ["What holds it", esc(mainAct(d).title)]]);
  }
  function stages(d) {
    let h = '<div class="card pad"><div class="eyebrow" style="margin-bottom:8px">Stages</div>';
    let inRun = false;
    window.STAGES.forEach((s) => {
      const run = s.n === d.stage || s.n === d.parallel;
      if (run && !inRun) { h += '<div class="running"><div class="eyebrow blue" style="margin:2px 0 4px">Running now</div>'; inRun = true; }
      if (!run && inRun) { h += "</div>"; inRun = false; }
      const overNow = s.n === d.stage && ((s.ideal && d.day > s.ideal) || (s.n >= 8 && mainAct(d).chip[0] === "late"));
      const cls = s.n < d.stage && s.n !== d.parallel ? "done" : s.n === d.stage ? "cur" + (overNow ? " over" : "") : s.n === d.parallel ? "par" : "later";
      let dd = s.ideal ? s.ideal + " d" : "monthly";
      if (s.n === 8) dd = d.payments ? d.payments.paid + " of 12" : "monthly";
      if (s.n === 9) dd = "";
      if (s.n === d.stage && s.ideal) dd = `<span class="${d.day > s.ideal ? "coral" : ""}">${d.day} / ${s.ideal} d</span>`;
      if (s.n === d.parallel) dd = `0 / ${s.ideal} d`;
      const sub = s.n === d.stage ? `<div class="small bodyc">${WHOSE[mainAct(d).whose][0]}</div>` : s.n === d.parallel ? '<div class="small" style="color:var(--blue)">Can start now</div>' : "";
      h += `<div class="stage ${cls}"><span class="sd"></span><div><div class="nm">${two(s.n)}&nbsp;&nbsp;${s.name}</div>${sub}</div><span class="dd">${dd}</span></div>`;
      if (s.n === 1 && d.stage === 1) h += `<div class="s01">${S01.map((x, i) => `<div class="${i < step01(d) ? "done" : i === step01(d) ? "cur" : ""}"><span class="sq"></span><span class="nm2">${x[0]}${x[1] ? `<span class="mxs">Portal: ${x[1]}</span>` : ""}</span></div>`).join("")}${step01(d) === 2 ? '<div class="small bodyc" style="margin:6px 0 2px 24px">You collect the AML documents: PEP, sanctions. The CEO decides the risk.</div>' : ""}</div>`;
    });
    if (inRun) h += "</div>";
    return h + '</div>';
  }
  const teamOf = (d) => d.team || [["AK", "Anna K., manager, you", "Opened the deal"], ["CEO", "CEO and CFO, economics", d.stage === 1 && step01(d) < 2 ? "Sign the economics" : "Signed the economics"]];
  const roleOf = (p) => { const r = p[1].split(",").slice(1).join(",").trim(); return r.charAt(0).toUpperCase() + r.slice(1); };
  const actorOf = (p) => p[0] === "AK" ? "You" : p[0] === "CEO" ? "CEO" : p[1].split(",")[0];
  function personLog(d, p) {
    const own = (d.activity || []).filter((e) => e[0] === actorOf(p)).map((e) => [e[1], e[2]]);
    return own.length ? own : [[p[2].replace(/, \d\d \w+$/, ""), (p[2].match(/\d\d \w+$/) || ["This week"])[0]]];
  }
  function avatars(d) {
    const t = teamOf(d);
    return `<div class="avs">${t.map((p, i) => { const log = personLog(d, p); const nm = p[1].split(",")[0], role = roleOf(p);
      return `<div class="avw ${S.avOpen === i ? "open" : ""}"><button class="avatar" data-a="avOpen" data-v="${i}">${esc(p[0])}</button><div class="avcard card"><div style="display:flex;gap:10px;align-items:center"><span class="avatar">${esc(p[0])}</span><div><div style="font-weight:500">${esc(nm)}</div><div class="small muted">${esc(role)}</div></div></div>
        <div class="eyebrow" style="margin-top:14px">Last on this deal</div>${log.slice(0, 3).map((e) => `<div class="avev"><span>${esc(e[0])}</span><span class="small muted">${esc(e[1])}</span></div>`).join("")}
        <button class="link small" style="margin-top:10px" data-a="personLog" data-v="${i}">All actions on this deal&nbsp;&nbsp;→</button></div></div>`; }).join("")}<button class="avatar add" data-a="addPerson" title="Add a person">+</button></div>`;
  }
  function team(d) {
    const t = d.team || [["AK", "Anna K., manager, you", "Opened the deal"], ["CEO", "CEO and CFO, economics", d.stage === 1 && step01(d) < 2 ? "Sign the economics" : "Signed the economics"]];
    return `<div class="card pad"><div class="eyebrow">Who works on this deal</div>${t.map((p) => `<div class="person"><span class="avatar">${p[0]}</span><div><div style="font-weight:500">${esc(p[1])}</div><div class="small muted">${esc(p[2])}</div></div></div>`).join("")}<button class="link small" style="margin-top:14px">+ Add a person</button></div>`;
  }
  function actionsCard(d) {
    return `<div class="card pad"><div class="eyebrow blue" style="margin-bottom:4px">Next actions</div>${d.actions.map((a) => {
      const w = a.done ? "done" : a.whose;
      const hot = !a.done && ["late", "silent"].includes(a.chip[0]);
      return `<div class="act2 ${a.done ? "done" : ""} ${hot ? "hot" : ""}">
        <div class="a2top">${whosePill(w)}<span class="small bodyc">${esc(a.done ? "Done " + a.doneWhen : a.stage)}</span><span style="flex:1"></span>${a.done ? "" : dlChip(a.chip)}</div>
        <div class="a2t">${esc(a.title)}</div>
        ${a.sub ? `<div class="a2s">${esc(a.sub)}</div>` : ""}
        ${a.done ? "" : `<div class="a2b"><button class="btn ${a.whose === "you" ? "fill" : ""}" data-a="panel" data-v="${a.panel || "form"}" data-id="${a.id}">${esc(a.btn)}&nbsp;&nbsp;<span class="arr">→</span></button></div>`}
      </div>`; }).join("")}</div>`;
  }
  function contact(d) {
    const c = d.contact || { last: "Call, 18 Nov, 6 min", quote: "All good, waiting for the next step.", next: "Check-in call", nextWhen: "Tue 26 Nov", today: false, reach: "WhatsApp", prefs: "English", also: "Also: email, phone" };
    return `<div class="card pad"><div style="display:flex;justify-content:space-between"><span class="eyebrow blue">Client contact</span><button class="link small" data-a="crm">Open client card</button></div>
      <div class="tiles"><div class="tile"><span class="eyebrow">Last contact</span><span style="font-weight:500;font-size:14px">${esc(c.last)}</span><span class="small bodyc">“${esc(c.quote)}”</span><div class="row"><button class="link small" data-a="history">Open history&nbsp;&nbsp;→</button></div></div>
      <div class="tile ${c.today ? "hot" : ""}"><div style="display:flex;justify-content:space-between"><span class="eyebrow">Next contact</span>${c.today ? '<span class="tag">TODAY</span>' : ""}</div><span style="font-weight:500;font-size:14px">${esc(c.next)}</span><span class="small bodyc">${esc(c.nextWhen)}</span><div class="row"><button class="btn fill" data-a="reach" data-v="WhatsApp">WhatsApp</button><button class="btn" data-a="reach" data-v="Call">Call</button></div></div>
      <div class="tile"><span class="eyebrow">How to reach</span><span style="font-weight:500;font-size:14px">${esc(c.reach)}</span><span class="small bodyc">${esc(c.prefs)}</span><span class="small muted">${esc(c.also)}</span><div class="row"><button class="link small" data-a="reach" data-v="Email">Write an email&nbsp;&nbsp;→</button></div></div></div>
      <div style="display:flex;gap:14px;align-items:center;margin-top:16px"><button class="btn" data-a="log">+&nbsp;&nbsp;Log a call or meeting</button></div></div>`;
  }
  function documents(d) {
    const tabs = d.docs ? Object.keys(d.docs) : [stageName(d.stage).replace(/^(\d\d) /, "$1 ")];
    const tab = S.docTab && tabs.includes(S.docTab) ? S.docTab : tabs[0];
    const dd = (d.docs && d.docs[tab]) || { done: 3, total: 3, received: ["Stage documents"], csp: [] };
    const missing = d.missing || [];
    return `<div class="card pad"><div style="display:flex;justify-content:space-between"><span class="eyebrow">Documents</span><button class="link small" data-a="export" data-v="zip">Download all&nbsp;&nbsp;↓</button></div>
      <div class="doctabs">${tabs.map((t) => { const x = (d.docs && d.docs[t]) || dd; return `<button class="${t === tab ? "on" : ""}" data-a="doctab" data-v="${t}">${t.replace(/^\d\d /, "")}&nbsp;&nbsp;${x.done} / ${x.total}</button>`; }).join("")}</div>
      ${missing.length && tab === tabs[0] ? `<div class="miss"><div style="display:flex;justify-content:space-between"><span style="font-weight:500">${missing.length} missing</span><span class="small" style="color:var(--blue)">In Next actions ↑</span></div><div class="small bodyc" style="margin-top:4px">${esc(missing.join(", "))}</div></div>` : ""}
      ${dd.csp.map((x) => `<div class="rowline"><span>${esc(x)}</span><span class="pill p-csp">With the CSP</span></div>`).join("")}
      <details style="margin-top:10px"><summary class="small" style="cursor:pointer">${dd.received.length} received</summary>${dd.received.map((x) => `<div class="rowline small"><span>${esc(x)}</span><button class="link" data-a="export" data-v="file">↓</button></div>`).join("")}</details>
      <button class="btn" style="margin-top:14px" data-a="upload">Upload document</button></div>`;
  }
  function activity(d) {
    const a = d.activity || [["You", "Opened the deal", "This week"]];
    return `<div class="card pad"><div class="eyebrow">Recent activity</div>${a.slice(0, 2).map((e) => `<div class="ev"><span class="who">${esc(e[0])}</span><span style="font-weight:500">${esc(e[1])}</span><div class="small muted" style="margin-top:4px">${esc(e[2])}</div></div>`).join("")}
      <button class="link" style="margin-top:12px" data-a="history">${a.length === 1 ? "Open history" : "All " + a.length + " events"}&nbsp;&nbsp;→</button></div>`;
  }
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmtD = (t) => String(t.getDate()).padStart(2, "0") + " " + MON[t.getMonth()] + " " + t.getFullYear();
  function feePlan(d) {
    const p = d.payments || { paid: 0, of: 12, fee: 0 };
    const fee = p.fee || Math.round(d.terms.amount * d.terms.rate / 100 / 12);
    const late = mainAct(d).chip[0] === "late";
    const lateDays = late ? (p.lateDays || chipDays(mainAct(d).chip)) : 0;
    const anchor = late ? new Date(window.TODAY.getTime() - lateDays * 864e5) : (p.nextDue ? new Date(p.nextDue) : new Date(window.TODAY.getTime() + 10 * 864e5));
    const rows = [];
    for (let i = 0; i < p.of; i++) {
      const t = new Date(anchor); t.setMonth(anchor.getMonth() + (i - p.paid));
      const k = i < p.paid ? "paid" : i === p.paid && late ? "late" : "due";
      rows.push({ n: i + 1, date: fmtD(t), k });
    }
    return { p, fee, late, lateDays, rows, exit: rows.length ? rows[rows.length - 1].date : "" };
  }
  function payBlocks(d) {
    const F = feePlan(d);
    const lvl = F.lateDays >= 30 ? 2 : F.lateDays > 0 ? 1 : 0;
    const ladder = [[1, "1 to 29 days late", "The manager reminds the client", "Reminder, then a call. Logged in the activity."], [2, "30 days and more", "Goes to the CEO and the CFO", "They decide the next step. The manager prepares the case."]];
    const lateCard = F.late ? `<div class="card pad paylate"><div class="dhead"><span class="eyebrow">Late fee</span>${dlChip(mainAct(d).chip)}</div>
        <div class="plnum">${num(F.fee)}</div><div class="mline">Fee ${F.p.paid + 1} of ${F.p.of}, due ${F.rows[F.p.paid].date}</div>
        <div class="mwhy">A monthly fee is late. From 30 days late the deal goes to the CEO and the CFO.</div>
        <div class="ladder">${ladder.map(([n, r, t, w]) => `<div class="lstep ${n === lvl ? "on" : ""}"><span class="small">${r}</span><b>${t}</b><span class="small bodyc">${w}</span></div>`).join("")}</div></div>`
      : `<div class="card pad payok"><span class="eyebrow">Monthly fees</span><div class="mline" style="margin-top:6px">No late fees. Next: fee ${F.p.paid + 1} of ${F.p.of}, ${num(F.fee)}, due ${F.rows[F.p.paid] ? F.rows[F.p.paid].date : ""}.</div></div>`;
    const tiles = `<div class="card pad"><div class="dhead"><span class="eyebrow">Monthly fees</span><span class="small bodyc">${F.p.paid} of ${F.p.of} received, ${num(F.fee)} each</span></div>
        <div class="ftiles">${F.rows.map((r) => `<div class="ft ${r.k}" title="Fee ${r.n}, ${r.date}: ${r.k === "paid" ? "received" : r.k}"><span>${r.n}</span></div>`).join("")}</div>
        <div class="flegend"><span><i class="ft paid"></i>received</span><span><i class="ft late"></i>late</span><span><i class="ft due"></i>expected</span><span class="bodyc">The capital returns at the exit, ${F.exit}.</span></div>
        <table class="ptable"><thead><tr><th>Fee</th><th>Due</th><th>Amount</th><th>Source</th><th>Status</th></tr></thead><tbody>
        ${F.rows.slice(Math.max(0, F.p.paid - 2), F.p.paid + 3).map((r) => `<tr class="${r.k}"><td>${r.n} of ${F.p.of}</td><td>${r.date}</td><td>${num(F.fee)}</td><td class="bodyc">${r.k === "paid" ? "SPV bank statement" : r.k === "late" ? "Not in the SPV account yet" : "Schedule"}</td><td><span class="pill ${r.k === "paid" ? "p-done" : r.k === "late" ? "d-late" : "d-left"}">${r.k === "paid" ? "Received" : r.k === "late" ? F.lateDays + " days late" : "Expected"}</span></td></tr>`).join("")}
        </tbody></table></div>`;
    const dates = `<div class="card pad"><div class="eyebrow">Key dates</div>${[["Next fee", F.rows[F.p.paid] ? F.rows[F.p.paid].date : "None", F.late ? "late" : ""], ["SPV renewal", d.spv.renewal || "Not set", ""], ["Exit, capital returns", F.exit, ""]].map(([l, v, h]) => `<div class="kd"><span class="kdot ${h}"></span><div><div style="font-weight:500">${l}</div><div class="small bodyc">${esc(v)}</div></div></div>`).join("")}</div>`;
    return { lateCard, tiles, dates };
  }
  function room(d) {
    const st = window.STAGES[d.stage - 1];
    const over = st.ideal && d.day > st.ideal ? `<span class="pill d-late">+${d.day - st.ideal} d over ideal</span>` : "";
    const F = roomFacts(d);
    const ent = ([k, l, v, sub]) => `<div class="rcell ent"><div class="eyebrow">${l}</div>${v ? `<button class="rv link" data-a="pop" data-v="${k}">${esc(v)}</button>` : '<div class="rv muted">Not set up yet</div>'}<div class="small bodyc">${esc(sub || "")}</div>${S.pop === k ? pop(d, k) : ""}</div>`;
    const fact = (x) => `<div class="rcell"><div class="eyebrow">${x[0]}</div><div class="rv">${x[1]}</div><div class="small bodyc">${x[2] || ""}</div></div>`;
    return nav("Deal portfolio") + `<div class="page">
      <div class="rtop"><div class="crumbs"><a href="#/deals">Deal portfolio</a>&nbsp;&nbsp;/&nbsp;&nbsp;${esc(dealName(d))}</div>
        <div class="ractions">${avatars(d)}<button class="btn" data-a="crm">Client card</button><div class="rel"><button class="btn" data-a="exportOpen">More&nbsp;&nbsp;▾</button>${S.exportOpen ? moreMenu() : ""}</div></div></div>
      <div class="eyebrow blue roomlabel">Deal room</div>
      <div class="titleline"><h1>${esc(dealName(d))}</h1>${typeChip(typeOf(d))}${pinBtn(d)}${over}</div>
      ${isFunded(d) ? `<div class="hello">${esc(d.client)}, ${esc(d.property.label)}</div>` : ""}
      ${(S.pop && S.pop !== "origin") || S.exportOpen ? '<div class="dim soft" data-a="closeAll"></div>' : ""}
      <div class="card rfacts">
        ${[["property", "Property", d.property.label, d.property.area], ["spv", "Company", spvLabel(d), d.spv.status], ["terms", "Terms", money(d.terms.amount) + " at " + d.terms.rate + "% a year", d.terms.months + " months"]].map(ent).join("")}
        ${F.cells.map(fact).join("")}
        ${fact(["Portal status", esc(maxStatus(d)), "As the team sees it"])}
      </div>
      ${d.stage >= 8 ? "" : `<div class="rholds ${F.hot ? "hot" : ""}"><span class="eyebrow">What holds it</span><span class="rhv">${esc(F.holds)}</span></div>`}
      ${d.stage >= 8 ? (() => { const P = payBlocks(d); return `<div class="draftnote"><span class="pill mx">Draft</span><span>Payments stage. Built on the variant A screen to show the direction. The fee economics are not designed in this case.</span></div>
      <div class="grid3"><div class="col">${stages(d)}</div><div class="col">${P.lateCard}${P.tiles}${actionsCard(d)}</div><div class="col">${P.dates}${documents(d)}${activity(d)}</div></div>`; })()
      : `<div class="grid3"><div class="col">${stages(d)}</div><div class="col">${actionsCard(d)}${contact(d)}</div><div class="col">${documents(d)}${activity(d)}</div></div>`}
    </div>` + overlay(d);
  }

  // ---------- overlays
  function overlay(d) {
    if (!S.drawer && !S.dialog) return "";
    let h = '<div class="dim" data-a="closeAll"></div>';
    if (S.drawer) h += `<div class="drawer"><button class="close" data-a="closeAll">Close ×</button>${drawer(d)}</div>`;
    if (S.dialog) h += `<div class="dialog"><button class="close" data-a="closeAll">Close ×</button>${dialog(d)}</div>`;
    return h;
  }
  function chan() { return `<div style="display:flex;gap:8px;margin-top:8px">${["WhatsApp", "Email", "Client portal"].map((c) => `<button class="opt ${S.channel === c ? "on" : ""}" data-a="channel" data-v="${c}">${c}</button>`).join("")}</div>`; }
  function drawer(d) {
    const k = S.drawer.kind;
    const act = d.actions.find((a) => a.id === S.drawer.id) || mainAct(d);
    if (k === "remind") {
      const items = act.whose === "csp" ? [act.title] : (d.missing.length ? d.missing : [act.title]);
      const to = act.whose === "csp" ? "the CSP" : "the client";
      return `${whosePill(act.whose)}&nbsp;&nbsp;<span class="eyebrow">${esc(act.stage)}</span><h2>Remind ${to}</h2><div class="bodyc">${esc(act.chip[1])}. Reminders so far: 12 Nov, 20 Nov.</div>
        <div class="sec"><div class="eyebrow">What is missing</div>${items.map((i) => `<div class="reqitem">${esc(i)}</div>`).join("")}</div>
        <div class="sec"><div class="eyebrow">Send by</div>${chan()}</div>
        <div class="sec"><div class="eyebrow">Message</div><textarea style="margin-top:8px">Hello, a short reminder: to move your deal forward we still need ${items.join(" and ").toLowerCase()}. You can upload ${items.length > 1 ? "them" : "it"} in your client portal. Thank you.</textarea></div>
        <div class="sec" style="display:flex;gap:10px"><button class="btn fill big" data-a="sendRemind">Send reminder&nbsp;&nbsp;→</button><button class="btn big" data-a="closeAll">Not now</button></div>`;
    }
    if (k === "check") {
      const up = d.uploads || [];
      return `${whosePill("you")}&nbsp;&nbsp;<span class="eyebrow">Needs your check</span><h2>Check ${up.length} files from the client</h2><div class="bodyc">Uploaded as Title Deed, 18 Nov, via the client portal.</div><div class="small muted" style="margin-top:4px">Task «Title Deed not uploaded» closed automatically.</div>
        <div class="sec"><div class="eyebrow">Files</div>${up.map((f, i) => { const st = S.files[i]; if (f.suspect) return `<div class="file bad"><span class="ic"></span><div class="grow"><div style="font-weight:500">${f.file}</div><div class="small coral">${f.suspect}</div></div>
            <div class="opts"><span class="eyebrow" style="width:100%">What to do with this file</span>${[["accept", "Accept as Title Deed"], ["retype", "Keep, change type to SPA"], ["ask", "Ask for the right file"]].map(([v, t]) => `<button class="opt ${S.fileChoice === v ? "on" : ""}" data-a="fileChoice" data-v="${v}">${t}</button>`).join("")}</div></div>`;
          return `<div class="file"><span class="ic"></span><div class="grow"><div style="font-weight:500">${f.file}</div><div class="small muted">${f.as}</div></div><button class="btn ${st === "ok" ? "fill" : ""}" data-a="fileOk" data-v="${i}">${st === "ok" ? "✓ Accepted" : "Accept"}</button></div>`; }).join("")}
          <button class="link small" style="margin-top:10px" data-a="acceptAll">Accept all 4 clean files</button></div>
        ${S.fileChoice === "ask" ? `<div class="sec"><div class="eyebrow">Goes to the client</div><p>Title Deed: the file scan_0412.pdf is a Sales Purchase Agreement. Please upload the Title Deed itself.</p><div class="small muted">It joins the open request for ${d.missing.length} KYC documents, so the client gets one message, not two.</div></div>` : ""}
        <div class="sec"><button class="btn fill big" data-a="saveCheck">${S.fileChoice === "ask" ? "Save and add to the request" : "Save"}</button></div>`;
    }
    if (k === "request") {
      const items = S.request || [];
      return `${whosePill("client")}&nbsp;&nbsp;<span class="eyebrow">03 KYC</span><h2>One request to the client</h2><div class="bodyc">Everything missing goes in one message, whatever stage it belongs to.</div>
        <div class="sec"><div class="eyebrow">In this request</div>${items.map((i) => `<div class="reqitem"><div style="font-weight:500">${esc(i[0])}</div><div class="small muted">${esc(i[1])}</div></div>`).join("")}</div>
        <div class="sec"><div class="eyebrow">Send by</div>${chan()}</div>
        <div class="sec"><div class="eyebrow">Message</div><textarea style="margin-top:8px;min-height:170px">Hi, ${items.length} things are still missing:\n${items.map((i, n) => n + 1 + ". " + i[2]).join("\n")}\nYou can upload everything in your client portal.</textarea></div>
        <div class="sec" style="display:flex;gap:10px"><button class="btn fill big" data-a="sendRequest">Send request</button><button class="btn big" data-a="closeAll">Edit list</button></div>
        <p class="small muted">Reminders go out automatically on day 1, 4 and 7 if nothing comes.</p>`;
    }
    if (k === "form") {
      const isShare = /share/i.test(act.title);
      const f = isShare ? [["Company", spvLabel(d) || "SPV not set up yet"], ["Shareholders", d.client + ", nominee"], ["Shares", "From the term sheet"], ["CSP", d.spv.csp || "Harbour CS"]] : [["Client", d.client], ["Property", d.property.label], ["Company", spvLabel(d) || "SPV not set up yet"], ["Amount", num(d.terms.amount)]];
      return `${whosePill("you")}&nbsp;&nbsp;<span class="eyebrow">${esc(act.stage)}</span><h2>${esc(act.title)}</h2><div class="bodyc">${esc(act.sub)}</div>
        <div class="sec"><div class="eyebrow">Filled in from the deal</div><div class="kv" style="margin-top:10px">${f.map((x) => `<span class="k">${x[0]}</span><span>${esc(x[1])}</span>`).join("")}</div></div>
        <div class="sec"><div class="eyebrow">You fill in</div><input class="field" style="margin-top:8px" placeholder="${isShare ? "Share split, e.g. 70 / 30" : "Note"}"><input class="field" style="margin-top:8px" placeholder="${isShare ? "Signing date" : "Date"}"></div>
        <div class="sec"><button class="btn fill big" data-a="sendForm">${isShare ? "Send to the CSP" : esc(act.btn)}&nbsp;&nbsp;→</button></div>`;
    }
    if (k === "ceo") {
      return `${whosePill("ceo")}<h2>Economics with the CEO and the CFO</h2><div class="bodyc">Sent 20 Nov. Decision by 25 Nov.</div><div class="sec kv"><span class="k">What</span><span>Economics, version 2, after the valuation</span><span class="k">Asked for</span><span>${num(d.terms.amount)}</span><span class="k">Valuation</span><span>${num(d.property.valuation)}</span><span class="k">Your note</span><span>The valuation supports less than the client asked for.</span></div><div class="sec"><button class="btn big" data-a="closeAll">Close</button></div>`;
    }
    if (k === "client") {
      const o = originOf(d); const c = d.contact || {};
      const kyc = d.stage >= 4 ? ["Passed", "p-done"] : d.stage === 3 ? ["In progress", "p-client"] : ["Not started", "p-csp"];
      const others = window.CLOSED.filter((x) => x.client === d.client);
      const sec = (t, body) => `<div class="sec"><div class="eyebrow">${t}</div>${body}</div>`;
      const kv = (rows) => `<div class="kv" style="margin-top:10px">${rows.map((r) => `<span class="k">${r[0]}</span><span>${r[1]}</span>`).join("")}</div>`;
      return `<span class="pill mx">Draft</span><h2 style="margin-top:10px">${esc(d.client)}</h2><div class="bodyc">${esc(d.type)} <span class="pill og ${o.type}">${o.type}</span></div>
        <p class="small muted" style="margin-top:10px">The client card is the person or the company, not the deal. It is created in Leads with the first application and stays when a deal closes. One client can have several deals. The deal reads from the card and does not copy it.</p>
        ${sec("Who", kv([[d.type === "Company" ? "Company" : "Full name", esc(d.client) + (d.type === "Company" ? ", LLC" : "")], [d.type === "Company" ? "Signatory" : "Residency", d.type === "Company" ? "Director, " + esc(d.client) : "UAE resident"], ["Country check", "Done at Screening"], ["First application", d.fresh ? "22 Nov, from Leads" : "12 Nov, Leads"]]))}
        ${sec("Contact", kv([["Reach by", esc(c.reach || "WhatsApp")], ["Language", esc((c.prefs || "English").split(",")[0])], ["Also", esc((c.also || "Email, phone").replace(/^Also: /, ""))]]) + '<button class="link small" style="margin-top:10px" data-a="history">Open the full conversation&nbsp;&nbsp;→</button>')}
        ${sec("Origin", kv([["Type", o.type], [o.type === "Client" ? "Channel" : "Who", esc(o.who)], ["Commission", o.pct ? o.pct + "%, after the client's payments start" : "None"]]))}
        ${sec("Client documents", `<div class="small muted" style="margin-top:6px">Documents of the person or company. Property and SPV documents live in the deal.</div>` + [["Passport", "Received at Screening"], ["Emirates ID", d.type === "Company" ? "Director's, received" : "Received at Screening"], ["Proof of address", d.stage >= 3 ? "Received" : "Not yet"], ["Bank statement, 6 months", d.stage >= 3 ? "Received" : "Not yet"]].map((x) => `<div class="rowline small"><span>${x[0]}</span><span class="muted">${x[1]}</span></div>`).join("") + `<div class="rowline small"><span style="font-weight:500">KYC and AML</span><span class="pill ${kyc[1]}">${kyc[0]}</span></div>`)}
        ${sec("Deals of this client", `<div class="rowline small"><span><b>${esc(d.property.label)}</b><br><span class="muted">${esc(stageText(d))}</span></span><span class="pill p-you">This deal</span></div>` + others.map((x) => `<div class="rowline small"><span>${esc(x.property)}<br><span class="muted">${esc(x.stage)}</span></span><span class="pill p-closed">Closed</span></div>`).join("") + '<button class="link small" style="margin-top:10px" data-a="newDealSame">+ Start another deal for this client</button>')}`;
    }
    if (k === "fund") {
      return `${whosePill("you")}&nbsp;&nbsp;<span class="eyebrow">${esc(act.stage)}</span><h2>Hand over to funding</h2><div class="bodyc">Contracts are signed and the client paid the down payment. The CEO allocates the capital in his console. You do not pick the capital provider.</div>
        <div class="sec"><div class="eyebrow">Goes with it</div><div class="kv" style="margin-top:10px"><span class="k">Amount</span><span>${num(d.terms.amount)}</span><span class="k">Needed by</span><span>${esc(d.terms.neededBy || "Not set")}</span><span class="k">SPV account</span><span>${esc(spvLabel(d) || "SPV")}, ${esc(d.spv.bank === "Open" ? "account open" : "account not open yet")}</span></div></div>
        <div class="sec"><button class="btn fill big" data-a="sendFund">Hand over to funding&nbsp;&nbsp;→</button></div>
        <p class="small muted">The deal shows «With CEO and CFO» until the capital is in the SPV account. The forecast waits for it.</p>`;
    }
    if (k === "person") {
      const p = teamOf(d)[S.drawer.i] || teamOf(d)[0]; const log = personLog(d, p);
      return `<span class="eyebrow">Who works on this deal</span><h2>${esc(p[1].split(",")[0])}</h2><div class="bodyc">${esc(roleOf(p))}. Everything this person did on ${esc(d.client)}, newest first.</div>
        <div class="feed sec">${log.map((e) => `<div class="msg"><div class="small muted">${esc(e[1])}</div><div style="margin-top:4px">${esc(e[0])}</div></div>`).join("")}</div>`;
    }
    if (k === "history") {
      const hist = d.history || [["18 Nov", "Call", "You", "Check-in, nothing new."]];
      const F = ["All", "Calls", "Messages", "Team notes"];
      const pass = (m) => S.histFilter === "All" || (S.histFilter === "Calls" && /Call|Meeting/.test(m[1])) || (S.histFilter === "Messages" && /WhatsApp|Email|Portal/.test(m[1])) || (S.histFilter === "Team notes" && /note/i.test(m[1]));
      return `<span class="eyebrow">Client card, all deals</span><h2>${esc(d.client)}, full conversation</h2><div class="bodyc">Calls, messages, portal and team notes in one feed. Saved in the client card.</div>
        <div style="display:flex;gap:8px;margin-top:14px">${F.map((f) => `<button class="opt ${S.histFilter === f ? "on" : ""}" data-a="histFilter" data-v="${f}">${f}</button>`).join("")}</div>
        <div class="feed sec">${hist.filter(pass).map((m) => `<div class="msg"><div class="small muted">${esc(m[0])}, ${esc(m[1])}, ${esc(m[2])}</div><div style="margin-top:4px">${esc(m[3])}</div></div>`).join("")}</div>
        <div class="sec"><textarea placeholder="Write to the client or add a team note" style="min-height:80px"></textarea><div style="display:flex;gap:8px;margin-top:8px"><button class="btn fill" data-a="sendMsg" data-v="client">To client</button><button class="btn" data-a="sendMsg" data-v="team">Team note</button></div></div>`;
    }
    return "";
  }
  function dialog(d) {
    const k = S.dialog;
    if (k === "handover") return `<h2>Hand over ${esc(d.client)}</h2><div class="bodyc">The new manager gets the deal, its history and the open actions. The client is told by message.</div>
      <div class="sec"><div class="eyebrow">To</div>${window.MANAGERS.slice(1).map((m, i) => `<label class="file" style="cursor:pointer"><input type="radio" name="mgr" ${i === 0 ? "checked" : ""} value="${m}"> <span class="grow">${m}</span><span class="small muted">${[14, 9][i]} deals</span></label>`).join("")}</div>
      <div class="sec"><div class="eyebrow">Note for the new manager</div><textarea style="min-height:80px;margin-top:8px">Client waits for the HR letter. Follow-up call due today after 17:00.</textarea></div>
      <div class="sec" style="display:flex;gap:10px"><button class="btn fill big" data-a="doHandover">Hand over</button><button class="btn big" data-a="closeAll">Cancel</button></div>`;
    if (k === "terms") { const t = d.terms; return `<span class="pill p-ceo">CEO and CFO</span><h2>Ask for a terms review</h2><div class="bodyc">${esc(d.client)}, ${money(t.amount)} at ${t.rate}% a year for ${t.months} months. The CEO and the CFO sign a new version of the economics, you get the answer in Next actions.</div>
      <div class="sec"><div class="eyebrow">What should change</div><div style="display:flex;gap:8px;margin-top:8px">${["Fee", "Amount", "Term", "Other"].map((x) => `<button class="opt ${S.reviewWhat === x ? "on" : ""}" data-a="reviewWhat" data-v="${x}">${x}</button>`).join("")}</div></div>
      <div class="sec" style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><div class="eyebrow">Now</div><input class="field" style="margin-top:8px" value="${S.reviewWhat === "Amount" ? num(t.amount) : S.reviewWhat === "Term" ? t.months + " months" : t.rate + "% a year"}" disabled></div><div><div class="eyebrow">Client asks for</div><input id="rvTo" class="field" style="margin-top:8px" value="${S.reviewWhat === "Amount" ? "$1,250,000" : S.reviewWhat === "Term" ? "18 months" : "12% a year"}"></div></div>
      <div class="sec"><div class="eyebrow">Why</div><textarea id="rvWhy" style="min-height:90px;margin-top:8px">Client has an offer from another provider at a lower rate and asks us to match it. Strong file, KYC almost done.</textarea></div>
      <div class="sec"><div class="eyebrow">Attached automatically</div><div class="small bodyc" style="margin-top:6px">Property valuation, client profile, current terms, conversation history.</div></div>
      <div class="sec" style="display:flex;gap:10px"><button class="btn fill big" data-a="sendReview">Send to the CEO and the CFO</button><button class="btn big" data-a="closeAll">Cancel</button></div>`; }
    if (k === "close") {
      return `<h2>Close the deal: ${esc(d.client)}</h2><div class="bodyc">For a deal that fell through after it started, at any stage. There is no standard reason here, so write what happened in your own words.</div>
      <div class="sec kv"><span class="k">Stage now</span><span>${esc(stageText(d))}</span><span class="k">Amount</span><span>${num(d.terms.amount)}</span></div>
      <div class="sec"><div class="eyebrow">What happened, required</div><textarea id="closeWhy" style="min-height:110px;margin-top:8px" placeholder="For example: the client sold the property elsewhere before the purchase"></textarea></div>
      <div class="sec"><div class="eyebrow">What else happens</div><div class="small bodyc" style="margin-top:6px">The deal leaves the list and goes to the archive with your note. Open tasks and reminders stop. The CEO and the CFO see it in the archive. Stage 08 and later: unpaid fees stay with Payments.</div></div>
      <div class="sec" style="display:flex;gap:10px"><button class="btn fill big" data-a="doClose">Close the deal</button><button class="btn big" data-a="closeAll">Cancel</button></div>`;
    }
    if (k === "log") return `<h2>Log a call or meeting</h2><div class="bodyc">Made from your own phone or in person. It goes to the client card and updates Last and Next contact.</div>
      <div class="sec"><div class="eyebrow">What was it</div><div style="display:flex;gap:8px;margin-top:8px">${["Call", "Meeting", "WhatsApp", "Email", "Other"].map((t) => `<button class="opt ${S.logType === t ? "on" : ""}" data-a="logType" data-v="${t}">${t}</button>`).join("")}</div></div>
      <div class="sec" style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><div class="eyebrow">When</div><input class="field" style="margin-top:8px" value="Today, 17:20"></div><div><div class="eyebrow">How long</div><input class="field" style="margin-top:8px" value="10 min"></div></div>
      <div class="sec"><div class="eyebrow">Result</div><div style="display:flex;gap:8px;margin-top:8px">${["Reached", "No answer", "Rescheduled"].map((t) => `<button class="opt ${S.logResult === t ? "on" : ""}" data-a="logResult" data-v="${t}">${t}</button>`).join("")}</div></div>
      <div class="sec"><div class="eyebrow">What happened</div><textarea id="logtext" style="min-height:80px;margin-top:8px">HR letter is signed, client uploads it tonight.</textarea></div>
      <div class="sec" style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><div class="eyebrow">Next contact</div><input class="field" style="margin-top:8px" value="Mon 25 Nov, 11:00"></div><div><div class="eyebrow">Channel</div><input class="field" style="margin-top:8px" value="WhatsApp"></div></div>
      <div class="sec" style="display:flex;gap:10px"><button class="btn fill big" data-a="saveLog">Save to the client card</button><button class="btn big" data-a="closeAll">Cancel</button></div>`;
    return "";
  }
  function histDialog() {
    const lab = { done: ["Done", "p-done"], moved: ["Moved to the next day", "p-csp"], taken: ["Taken", "d-left"] };
    const day = (title, items) => `<div class="sec"><div class="eyebrow">${title}</div>${items.length ? items.map((x) => `<div class="rowline small hrow"><span class="htime">${esc(x[3] || "")}</span><span class="htext">${x[1] ? `<b>${esc(x[1])}</b>: ` : ""}${esc(x[2])}</span><span class="pill ${(lab[x[0]] || lab.done)[1]}">${(lab[x[0]] || lab.done)[0]}</span></div>`).join("") : '<div class="small muted" style="margin-top:6px">Nothing yet.</div>'}</div>`;
    return `<div class="dim" data-a="closeAll"></div><div class="dialog"><button class="close" data-a="closeAll">Close ×</button><h2>My board, history</h2><div class="bodyc">What you took, finished and moved, day by day. The full story of each deal stays in its room.</div>
      ${day("Today, Fri 22 Nov", S.today)}${S.hist.map((h) => day(h.day, h.items)).join("")}</div>`;
  }
  function ceoDialog() {
    return `<div class="dim" data-a="closeAll"></div><div class="dialog"><button class="close" data-a="closeAll">Close ×</button><span class="pill p-ceo">CEO and CFO</span><h2>Send Client H for a pre-review</h2><div class="bodyc">LTV 68% is above the 65% standard. Exceptions up to 70% are signed by the CEO and the CFO.</div>
      <div class="sec"><div class="eyebrow">Attached automatically</div><div class="kv" style="margin-top:10px"><span class="k">Property</span><span>Villa, Dubai Hills</span><span class="k">Valuation</span><span>$2,600,000, 28 Oct</span><span class="k">Client asks</span><span>$1,770,000 for 12 months</span><span class="k">LTV</span><span>68%, standard 65%</span></div></div>
      <div class="sec"><div class="eyebrow">Your note to the CEO</div><textarea style="min-height:80px;margin-top:8px">Client is ready to add a second property. Meeting is proposed, no reply for 52 h.</textarea></div>
      <div class="sec" style="display:flex;gap:10px"><button class="btn fill big" data-a="sendCeo">Send to the CEO and the CFO</button><button class="btn big" data-a="closeAll">Cancel</button></div></div>`;
  }

  // ---------- PAYMENTS
  function payments() {
    const ds = inScale().filter((d) => d.stage === 8);
    const rows = ds.map((d) => { const a = mainAct(d); const p = d.payments || { paid: 0, of: 12, fee: 0 }; const late = a.chip[0] === "late"; const soon = !late && chipDays(a.chip) <= 7; return { d, p, a, late, soon }; });
    const counts = { all: rows.length, late: rows.filter((r) => r.late).length, week: rows.filter((r) => r.soon).length };
    const list = rows.filter((r) => S.payFilter === "all" || (S.payFilter === "late" ? r.late : r.soon)).sort((x, y) => (y.late - x.late) || chipDays(x.a.chip) - chipDays(y.a.chip));
    return nav("Payments") + `<div class="page"><div class="head"><h1>Payments</h1><div class="grow"></div><button class="btn" data-a="export" data-v="csv-pay">↓&nbsp;&nbsp;Export</button></div>
      <div class="filters">${[["all", "All funded"], ["late", "Late"], ["week", "Due this week"]].map(([k, t]) => `<button class="chip ${S.payFilter === k ? "on" : ""} ${k === "late" ? "warm" : ""}" data-a="payFilter" data-v="${k}">${t}&nbsp;&nbsp;${counts[k]}</button>`).join("")}</div>
      <p class="hint">Monthly fees from clients after funding. Late first.</p>
      <div class="card tablecard"><table class="deals"><thead><tr><th>Client and property</th><th>Paid</th><th>Monthly fee</th><th>Status</th><th></th></tr></thead><tbody>
      ${list.map((r) => `<tr data-a="open" data-id="${r.d.id}"><td><div class="cname">${esc(r.d.client)}</div><div class="small muted">${esc(r.d.property.label)}</div></td>
        <td><div style="display:flex;gap:2px;margin-bottom:5px">${Array.from({ length: 12 }, (_, i) => `<span style="width:10px;height:6px;background:${i < r.p.paid ? "var(--blue)" : i === r.p.paid && r.late ? "var(--coral)" : "var(--line)"}"></span>`).join("")}</div><span class="small bodyc">${r.p.paid} of ${r.p.of}</span></td>
        <td>${num(r.p.fee)}</td><td>${dlChip(r.a.chip)}</td><td style="text-align:right">${r.late ? `<button class="btn fill" data-a="payRemind" data-id="${r.d.id}">Remind&nbsp;&nbsp;→</button>` : `<button class="btn" data-a="open" data-id="${r.d.id}">Open&nbsp;&nbsp;→</button>`}</td></tr>`).join("")}
      </tbody></table>${!list.length ? '<div class="empty">No fees in this view.</div>' : ""}</div></div>`;
  }

  // ---------- LEADS (draft screen)
  function leadCloseDialog() {
    const R = S.closeKind === "Declined" ? ["Property does not fit", "Leasehold", "LTV above 70%", "Country or sanctions", "AML risk, the CEO's decision", "Documents do not match", "Other"] : ["Rate too high", "Unresponsive", "Went to another provider", "Duplicate or test", "Other"];
    return `<div class="dim" data-a="closeAll"></div><div class="dialog"><button class="close" data-a="closeAll">Close ×</button><h2>Close the lead: ${esc(S.closeLead)}</h2><div class="bodyc">The lead leaves Leads and goes to the archive with its reason. It never becomes a deal. The team portal gets the same status.</div>
      <div class="sec"><div class="eyebrow">Who closed it</div><div class="closek">${[["Declined", "We said no", "Client sees «Not proceeding»"], ["Void", "It fell away without our no", "Client sees «Closed»"]].map(([k2, t, c]) => `<button class="ck ${S.closeKind === k2 ? "on" : ""}" data-a="closeKind" data-v="${k2}"><b>${k2}</b><span>${t}</span><span class="small muted">${c}</span></button>`).join("")}</div></div>
      ${S.closeKind ? `<div class="sec"><div class="eyebrow">Reason, required</div><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">${R.map((x) => `<button class="opt ${S.closeReason === x ? "on" : ""}" data-a="closeReason" data-v="${x}">${x}</button>`).join("")}</div></div>
      <div class="sec"><div class="eyebrow">Note</div><textarea style="min-height:70px;margin-top:8px" placeholder="What happened, in one line"></textarea></div>` : ""}
      <div class="sec" style="display:flex;gap:10px"><button class="btn fill big" data-a="doLeadClose">Close as ${S.closeKind || "…"}</button><button class="btn big" data-a="closeAll">Cancel</button></div></div>`;
  }
  function leadsPage() {
    const L = window.LEADS;
    const G = [["all", "All"], ["today", "Needs you today"], ["screen", "In Screening"], ["follow", "Follow-up"]];
    const lf = S.leadFilter || "all";
    const pass = (l) => lf === "all" || (lf === "today" ? l.today : lf === "screen" ? l.done === 3 : l.follow);
    const cnt = (k) => L.filter((l) => k === "all" || (k === "today" ? l.today : k === "screen" ? l.done === 3 : l.follow)).length;
    const steps = ["Lead", "First contact", "Documents", "Screening", "Passed"];
    const ACT = { start: "startDeal", ceo: "ceoReview", wa: "leadReach", remind: "leadRemind", follow: "leadFollow", decline: "leadDecline" };
    const ltvCell = (l) => l.ltv == null ? '<span class="small muted">After documents</span>' : l.ltv > 70 ? `<span class="pill d-late">LTV ${l.ltv}%, does not pass</span>` : l.ltv > 65 ? `<span class="pill d-late">LTV ${l.ltv}%, CEO and CFO</span>` : `<span class="pill d-left">LTV ${l.ltv}%</span>`;
    const rows = L.filter(pass).map((l) => { const sent = l.coral && S.leadSent; return `<tr><td><div class="cname">${esc(l.client)} <span class="pill og ${l.og || "Client"}">${l.og || "Client"}</span></div><div class="small muted">${esc(l.src || "")}</div></td>
      <td><div style="font-weight:500">${l.amount ? money(l.amount) : ""}</div><div class="small muted">${esc(l.prop || "")}</div></td>
      <td><div class="lsteps">${steps.map((x, i) => `<span class="${i < l.done ? "done" : i === l.done ? "cur" : ""}"></span>`).join("")}</div><div class="small bodyc">${steps[Math.min(l.done, 4)]}</div></td>
      <td><div class="small">Documents ${l.docs || 0} of 5</div><div style="margin-top:4px">${ltvCell(l)}</div></td>
      <td style="font-weight:500">${esc(sent ? "With the CEO and the CFO, answer by 27 Nov" : l.line)}</td><td>${dlChip(sent ? ["left", "answer by 27 Nov"] : l.chip || ["left", ""])}</td>
      <td style="text-align:right;white-space:nowrap">${sent ? "" : `<button class="btn ${l.act === "start" ? "fill" : ""}" data-a="${ACT[l.act] || "leadReach"}" data-v="${esc(l.client)}">${esc(l.btn || "Open")}&nbsp;&nbsp;→</button>`}${l.act === "decline" ? "" : `<button class="link small" style="margin-left:12px;color:var(--muted)" data-a="leadClose" data-v="${esc(l.client)}">Close</button>`}</td></tr>`; }).join("");
    return nav("Leads") + `<div class="page"><div class="head"><h1>Leads</h1><span class="pill mx" style="margin-left:14px">Draft screen</span><div class="grow"></div></div>
      <div class="filters">${G.map(([k, t]) => `<button class="chip ${lf === k ? "on" : ""} ${k === "today" ? "warm" : ""}" data-a="leadFilter" data-v="${k}">${t}&nbsp;&nbsp;${cnt(k)}</button>`).join("")}</div>
      <p class="hint">Screening answers one question: can we work with this case. First reply within 48 hours: fits, does not fit, or what is missing. It is not a funding decision. LTV is decided here: up to 65% is the standard, 65 to 70% goes to the CEO and the CFO for a pre-review, above 70% does not pass. Screening passed means «Start the deal».</p>
      <div class="card tablecard"><table class="deals"><thead><tr><th style="width:19%">Client and origin</th><th style="width:14%">Asked</th><th style="width:13%">Step</th><th style="width:16%">Screening</th><th>Next action</th><th style="width:13%">Deadline</th><th style="width:150px"></th></tr></thead><tbody>${rows}</tbody></table>${!rows ? '<div class="empty">No leads in this view.</div>' : ""}</div>
      <p class="small muted" style="margin-top:14px">Closing happens here, before a deal exists: Declined when we say no (property, leasehold, LTV above 70%, country or sanctions, AML risk), Void when the client goes quiet or leaves. Not now or no reply stays here as a follow-up.</p></div>`;
  }

  // ---------- DOCUMENTS
  function docsPage() {
    const ds = inScale();
    const items = [];
    ds.forEach((d) => {
      if (d.uploads && d.actions.some((a) => a.panel === "check" && !a.done)) items.push({ d, g: "check", doc: d.uploads.length + " files uploaded as Title Deed", stage: "Property", chip: ["new", "New"], btn: "Check" });
      (d.missing || []).forEach((m) => items.push({ d, g: mainAct(d).whose === "csp" ? "csp" : "client", doc: m, stage: stageName(d.stage), chip: mainAct(d).chip, btn: "Remind" }));
      if (d.docs) Object.entries(d.docs).forEach(([k, v]) => v.csp.forEach((c) => items.push({ d, g: "csp", doc: c, stage: k, chip: ["left", "CSP review"], btn: "Open" })));
      if (d.synthetic && /files|address|statement/.test(mainAct(d).title)) items.push({ d, g: /Check/.test(mainAct(d).title) ? "check" : "client", doc: mainAct(d).title, stage: stageName(d.stage), chip: mainAct(d).chip, btn: /Check/.test(mainAct(d).title) ? "Check" : "Remind" });
    });
    const G = [["all", "All"], ["check", "Needs your check"], ["client", "Missing from the client"], ["csp", "With the CSP"]];
    const cnt = (k) => (k === "all" ? items.length : items.filter((i) => i.g === k).length);
    const list = items.filter((i) => S.docFilter === "all" || i.g === S.docFilter);
    return nav("Documents") + `<div class="page"><div class="head"><div><h1>Documents</h1></div><div class="grow"></div></div>
      <div class="filters">${G.map(([k, t]) => `<button class="chip ${S.docFilter === k ? "on" : ""}" data-a="docFilter" data-v="${k}">${t}&nbsp;&nbsp;${cnt(k)}</button>`).join("")}</div>
      <div class="card tablecard"><table class="deals"><thead><tr><th>Client</th><th>Document</th><th>Stage</th><th>Waiting on</th><th>Deadline</th><th></th></tr></thead><tbody>
      ${list.map((i) => `<tr data-a="open" data-id="${i.d.id}"><td><div class="cname">${esc(i.d.client)}</div><div class="small muted">${esc(i.d.property.label)}</div></td><td style="font-weight:500">${esc(i.doc)}</td><td class="small bodyc">${esc(i.stage)}</td>
        <td>${whosePill(i.g === "check" ? "you" : i.g === "csp" ? "csp" : "client")}</td><td>${dlChip(i.chip)}</td><td style="text-align:right">${i.btn === "Open" ? '<span class="aarr">→</span>' : `<button class="btn ${i.g === "check" ? "fill" : ""}" data-a="${i.btn === "Check" && i.d.uploads ? "docCheck" : i.btn === "Remind" ? "docRemind" : "open"}" data-id="${i.d.id}">${i.btn}&nbsp;&nbsp;→</button>`}</td></tr>`).join("")}
      </tbody></table></div></div>`;
  }

  // ---------- router + render
  function route() { const h = location.hash.replace(/^#\/?/, ""); const [p, id] = h.split("/"); return { p: p || "home", id }; }
  function render() {
    const r = route();
    let html;
    if (r.p !== "deal") S.lastRoom = null;
    if (r.p === "deal" && byId(r.id)) { if (S.lastRoom !== r.id) { if (!S.recent.includes(r.id)) S.recent = S.recent.concat([r.id]).slice(-3); S.lastRoom = r.id; } html = room(byId(r.id)); }
    else if (r.p === "documents") html = docsPage();
    else if (r.p === "home") html = home();
    else html = deals();
    if (S.dialog === "ceoLead") html += ceoDialog();
    if (S.dialog === "leadClose") html += leadCloseDialog();
    if (S.dialog === "boardHist") html += histDialog();
    const focus = document.activeElement && document.activeElement.id === "q";
    const pos = focus ? document.activeElement.selectionStart : 0;
    $app.innerHTML = html + demo() + toast();
    if (focus) { const q = document.getElementById("q"); q.focus(); q.setSelectionRange(pos, pos); }
  }
  window.addEventListener("hashchange", () => { Object.assign(S, { avOpen: null, pop: null, drawer: null, dialog: null, exportOpen: false, searchOpen: false, fileChoice: null, files: {}, docTab: null }); render(); window.scrollTo(0, 0); });

  function curDeal() { const r = route(); return r.p === "deal" ? byId(r.id) : null; }
  function download(name, text, type) { const b = new Blob([text], { type: type || "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name; a.click(); }
  function csv(rows) { return rows.map((r) => r.map((v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"').join(",")).join("\n"); }
  function dealRow(d) { const a = mainAct(d); return [d.client, d.type, originOf(d).type, originOf(d).who, maxStatus(d), asked(d), d.property.label, d.property.area, spvLabel(d) || "", stageText(d), WHOSE[a.whose][0], a.title, a.chip[1], d.terms.amount, d.terms.rate + "% a year", d.terms.months, d.property.ltv + "%", d.payments ? d.payments.paid + " of 12" : ""]; }
  const HEAD = ["client", "client_type", "origin", "origin_who", "max_status", "asked_usd", "property", "area", "spv", "stage", "whose_move", "next_action", "deadline", "approved_usd", "fee_a_year", "term_months", "ltv", "fees_paid"];

  document.addEventListener("change", (e) => {
    const el = e.target; if (!el.dataset || !el.dataset.up) return; const d = curDeal(); if (!d) return; const files = Array.from(el.files || []); if (!files.length) return;
    if (el.dataset.up === "photo") { d.photos = (d.photos || [["Building", ""], ["Living room", ""], ["View", ""]]).filter((p) => p[1]).concat(files.map((f) => [f.name, URL.createObjectURL(f)])); say(files.length + " photo(s) added to the property"); return; }
    const list = el.dataset.up === "prop" ? propDocs(d) : spvDocs(d); const i = +el.dataset.i;
    if (i >= 0) { list[i][1] = "new"; list[i][2] = files[0].name + ", just now"; } else list.push([files[0].name, "new", "Just now"]);
    say("Uploaded. It also appears in Documents."); render();
  });
  document.addEventListener("dragstart", (e) => { const c = e.target.closest && e.target.closest(".kcard"); if (c) { e.dataTransfer.setData("text/plain", c.dataset.note); c.classList.add("drag"); } });
  document.addEventListener("dragover", (e) => { const col = e.target.closest && e.target.closest(".kcol"); if (col) { e.preventDefault(); col.classList.add("over"); } });
  document.addEventListener("dragleave", (e) => { const col = e.target.closest && e.target.closest(".kcol"); if (col) col.classList.remove("over"); });
  document.addEventListener("drop", (e) => { const col = e.target.closest && e.target.closest(".kcol"); if (!col) return; e.preventDefault(); const nid = e.dataTransfer.getData("text/plain"); S.notes = S.notes.map((n) => n.id === nid ? Object.assign({}, n, { col: col.dataset.col }) : n); store.set("mw_board", S.notes); render(); });
  document.addEventListener("keydown", (e) => { if (e.target.id === "noteText" && e.key === "Enter") { const b = document.querySelector('[data-a="addNote"][data-v="doing"]'); if (b) b.click(); } });
  document.addEventListener("focusout", (e) => { const el = e.target.closest && e.target.closest("[data-stick]"); if (!el) return; const t = el.innerText.trim(); S.stickies = t ? S.stickies.map((n) => n.id === el.dataset.stick ? Object.assign({}, n, { t }) : n) : S.stickies.filter((n) => n.id !== el.dataset.stick); store.set("mw_stickies2", S.stickies); if (!t) render(); });
  document.addEventListener("input", (e) => { if (e.target.id === "q") { S.q = e.target.value; S.searchOpen = true; render(); } });
  document.addEventListener("keydown", (e) => {
    if (e.target.id === "q" && e.key === "Enter") { const first = document.querySelector(".results .res[data-id]"); if (first) location.hash = "#/deal/" + first.dataset.id; }
    if (e.key === "Escape") { Object.assign(S, { pop: null, drawer: null, dialog: null, exportOpen: false, searchOpen: false }); render(); }
  });
  document.addEventListener("focusin", (e) => { if (e.target.id === "q" && S.q) { S.searchOpen = true; render(); } });

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-a]");
    const inside = e.target.closest(".pop, .menu, .results, .search, .ent, .namemenu");
    if (!el) { if (!inside && (S.pop || S.exportOpen || S.searchOpen || S.sortOpen || S.filtOpen || S.nameOpen)) { S.pop = null; S.exportOpen = false; S.searchOpen = false; S.sortOpen = false; S.filtOpen = false; S.nameOpen = false; render(); } return; }
    const a = el.dataset.a, v = el.dataset.v, id = el.dataset.id;
    const d = curDeal();
    e.stopPropagation();
    switch (a) {
      case "offtab": say("Leads are not part of this prototype"); return;
      case "filter": S.filter = v; S.shown = 10; S.dash = null; break;
      case "more3": S[v] = !S[v]; break;
      case "nameOpen": S.nameOpen = !S.nameOpen; S.sortOpen = false; S.filtOpen = false; S.exportOpen = false; break;
      case "nameBy": S.nameBy = v; break;
      case "dtypeClear": S.f = Object.assign({}, S.f, { dtype: [] }); break;
      case "addNote": { const t = ((document.getElementById("noteText") || {}).value || "").trim(); if (!t) { say("Write the note first"); return; } const col = v === "doing" ? "doing" : "todo"; S.notes = [{ id: "n" + Date.now(), col, text: t, deal: (document.getElementById("noteDeal") || {}).value || "", own: true }].concat(S.notes); store.set("mw_board", S.notes); logToday("taken", "", t); say(col === "doing" ? "Added to Doing" : "Added to To do"); return; }
      case "delNote": S.notes = S.notes.filter((n) => n.id !== v); store.set("mw_board", S.notes); break;
      case "moveNote": { const [nid, col] = v.split("|"); S.notes = S.notes.map((n) => n.id === nid ? Object.assign({}, n, { col }) : n); store.set("mw_board", S.notes); if (col === "done") { const n0 = S.notes.find((n) => n.id === nid); logToday("done", n0 && n0.deal && byId(n0.deal) ? dealName(byId(n0.deal)) : "", n0 ? n0.text : ""); } break; }
      case "boardCsv": download("my_board.csv", csv([["column", "task", "deal"]].concat(S.notes.map((n) => [n.col, n.text, n.deal && byId(n.deal) ? dealName(byId(n.deal)) : ""])))); say("Downloaded. Opens in Excel."); return;
      case "unpin": S.pins = S.pins.filter((x) => x !== v); store.set("mw_pins", S.pins); break;
      case "pinDeal": { const d1 = curDeal(); if (d1) { S.pins = S.pins.includes(d1.id) ? S.pins.filter((x) => x !== d1.id) : S.pins.concat([d1.id]); store.set("mw_pins", S.pins); S.exportOpen = false; say(S.pins.includes(d1.id) ? "Pinned to Home" : "Removed from Home"); return; } break; }
      case "pinToggle": { S.pins = S.pins.includes(id) ? S.pins.filter((x) => x !== id) : S.pins.concat([id]); store.set("mw_pins", S.pins); if (S.pins.includes(id)) { S.pinHidden = false; store.set("mw_pinhide", false); } say(S.pins.includes(id) ? "Pinned to Home, and to the top of the list" : "Unpinned"); return; }
      case "pinHide": S.pinHidden = true; store.set("mw_pinhide", true); break;
      case "planTo": { const d3 = byId(id); if (!d3) return; const t = mainAct(d3).title; S.notes = [{ id: "n" + Date.now(), col: v, text: t, deal: id }].concat(S.notes); store.set("mw_board", S.notes); logToday("taken", dealName(d3), t); say(v === "doing" ? "Added to Doing" : "Added to To do"); return; }
      case "boardHist": S.dialog = "boardHist"; break;
      case "stickAdd": { const nid = "s" + Date.now(); S.stickies = [{ id: nid, c: "grey", t: "", at: nowStamp() }].concat(S.stickies); store.set("mw_stickies2", S.stickies); render(); const el = document.querySelector('[data-stick="' + nid + '"]'); if (el) el.focus(); return; }
      case "stickTask": { const n0 = S.stickies.find((n) => n.id === v); if (!n0 || !n0.t) { say("Write the note first"); return; } S.notes = [{ id: "n" + Date.now(), col: "todo", text: n0.t, deal: "", own: true }].concat(S.notes); store.set("mw_board", S.notes); S.stickies = S.stickies.filter((n) => n.id !== v); store.set("mw_stickies2", S.stickies); logToday("taken", "", n0.t); say("The note is now a task in To do"); break; }
      case "stickDel": S.stickies = S.stickies.filter((n) => n.id !== v); store.set("mw_stickies2", S.stickies); break;
      case "stickColor": { const [sid, c] = v.split("|"); S.stickies = S.stickies.map((n) => n.id === sid ? Object.assign({}, n, { c }) : n); store.set("mw_stickies2", S.stickies); break; }
      case "ownTask": { const f = document.getElementById("noteText"); if (f) { f.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => f.focus(), 300); } return; }
      case "planTick": S.plan = S.plan.includes(id) ? S.plan.filter((x) => x !== id) : S.plan.concat([id]); break;
      case "planAdd": { if (!S.plan.length) return; const add = S.plan.map(byId).filter(Boolean).map((d, i) => ({ id: "n" + Date.now() + i, col: "doing", text: mainAct(d).title, deal: d.id })); S.notes = add.concat(S.notes); store.set("mw_board", S.notes); const n = add.length; S.plan = []; render(); const b = document.querySelector(".board"); if (b) b.scrollIntoView({ behavior: "smooth", block: "start" }); say(n + (n === 1 ? " task" : " tasks") + " added to Doing"); return; }
      case "unrecent": S.recent = S.recent.filter((x) => x !== v); if (curDeal() && curDeal().id === v) S.lastRoom = v; break;
      case "exitsSoon": { const same = S.dash === "exit"; S.f = Object.assign({}, S.f, { phase: [] }); S.dash = same ? null : "exit"; S.filter = "all"; render(); const l = document.getElementById("list"); if (l && !same) l.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
      case "feesLate": case "feesDue": { const want = a === "feesLate" ? "late" : "left"; const same = S.dash === want && (S.f.phase || []).join() === "funded"; S.f = Object.assign({}, S.f, { phase: same ? [] : ["funded"] }); S.dash = same ? null : want; S.filter = "all"; render(); const l = document.getElementById("list"); if (l && !same) l.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
      case "phase": { const want = v.split(","); const cur = S.f.phase || []; const same = cur.length === want.length && want.every((x) => cur.includes(x)) && !S.dash; S.f = Object.assign({}, S.f, { phase: same ? [] : want }); } S.dash = null; render(); { const l = document.getElementById("list"); if (l) l.scrollIntoView({ behavior: "smooth", block: "start" }); } return;
      case "dash": S.dash = S.dash === v ? null : v; S.filter = "all"; render(); { const l = document.getElementById("list"); if (l && S.dash) l.scrollIntoView({ behavior: "smooth", block: "start" }); } return;
      case "variant": S.variant = v; break;
      case "addPerson": say("Prototype: pick a colleague to add to this deal"); return;
      case "newDealSame": say("A new deal starts in Leads: same client card, new property, new Screening."); return;
      case "leadFilter": S.leadFilter = v; break;
      case "leadReach": say("Opens WhatsApp with " + v + ". Log the result after the contact."); return;
      case "leadRemind": say("Reminder sent to " + v + " for the missing screening documents"); return;
      case "leadFollow": { const l = window.LEADS.find((x) => x.client === v); l.line = "Follow-up set for Mon 25 Nov"; l.chip = ["left", "Mon 25 Nov"]; l.btn = "Open"; l.act = "wa"; l.today = false; say("Follow-up set. The lead stays here."); break; }
      case "leadDecline": S.dialog = "leadClose"; S.closeLead = v; S.closeKind = "Declined"; S.closeReason = "Leasehold"; break;
      case "leadClose": S.dialog = "leadClose"; S.closeLead = v; S.closeKind = null; S.closeReason = null; break;
      case "doLeadClose": {
        if (!S.closeKind) { say("Choose Declined or Void"); return; }
        if (!S.closeReason) { say("Choose a reason first"); return; }
        const i = window.LEADS.findIndex((x) => x.client === S.closeLead); const msg = S.closeLead + " closed as " + S.closeKind + ": " + S.closeReason.toLowerCase() + ".";
        if (i >= 0) window.LEADS.splice(i, 1); S.dialog = null; say(msg); return;
      }
      case "more": S.shown += 10; break;
      case "crmOpen": S.crmOpen = !S.crmOpen; break;
      case "clearQ": S.q = ""; S.searchOpen = false; break;
      case "open": location.hash = "#/deal/" + id; return;
      case "closed": say("Closed deal: opens read-only from the archive."); return;
      case "exportOpen": S.exportOpen = !S.exportOpen; S.pop = null; break;
      case "export": {
        S.exportOpen = false;
        if (v === "csv-all") download("deals_all.csv", csv([HEAD].concat(inScale().map(dealRow))));
        else if (v === "csv-view") { const rows = Array.from(document.querySelectorAll("table.deals tbody tr")).map((tr) => byId(tr.dataset.id)).filter(Boolean); download("deals_view.csv", csv([HEAD].concat(rows.map(dealRow)))); }
        else if (v === "csv-deal" && d) download(d.client.replace(/ /g, "_") + ".csv", csv([HEAD, dealRow(d)]));
        else if (v === "csv-pay") download("payments.csv", csv([["client", "property", "paid", "fee_usd", "status"]].concat(inScale().filter((x) => x.stage === 8).map((x) => [x.client, x.property.label, (x.payments || {}).paid + " of 12", (x.payments || {}).fee, mainAct(x).chip[1]]))));
        else if (v === "print") { render(); setTimeout(() => window.print(), 50); return; }
        else if (v === "copy" && d) { const t = `${d.client}, ${d.property.label}. Stage ${stageText(d)}. Next: ${mainAct(d).title} (${mainAct(d).chip[1]}).`; navigator.clipboard && navigator.clipboard.writeText(t); say("Summary copied"); return; }
        else { say("Prototype: the file would download here"); return; }
        say("Downloaded. Opens in Excel."); return;
      }
      case "ceoReview": S.dialog = "ceoLead"; break;
      case "sendCeo": S.dialog = null; S.leadSent = true; say("Sent to the CEO and the CFO. Answer expected by 27 Nov."); return;
      case "startDeal": {
        const li = window.LEADS.findIndex((l) => l.client === v); const l = window.LEADS[li];
        DEALS.unshift({ id: "m", client: l.client, fresh: true, type: "Individual", source: l.src.split(",")[0], origin: l.og === "Broker" ? { type: "Broker", who: "Dune Property", pct: 1.5 } : null, step01: 0,
          property: { label: l.prop, kind: l.prop, area: l.prop.split(", ")[1], building: "", market: 1900000, valuation: 1850000, valDate: "20 Nov 2024", valUntil: "20 Nov 2025", ltv: 62, mortgage: "None", deed: "Received" },
          spv: { name: "SPV not yet", status: "Not started", csp: "Harbour CS" },
          terms: { amount: 1150000, asked: 1150000, rate: 14, months: 12, neededBy: "28 Feb 2025", purpose: "Bridge until another property is sold", fee: "Monthly" },
          stage: 1, day: 0, actions: [{ id: "m1", whose: "you", stage: "01 Client Alignment", title: "Order the valuation", sub: "Screening documents from Leads are already in the deal", chip: ["left", "5 days left"], btn: "Send", panel: "form" }],
          missing: [], activity: [["You", "Started the deal from Leads, Screening passed", "22 Nov"], ["Client", "Sent the documents", "21 Nov, WhatsApp"]] });
        window.LEADS.splice(li, 1);
        say(l.client + " moved to Deals: 01 Client Alignment, valuation first"); return;
      }
      case "callLead": say("Calling Client G from your phone. Log the result after the call."); return;
      case "pop": S.pop = S.pop === v ? null : v; S.exportOpen = false; S.editSpv = false; break;
      case "editSpv": S.editSpv = !S.editSpv; if (!S.editSpv) { say("Company data saved"); return; } break;
      case "askCsp": say("Request sent to " + (d.spv.csp || "the CSP") + " for the missing company documents"); return;
      case "revalue": say("Valuation request sent to the valuer. You get the report in Documents."); return;
      case "termsReview": S.pop = null; S.dialog = "terms"; S.reviewWhat = S.reviewWhat || "Fee"; break;
      case "reviewWhat": S.reviewWhat = v; break;
      case "sendReview": { const to = (document.getElementById("rvTo") || {}).value || ""; d.termsReview = { what: S.reviewWhat, to, when: "22 Nov", by: "26 Nov" }; d.actions.push({ id: d.id + "rv", whose: "ceo", stage: "Terms", title: "Terms review: " + S.reviewWhat.toLowerCase(), sub: "Client asks for " + to, chip: ["left", "decision by 26 Nov"], btn: "View request", panel: "ceo" }); d.activity = [["You", "Asked the CEO to review the " + S.reviewWhat.toLowerCase(), "22 Nov, client asks for " + to]].concat(d.activity || []); S.dialog = null; say("Sent to the CEO. The answer comes to Next actions."); return; }
      case "crm": S.drawer = { kind: "client" }; break;
      case "handover": S.dialog = "handover"; break;
      case "closeDeal": S.dialog = "close"; S.closeKind = null; S.closeReason = null; break;
      case "closeKind": S.closeKind = v; S.closeReason = null; break;
      case "closeReason": S.closeReason = v; break;
      case "doClose": {
        const why = ((document.getElementById("closeWhy") || {}).value || "").trim();
        if (!why) { say("Write what happened first"); return; }
        d.closed = { why };
        window.CLOSED.push({ client: d.client, property: d.property.label, area: d.property.area, spv: spvLabel(d) || "No SPV", stage: "Fell through at " + stageText(d) });
        const msg = d.client + " closed. Your note is in the archive, find it in search.";
        S.dialog = null; location.hash = "#/deals"; setTimeout(() => say(msg), 60); return;
      }
      case "doHandover": { const m = (document.querySelector('input[name="mgr"]:checked') || {}).value || "Omar H."; if (d) { d.team = d.team || []; d.team.unshift([m.split(" ").map((x) => x[0]).join(""), m + ", manager", "Took over today"]); d.activity = [["You", "Handed over to " + m, "22 Nov"]].concat(d.activity || []); } S.dialog = null; say("Handed over to " + m + ". The client gets a short message."); return; }
      case "panel": {
        const act = d.actions.find((x) => x.id === id);
        if (v === "remind" && act && act.id === "a1" && S.request) { S.drawer = { kind: "request", id }; break; }
        S.drawer = { kind: v, id }; S.channel = "WhatsApp"; break;
      }
      case "channel": S.channel = v; break;
      case "sendRemind": { const act = d.actions.find((x) => x.id === S.drawer.id); boardDone(d.id, act.title); act.sub = "Reminder sent today by " + S.channel; d.activity = [["You", "Sent a reminder", "22 Nov, " + S.channel]].concat(d.activity || []); S.drawer = null; say("Reminder sent by " + S.channel + ". Next automatic reminder in 3 days."); return; }
      case "fileOk": S.files[+v] = S.files[+v] === "ok" ? null : "ok"; break;
      case "acceptAll": (d.uploads || []).forEach((f, i) => { if (!f.suspect) S.files[i] = "ok"; }); break;
      case "fileChoice": S.fileChoice = v; break;
      case "saveCheck": { boardDone(d.id, (d.actions.find((x) => x.panel === "check") || {}).title);
        const act = d.actions.find((x) => x.panel === "check");
        const clean = (d.uploads || []).filter((f) => !f.suspect).length;
        const ok = Object.values(S.files).filter((x) => x === "ok").length;
        if (ok < clean) { say("Accept the " + clean + " clean files first"); return; }
        if (!S.fileChoice) { say("Choose what to do with scan_0412.pdf"); return; }
        act.done = true; act.doneWhen = "22 Nov"; act.title = "Checked " + d.uploads.length + " files";
        act.sub = S.fileChoice === "ask" ? clean + " accepted, 1 asked again" : "All " + d.uploads.length + " accepted";
        d.activity = [["You", "Checked " + d.uploads.length + " files", "22 Nov, " + act.sub]].concat(d.activity || []);
        if (S.fileChoice === "ask") {
          d.missing = d.missing.concat(["Title Deed"]);
          S.request = [["Employment letter", "03 KYC, asked 14 Nov", "Employment letter, signed, not older than 30 days."], ["Signed CSP forms", "03 KYC, asked 14 Nov", "Signed CSP forms, pages 3 and 5."], ["Title Deed, the right file", "Property, new: the upload was an SPA", "Title Deed. The file you sent on 18 Nov is the Sales Purchase Agreement, so we still need the deed itself."]];
          S.drawer = { kind: "request", id: "a1" };
        } else { S.drawer = null; say("Files accepted. Task closed."); }
        S.fileChoice = null; S.files = {}; break;
      }
      case "sendRequest": { boardDone(d.id, (d.actions.find((x) => x.id === "a1") || {}).title);
        const a1 = d.actions.find((x) => x.id === "a1");
        if (a1) { a1.title = "Send " + S.request.length + " items"; a1.sub = "All " + S.request.length + " in one request"; }
        d.activity = [["You", "Asked for " + S.request.length + " items", "22 Nov, one " + S.channel + " message"]].concat(d.activity || []);
        if (d.forecast) d.forecast.holds = "Client's " + S.request.length + " items, 10 days late";
        S.drawer = null; S.request = null; say("Request sent to " + d.client + " by " + S.channel + ". Reminders go out on day 1, 4 and 7."); return;
      }
      case "sendForm": { const act = d.actions.find((x) => x.id === S.drawer.id); boardDone(d.id, act.title); act.done = true; act.doneWhen = "22 Nov"; act.sub = "Sent today"; d.activity = [["You", act.title, "22 Nov"]].concat(d.activity || []); S.drawer = null; say("Sent. The task moves to the other side."); return; }
      case "history": S.drawer = { kind: "history" }; break;
      case "personLog": S.drawer = { kind: "person", i: +v }; S.avOpen = null; break;
      case "avOpen": S.avOpen = S.avOpen === +v ? null : +v; break;
      case "sendFund": { const act = d.actions.find((x) => x.id === S.drawer.id); boardDone(d.id, act.title); act.whose = "ceo"; act.title = "Funding: the CEO allocates capital"; act.sub = "Handed over today. Capital goes to the SPV account"; act.chip = ["left", "expected in 3 days"]; act.btn = "View"; act.panel = "ceo"; d.activity = [["You", "Handed over to funding", "22 Nov"]].concat(d.activity || []); if (d.forecast) d.forecast.holds = "Funding: the CEO allocates capital"; S.drawer = null; say("Handed over. The CEO allocates the capital in his console."); return; }
      case "histFilter": S.histFilter = v; break;
      case "sendMsg": { const ta = document.querySelector(".drawer textarea"); const t = ta && ta.value.trim(); if (!t) { say("Write something first"); return; } d.history = [["22 Nov", v === "team" ? "Team note" : S.channel, "You", t]].concat(d.history || []); break; }
      case "reach": say(v === "Call" ? "Calling from your phone. Log the result after the call." : v === "Email" ? "Opens a new email to the client" : "Opens WhatsApp with the client"); if (v === "Call") setTimeout(() => { S.dialog = "log"; S.logType = "Call"; render(); }, 1200); return;
      case "log": S.dialog = "log"; break;
      case "logType": S.logType = v; break;
      case "logResult": S.logResult = v; break;
      case "saveLog": { const t = (document.getElementById("logtext") || {}).value || ""; d.contact = Object.assign({}, d.contact || {}, { last: S.logType + ", today, 10 min", quote: t, next: "Follow-up", nextWhen: "Mon 25 Nov, 11:00", today: false }); d.activity = [["You", S.logType + ": " + S.logResult.toLowerCase(), "22 Nov, saved to the client card"]].concat(d.activity || []); d.history = [["22 Nov", S.logType, "You", t]].concat(d.history || []); S.dialog = null; say("Saved to the client card"); return; }
      case "doctab": S.docTab = v; break;
      case "upload": say("Prototype: choose a file and its type"); return;
      case "payFilter": S.payFilter = v; break;
      case "payRemind": { const x = byId(id); boardDone(id, mainAct(x).title); x.actions[0].sub = "Reminder sent today"; say("Reminder sent to " + x.client + " by WhatsApp"); return; }
      case "docFilter": S.docFilter = v; break;
      case "goDash": S.dash = v; S.filter = "all"; location.hash = "#/deals"; setTimeout(() => { const l = document.getElementById("list"); if (l) l.scrollIntoView({ block: "start" }); }, 60); return;
      case "goDocs": S.docFilter = v; location.hash = "#/documents"; return;
      case "docCheck": location.hash = "#/deal/" + id; setTimeout(() => { S.drawer = { kind: "check", id: "a2" }; render(); }, 30); return;
      case "docRemind": { const x = byId(id); location.hash = "#/deal/" + id; setTimeout(() => { S.drawer = { kind: x.actions[0].panel === "remind" ? "remind" : "form", id: x.actions[0].id }; render(); }, 30); return; }
      case "closeAll": S.avOpen = null; S.drawer = null; S.dialog = null; S.fileChoice = null; S.pop = null; S.exportOpen = false; S.searchOpen = false; S.sortOpen = false; S.filtOpen = false; break;
      case "sortOpen": S.sortOpen = !S.sortOpen; S.filtOpen = false; S.exportOpen = false; break;
      case "sort": S.sort = v; S.sortOpen = false; break;
      case "filtOpen": S.filtOpen = !S.filtOpen; S.sortOpen = false; S.exportOpen = false; break;
      case "fopt": { const [k, val] = v.split("|"); const arr = S.f[k] || []; S.f[k] = arr.includes(val) ? arr.filter((x) => x !== val) : arr.concat([val]); break; }
      case "fclear": S.f = {}; break;
      case "fdone": S.filtOpen = false; break;
    }
    render();
  });
  // QA hook for automated screenshots: ?qa=@action=value,@action,q:text
  const qa = new URLSearchParams(location.search).get("qa");
  if (qa) {
    const steps = qa.split(","); let i = 0;
    const next = () => {
      if (i >= steps.length) return; const st = steps[i++];
      if (st.startsWith("q:")) { S.q = st.slice(2); S.searchOpen = true; render(); }
      else { const [k, v] = st.slice(1).split("="); const el = document.querySelector(`[data-a="${k}"]` + (v ? `[data-v="${v}"]` : "")); if (el) el.click(); }
      setTimeout(next, 200);
    };
    setTimeout(next, 300);
  }
  render();
})();
