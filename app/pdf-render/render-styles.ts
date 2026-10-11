// app/pdf-render/render-styles.ts — CSS partagé entre Attestation + KYC (extrait du HTML maquette)

export const PDF_RENDER_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500;700&display=block');

:root{
  --ink:#17123A;
  --ink-2:#241E4E;
  --muted:#6F6A8A;
  --line:#E9E6F3;
  --line-2:#DDD9EC;
  --bg:#FFFFFF;
  --bg-soft:#F8F7FC;
  --violet:#5B46E0;
  --violet-2:#9A45D0;
  --pink:#EC4899;
  --pink-2:#C13FB0;
  --green:#1E9E6A;
  --green-soft:#EDF8F3;
  --red:#C5302C;
  --red-soft:#FCF1F0;
  --amber:#E3A008;
  --amber-soft:#FDF7E6;
  --grad: linear-gradient(135deg,#6D5EF6 0%, #A548D8 35%, #EC4899 100%);
  --grad-soft: linear-gradient(135deg, rgba(109,94,246,.08) 0%, rgba(236,72,153,.08) 100%);
}

*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff;font-family:'Inter',system-ui,sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased}

/* A4 page — chaque article occupe pile une feuille A4 */
.page{
  width: 210mm;
  height: 297mm;
  margin: 0 auto;
  background:#fff;
  position:relative;
  overflow:hidden;
  padding: 18mm 16mm 22mm;     /* bottom padding plus large : laisse la place au footer absolu */
  page-break-after: always;
  break-after: page;
}
.page:last-of-type{page-break-after:auto; break-after:auto}

/* Empêche les éléments d'être coupés entre 2 pages */
.crit, .tx-card, .doc, .validation, .decl, .field, .verdict, .reco { page-break-inside: avoid; break-inside: avoid; }
.page::before{
  content:""; position:absolute; top:0; left:0; right:0; height:6px;
  background: var(--grad);
}
.page::after{
  content:""; position:absolute; right:-120px; top:-120px; width:340px; height:340px; border-radius:50%;
  background: radial-gradient(closest-side, rgba(165,72,216,.12), rgba(236,72,153,.05) 60%, transparent 70%);
  pointer-events:none;
}

/* HEADER */
header.doc-head{
  display:flex; align-items:flex-start; justify-content:space-between;
  padding-bottom: 18px; border-bottom: 1px solid var(--line);
}
.brand{display:flex; align-items:center; gap:12px}
.brand .logo{
  display:inline-flex; align-items:center; justify-content:center;
  filter: drop-shadow(0 6px 14px rgba(109,94,246,.25));
}
.brand .logo svg{display:block}
.brand .name{font-weight:800; font-size:22px; letter-spacing:-.02em}
.brand .tag{
  margin-left: 4px; padding: 4px 10px; border-radius:999px;
  background: var(--grad-soft); border:1px solid #DDD9FF;
  font: 600 9.5px/1 'Inter'; letter-spacing:.16em; text-transform:uppercase; color: var(--violet);
  align-self:center;
}
.meta{display:flex; gap:36px; text-align:right}
.meta .col{display:flex; flex-direction:column; gap:2px}
.meta .label{font:600 9.5px/1.4 'Inter'; letter-spacing:.18em; text-transform:uppercase; color:var(--muted)}
.meta .val{font:700 13px/1.3 'JetBrains Mono'; color:var(--ink)}
.meta .val.regular{font-family:'Inter'; font-weight:600}

/* TITLE BLOCK */
.title-row{display:flex; align-items:flex-end; justify-content:space-between; margin-top:22px; gap:24px}
h1.doc-title{
  font:800 34px/1.05 'Inter'; letter-spacing:-.025em; margin:0 0 8px;
  background: linear-gradient(90deg, #241E4E 0%, #3A2CA0 60%, #6D5EF6 100%);
  -webkit-background-clip:text; background-clip:text; color:transparent;
}
.doc-sub{color:var(--muted); font-size:13.5px; max-width: 560px}

.stamp{
  flex:0 0 auto; align-self:flex-start;
  display:inline-flex; align-items:center; gap:8px;
  padding:8px 12px; border-radius:999px;
  border:1px dashed #C7C0FF; color:var(--violet-2);
  font:600 10.5px/1 'Inter'; letter-spacing:.16em; text-transform:uppercase;
  background: #F6F3FF;
}
.stamp .pulse{
  width:8px; height:8px; border-radius:50%; background:var(--violet);
  box-shadow:0 0 0 4px rgba(109,94,246,.18);
}

/* VERDICT CARDS */
.verdict{
  margin-top: 22px;
  border-radius: 18px;
  padding: 22px 24px 20px;
  position:relative;
  overflow:hidden;
  border:1px solid transparent;
  background:
    linear-gradient(#fff,#fff) padding-box,
    var(--grad) border-box;
}
.verdict.critical{
  background:
    linear-gradient(180deg,#FCF1F0 0%, #FCF1F0 100%) padding-box,
    linear-gradient(135deg,#C5302C 0%, #EC4899 60%, #E57A2E 100%) border-box;
}
.verdict.ok{
  background:
    linear-gradient(180deg,#EDF8F3 0%, #EDF8F3 100%) padding-box,
    linear-gradient(135deg,#177A52 0%, #1E9E6A 60%, #3DBE8B 100%) border-box;
}
.verdict.warn{
  background:
    linear-gradient(180deg,#FDF7E6 0%, #FAEFC8 100%) padding-box,
    linear-gradient(135deg,#B87A00 0%, #E3A008 60%, #EDB52E 100%) border-box;
}
.verdict .vlabel{
  display:flex; align-items:center; gap:10px;
  font:700 10.5px/1 'Inter'; letter-spacing:.2em; text-transform:uppercase; color:var(--red);
}
.verdict.ok .vlabel{color:#177A52}
.verdict.warn .vlabel{color:#7A4C00}
.verdict .vlabel .ic{width:14px;height:14px;border-radius:50%;background:currentColor;opacity:.85;display:inline-block;position:relative}
.verdict .vlabel .ic::after{content:"";position:absolute;inset:3px;border-radius:50%;background:#fff}

.verdict h2{
  margin: 8px 0 4px; font:800 30px/1.08 'Inter'; letter-spacing:-.02em;
  color: var(--red);
}
.verdict.ok h2{color:#177A52}
.verdict.warn h2{color:#7A4C00}
.verdict p.lead{margin:0 0 16px; color:var(--ink-2); font-size:13.5px; max-width: 70%}

.progress-row{display:flex; align-items:center; gap:14px}
.progress{
  flex:1; height:8px; border-radius:999px; background: rgba(197,48,44,.12);
  overflow:hidden; position:relative;
}
.verdict.ok .progress{background:rgba(30,158,106,.15)}
.verdict.warn .progress{background:rgba(227,160,8,.15)}
.progress > span{
  display:block; height:100%; border-radius:999px;
  background: linear-gradient(90deg,#C5302C,#EC4899);
  box-shadow: 0 0 16px rgba(236,72,153,.45);
}
.verdict.ok .progress > span{
  background: linear-gradient(90deg,#177A52,#1E9E6A);
  box-shadow: 0 0 16px rgba(30,158,106,.4);
}
.verdict.warn .progress > span{
  background: linear-gradient(90deg,#B87A00,#E3A008);
  box-shadow: 0 0 16px rgba(227,160,8,.4);
}
.pct{font:800 22px/1 'Inter'; letter-spacing:-.02em; color:var(--red); min-width:64px; text-align:right}
.verdict.ok .pct{color:#177A52}
.verdict.warn .pct{color:#7A4C00}

.verdict .glow{
  position:absolute; right:-60px; top:-60px; width:200px; height:200px; border-radius:50%;
  background: radial-gradient(closest-side, rgba(236,72,153,.25), transparent 70%);
  pointer-events:none;
}
.verdict.ok .glow{background:radial-gradient(closest-side, rgba(30,158,106,.22), transparent 70%)}
.verdict.warn .glow{background:radial-gradient(closest-side, rgba(227,160,8,.22), transparent 70%)}

/* SECTION HEADER */
.section{margin-top:20px}
.section-head{
  display:flex; align-items:center; gap:10px; padding-bottom:10px; border-bottom:1px solid var(--line);
}
.section-head .num{
  font:700 10.5px/1 'JetBrains Mono'; color:#fff;
  background: var(--grad);
  padding:5px 8px; border-radius:6px; letter-spacing:.06em;
}
.section-head .ttl{
  font:700 11px/1 'Inter'; letter-spacing:.2em; text-transform:uppercase;
  background: var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent;
}
.section-head .accent{flex:1; height:1px; background: linear-gradient(90deg, var(--line) 0%, transparent 100%)}

/* DATA GRID */
.grid{display:grid; grid-template-columns: 1fr 1fr; gap: 18px 28px; margin-top: 16px}
.field{display:flex; flex-direction:column; gap:4px}
.field .k{font:600 9.5px/1 'Inter'; letter-spacing:.18em; text-transform:uppercase; color:var(--muted)}
.field .v{font:600 14px/1.4 'Inter'; color:var(--ink)}
.field .v.mono{font-family:'JetBrains Mono'; font-weight:500}

/* CRITERIA LIST */
.criteria{margin-top:10px; display:flex; flex-direction:column}
.crit{
  display:flex; align-items:center; justify-content:space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}
.crit:last-child{border-bottom:0}
.crit .lbl{display:flex; align-items:center; gap:14px}
.crit .ix{
  width:28px; height:28px; border-radius:8px;
  background: var(--bg-soft); border:1px solid var(--line-2);
  display:grid; place-items:center;
  font:700 11px/1 'JetBrains Mono'; color:var(--violet);
}
.crit .name{font:600 14px/1.3 'Inter'}
.crit .meta-line{font:500 11px/1.3 'Inter'; color:var(--muted); margin-top:2px; letter-spacing:.01em}

.badge{
  display:inline-flex; align-items:center; gap:6px;
  padding: 6px 12px; border-radius: 999px;
  font:700 10px/1 'Inter'; letter-spacing:.16em; text-transform:uppercase;
  border:1px solid transparent;
}
.badge.ok{color:#177A52; background:var(--green-soft); border-color:#B5E6D2}
.badge.ok .d{width:6px;height:6px;border-radius:50%;background:#1E9E6A;box-shadow:0 0 0 3px rgba(30,158,106,.18)}
.badge.crit{color:#8A1E1A; background:var(--red-soft); border-color:#F3C9C6}
.badge.crit .d{width:6px;height:6px;border-radius:50%;background:#C5302C;box-shadow:0 0 0 3px rgba(197,48,44,.18)}
.badge.warn{color:#7A4C00; background:var(--amber-soft); border-color:#F4DFA0}
.badge.warn .d{width:6px;height:6px;border-radius:50%;background:#E3A008;box-shadow:0 0 0 3px rgba(227,160,8,.18)}
.badge.violet{color:var(--violet); background:#F4F2FD; border-color:#DDD9FF}
.badge.violet .d{width:6px;height:6px;border-radius:50%;background:var(--violet);box-shadow:0 0 0 3px rgba(109,94,246,.18)}

/* TRANSACTION CARDS */
.tx-grid{display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:14px}
.tx-card{
  border:1px solid var(--line); border-radius:14px; padding:11px 14px;
  background: linear-gradient(180deg,#fff 0%, #F8F7FC 100%);
  position:relative; overflow:hidden;
}
.tx-card::before{
  content:""; position:absolute; left:0; top:0; bottom:0; width:3px; background: var(--grad);
}
.tx-card .k{font:600 9.5px/1 'Inter'; letter-spacing:.18em; text-transform:uppercase; color:var(--muted)}
.tx-card .v{font:700 15px/1.3 'Inter'; margin-top:6px; color:var(--ink)}
.tx-card .v .dim{color:var(--muted); font-weight:500}

/* RECO BOX */
.reco{
  margin-top:12px; padding:14px 18px; border-radius:14px;
  background:var(--grad-soft); border:1px solid #DDD9FF;
}
.reco .label{font:700 11px/1 'Inter'; letter-spacing:.2em; text-transform:uppercase; color:var(--violet)}
.reco p{margin:8px 0 0; font-size:13.5px; color:var(--ink-2); line-height:1.55}

/* VALIDATION */
.validations{display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:14px}
.validation{
  border:1px solid var(--line); border-radius:14px;
  padding: 12px 16px;
  background: linear-gradient(180deg,#fff,#F8F7FC);
}
.validation .k{font:600 9.5px/1 'Inter'; letter-spacing:.18em; text-transform:uppercase; color:var(--muted); margin-bottom:8px}
.validation .person{display:flex; align-items:center; gap:12px}
.validation .av{
  width:34px; height:34px; border-radius:50%;
  background: var(--grad); color:#fff; display:grid; place-items:center;
  font:700 12px/1 'Inter'; letter-spacing:.04em;
  box-shadow: 0 6px 16px rgba(109,94,246,.3);
}
.validation .name{font:700 15px/1.2 'Inter'}
.validation .role{font:500 11px/1.2 'Inter'; color:var(--muted); margin-top:2px}
.validation .sig{
  margin-top:10px; padding-top:10px; border-top: 1px dashed var(--line-2);
  font:500 10px/1.4 'JetBrains Mono'; color:var(--muted);
  display:flex; justify-content:space-between;
}

/* DOCS LIST (KYC) */
.docs-grid{display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:14px}
.doc{
  border:1px solid var(--line); border-radius:14px; padding:14px 16px;
  display:flex; align-items:center; justify-content:space-between; gap:14px;
  background:#fff;
}
.doc .left{display:flex; align-items:center; gap:12px}
.doc .icn{
  width:36px; height:36px; border-radius:10px;
  background: var(--grad-soft); color:var(--violet); display:grid; place-items:center;
  border: 1px solid #DDD9FF;
}
.doc .icn svg{width:18px; height:18px}
.doc .k{font:600 9.5px/1 'Inter'; letter-spacing:.18em; text-transform:uppercase; color:var(--muted)}
.doc .v{font:700 13.5px/1.2 'Inter'; margin-top:4px}

/* DECLARATION */
.decl{
  margin-top:14px; padding:16px 18px; border-radius:14px;
  background:#F8F7FC; border:1px solid var(--line);
}
.decl p{margin:0; font-size:12.5px; color:var(--ink-2); line-height:1.6}
.decl .sig{
  display:flex; justify-content:space-between; align-items:flex-end;
  margin-top:14px; padding-top:14px; border-top:1px dashed var(--line-2);
}
.decl .sig .k{font:600 9.5px/1 'Inter'; letter-spacing:.18em; text-transform:uppercase; color:var(--muted)}
.decl .sig .name{font:600 13px/1.3 'Inter'; margin-top:4px}
.decl .sig .hash{font:600 11px/1.3 'JetBrains Mono'; color:var(--violet)}

/* FOOTER */
footer.doc-foot{
  position:absolute; left:16mm; right:16mm; bottom:8mm;
  display:flex; align-items:center; justify-content:space-between;
  padding-top: 10px; border-top: 1px solid var(--line);
  font:500 10px/1.4 'Inter'; letter-spacing:.04em; color:var(--muted);
}
.conf-tag{
  display:inline-flex; align-items:center; gap:8px;
  padding:6px 12px; border-radius:999px; background:#F4F2FD; border:1px solid #DDD9FF;
  color:var(--violet); font:700 9.5px/1 'Inter'; letter-spacing:.18em; text-transform:uppercase;
}
.conf-tag .d{width:6px;height:6px;border-radius:50%;background:var(--violet)}
.gen-tag{display:inline-flex; align-items:center; gap:6px}
.gen-tag .lk{
  background: var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; font-weight:700; letter-spacing:.04em;
}

/* helpers */
.stat-row{display:flex; align-items:center; gap:10px; margin-top:14px; flex-wrap:wrap}
.stat{
  display:flex; align-items:center; gap:8px;
  padding:6px 10px; border-radius:8px; background:var(--bg-soft); border:1px solid var(--line);
  font:600 11px/1 'Inter'; color:var(--ink-2);
}
.stat b{font:700 11px/1 'JetBrains Mono'; color:var(--violet)}

/* Compteurs de signaux (remplace l'ancien score arbitraire) */
.signal-row{
  display:flex; align-items:center; gap:10px; margin-top: 16px; flex-wrap: wrap;
}
.signal{
  display:inline-flex; align-items:center; gap:8px;
  padding: 8px 14px; border-radius: 999px;
  font:600 12px/1 'Inter';
  border:1px solid transparent;
}
.signal b{font:700 13.5px/1 'JetBrains Mono'}
.signal .d{
  width:8px; height:8px; border-radius:50%;
}
.signal.ok{
  background: var(--green-soft); color: #177A52; border-color: #B5E6D2;
}
.signal.ok .d{background:#1E9E6A; box-shadow: 0 0 0 3px rgba(30,158,106,.20)}
.signal.warn{
  background: var(--amber-soft); color: #7A4C00; border-color: #F4DFA0;
}
.signal.warn .d{background:#E3A008; box-shadow: 0 0 0 3px rgba(227,160,8,.20)}
.signal.crit{
  background: var(--red-soft); color: #8A1E1A; border-color: #F3C9C6;
}
.signal.crit .d{background:#C5302C; box-shadow: 0 0 0 3px rgba(197,48,44,.20)}

@page{ size: A4; margin: 0; }
`;
