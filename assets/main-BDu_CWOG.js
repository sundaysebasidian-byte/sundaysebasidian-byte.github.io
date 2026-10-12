const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/card-pack-ui-C0LXisfD.js","assets/index-CQNLvtUa.js"])))=>i.map(i=>d[i]);
import{M as Qn,p as et,a as H,f as X,A as xn,b as $o,r as Lo,c as Ro,d as qn,e as Yn,g as jn,h as Tt,J as be,s as Re,l as Ot,i as eo,j as mt,k as Do,m as cn,n as Mo,o as Po,q as Bo,t as _t,u as Uo,v as Fo,w as _o,F as Cn,x as He,y as qo,z as Yo,B as Yt,C as to,D as jo,_ as Jo}from"./index-CQNLvtUa.js";const gt="pocket-field-trip-notebook",kt=1024*1024;function Wo(t){return!!t&&typeof t=="object"&&!Array.isArray(t)}function bt(t,e){if(!Wo(t)||Object.keys(t).some(n=>!e.includes(n)))throw Error("Backup contains unsupported fields. Nothing was changed.")}function Ko(t){bt(t,["done","skipped"]);const e=t,n=new Set(H.map(r=>r.id));for(const r of["done","skipped"]){const p=e[r];if(!Array.isArray(p)||p.length>(r==="done"?3:H.length)||new Set(p).size!==p.length||p.some(d=>typeof d!="string"||!n.has(d)))throw Error("Backup preferences are unsupported. Nothing was changed.")}const a=e.done,s=e.skipped;if(new Set(a.map(X)).size!==a.length||s.some(r=>a.some(p=>X(p)===X(r))))throw Error("Backup preferences conflict within a content family. Nothing was changed.")}function Wt(t){if(new TextEncoder().encode(t).byteLength>kt)throw Error("Choose a JSON backup no larger than 1 MiB. Nothing was changed.");let e;try{const a=JSON.parse(t);bt(a,["format","version","exportedAt","journal"]),e=a}catch{throw Error("This file is not a supported JSON backup. Nothing was changed.")}if(e.format!==gt||![1,2].includes(e.version)||typeof e.exportedAt!="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(e.exportedAt)||!Number.isFinite(Date.parse(e.exportedAt))||new Date(e.exportedAt).toISOString()!==e.exportedAt)throw Error("Backup format or version is unsupported. Nothing was changed.");bt(e.journal,["schema","entries","feedback"]);const n=e.journal;if(n.schema!==e.version||!Array.isArray(n.entries)||n.entries.length>Qn)throw Error("Backup notebook version or size is unsupported. Nothing was changed.");Ko(n.feedback);for(const a of n.entries)bt(a,["id","createdAt","updatedAt","task","text","tags",...e.version===2?["scene"]:[]]),bt(a.task,["id","title","family","lens","version","steps","cues","prompt","minutes","settings","still","requires"]);try{const a=et(JSON.stringify(n));return{format:gt,version:e.version,exportedAt:e.exportedAt,journal:a}}catch{throw Error("Backup discoveries are invalid or exceed their limits. Nothing was changed.")}}function Sn(t,e){const n={format:gt,version:t.schema,exportedAt:e,journal:t},a=JSON.stringify(n,null,2)+`
`,s=new TextEncoder().encode(a).byteLength<=kt?a:JSON.stringify(n);return Wt(s),s}function Jn(t,e,n,a=!1){if(n!=="merge"&&n!=="replace")throw Error("Choose merge or replace.");const s=Wt(JSON.stringify(e)).journal,r=et(JSON.stringify(t)),p=new Map(r.entries.map(b=>[b.id,b])),d=s.entries.filter(b=>!p.has(b.id)),l=s.entries.filter(b=>p.has(b.id)&&JSON.stringify(p.get(b.id))!==JSON.stringify(b)).length,u=s.entries.length-d.length-l,f=n==="merge"?[...r.entries,...d]:s.entries;if(f.length>Qn)throw Error("Combined notebook would exceed 100 discoveries. Nothing was changed; export or remove entries before merging.");const m={schema:r.schema===2||s.schema===2?2:1,entries:f,feedback:a?s.feedback:r.feedback};try{Sn(m,e.exportedAt)}catch{throw Error("Restored notebook would exceed the 1 MiB backup limit or could not form a supported backup. Nothing was changed; keep your backup files or remove entries before restoring.")}return{next:m,stats:{incoming:s.entries.length,additions:d.length,conflicts:l,duplicates:u,existing:r.entries.length,result:f.length,removed:n==="replace"?r.entries.filter(b=>!s.entries.some(h=>h.id===b.id)).length:0}}}class fn extends Error{}const hn="2000-01-01T00:00:00.000Z",Wn=t=>new TextEncoder().encode(JSON.stringify({format:gt,version:t.schema,exportedAt:hn,journal:t})).byteLength;function Vo(t,e){et(JSON.stringify(e));try{Sn(e,hn);return}catch(n){const a=Wn(t),s=Wn(e);if(a>kt&&s>kt&&s<a){for(const r of e.entries)Wt(JSON.stringify({format:gt,version:e.schema,exportedAt:hn,journal:{...e,entries:[r]}}));return}throw new fn(`This change would exceed the complete 1 MiB JSON backup limit. Saved records and your draft were kept. Shorten stored content or remove a discovery before retrying. ${n instanceof Error?n.message:String(n)}`)}}function Ho(t={}){const e=document.getElementById("apply-app-update"),n=document.getElementById("app-update-status");if(!e||!n)return;let a=document.getElementById("app-update-notice");if(a&&t.installed){a.dataset.installed=JSON.stringify(t.installed),a.dispatchEvent(new Event("pft-installed-build"));return}if(a)return;const s=($,T)=>{const J=document.createElement($);return J.textContent=T,J};a=document.createElement("section"),a.id="app-update-notice",a.setAttribute("aria-label","Guide update / 指南更新"),a.hidden=!0,t.installed&&(a.dataset.installed=JSON.stringify(t.installed));const r=s("strong","A guide update is available. / 有指南更新可用。"),p=s("p","");p.id="app-update-versions",a.append(r,p,n,e),document.querySelector("main").prepend(a);const d=s("button","Update / 更新");d.id="review-guide-update",d.type="button",d.className="text-button",d.hidden=!0,d.setAttribute("aria-label","Review available guide update / 查看指南更新"),document.querySelector(".header-actions")?.append(d);const u=document.querySelector("header");u&&(u.style.flexWrap="wrap"),d.onclick=()=>{a.scrollIntoView({block:"start",behavior:"instant"}),e.click()};const f=document.getElementById("info"),m=s("p","");m.id="app-version-info",m.className="muted";const b=s("button","Review guide update / 查看指南更新");b.type="button",b.className="secondary",b.hidden=!0,f.append(m,b),b.onclick=()=>{f.close(),e.click()};const h=document.createElement("dialog");h.id="app-update-confirm",h.setAttribute("aria-labelledby","app-update-confirm-title");const E=s("h2","Apply this guide update? / 应用指南更新？");E.id="app-update-confirm-title";const c=s("p","Updating reloads this page. Save your discovery draft and keep unfinished intent first. Saved notebook data stays here. / 更新会重新加载页面，请先保存笔记草稿并保留未提交的意图。已保存的笔记仍留在此处。"),v=s("p","");v.id="app-update-confirm-versions";const A=s("button","Keep current guide / 暂不更新");A.id="cancel-app-update",A.type="button",A.className="secondary";const q=s("button","Apply & reload / 应用并重载");q.id="confirm-app-update",q.type="button",q.className="primary",h.append(E,c,v,A,q),document.body.append(h);const ee=document.createElement("style");ee.textContent="#app-update-notice{border:1px solid #84998b;border-radius:16px;padding:16px;margin:12px 0 20px;background:#f5f5e9;color:#244d3c}#app-update-notice[hidden]{display:none}#app-update-notice p,#app-version-info,#app-update-confirm p{overflow-wrap:anywhere;line-height:1.55}#app-update-notice button,#app-update-confirm button{min-height:44px;max-width:100%;white-space:normal}#app-update-confirm button{margin:6px 6px 0 0}#app-update-versions,#app-version-info{font-size:13px}#app-update-confirm{max-width:480px;width:calc(100% - 32px);box-sizing:border-box;max-height:calc(100dvh - 32px);overflow:auto}@media(max-width:420px){#app-update-confirm button{width:100%;margin-right:0}}",document.head.append(ee),ee.textContent+="#review-guide-update{min-height:44px;font-size:12px}";let w="not reported",S=null,P=0;const O=[...document.scripts].map($=>$.src.match(/\/assets\/index-([^/]+)\.js$/)?.[1]).find(Boolean)||"development";function x(){const $=a.dataset.installed?JSON.parse(a.dataset.installed):void 0,T=!e.hidden,J=$&&$.guide!==O;a.hidden=!T&&!J,r.textContent=T?"A guide update is ready. / 指南更新已就绪。":"New app installed; preparing its guide update. / 新应用已安装，正在准备指南更新。";const z=`${$?`Installed app ${$.apkVersion} (${$.sourceCommit.slice(0,7)}${$.sourceDirty?", modified":""}) · Packaged guide ${$.guide} · `:""}Running guide ${O}${T?` · Waiting guide ${w}`:""}`;p.textContent=m.textContent=v.textContent=z,b.hidden=!T,d.hidden=!T,T&&e.textContent!=="Review guide update / 查看指南更新"&&(e.textContent="Review guide update / 查看指南更新")}async function j(){const $=++P,T=await navigator.serviceWorker?.getRegistration().catch(()=>{});if($!==P)return;const J=T?.waiting;if(!J||J===S)return;S=J,w="not reported",x();const z=new MessageChannel,Pe=setTimeout(()=>{z.port1.close(),z.port2.close()},2e3);z.port1.onmessage=pe=>{if(J!==S||T?.waiting!==J){clearTimeout(Pe),z.port1.close(),z.port2.close();return}typeof pe.data?.guide!="string"||!/^[A-Za-z0-9_-]{1,80}$/.test(pe.data.guide)||(w=pe.data.guide,clearTimeout(Pe),z.port1.close(),z.port2.close(),x())};try{J.postMessage({type:"PFT_GUIDE_INFO"},[z.port2])}catch{clearTimeout(Pe),z.port1.close(),z.port2.close()}}const oe=e.onclick;e.onclick=$=>{if(e.disabled||e.hidden||h.open)return;const T=t.blockedReload?.();if(T){n.textContent=T,x();return}x(),h.showModal(),A.focus()};const ue=()=>{h.close(),e.focus()};A.onclick=ue,h.addEventListener("cancel",$=>{$.preventDefault(),ue()}),q.onclick=$=>{if(!h.open||q.disabled)return;const T=t.blockedReload?.();if(ue(),T){n.textContent=T,x();return}oe?.call(e,$)},new MutationObserver(()=>{x(),j()}).observe(e,{attributes:!0,attributeFilter:["hidden","disabled"]}),new MutationObserver(()=>{x(),j()}).observe(n,{childList:!0,subtree:!0}),a.addEventListener("pft-installed-build",x),navigator.serviceWorker?.addEventListener("controllerchange",x),x(),j()}function zo(t){const e=c=>document.getElementById(c),n=e("install-app"),a=e("apply-app-update");let s=null,r=0,p=!1,d=matchMedia("(display-mode: standalone)").matches,l=null,u=!1,f=!1;const m="Your browser offers home-screen installation. First AI use still needs its model download.",b=()=>{n.hidden=d||!s&&!p,n.disabled=p&&!d,n.textContent=p?"Waiting for the browser…":"Install on this device"},h=()=>{d=!0,r++,s=null,b(),e("install-app-status").textContent="The browser reported this app installed. Your notebook remains on this origin."};window.addEventListener("appinstalled",h),window.addEventListener("beforeinstallprompt",c=>{c.preventDefault(),!d&&(r++,s=c,b(),e("install-app-status").textContent=p?"Another installation offer arrived. Finish or dismiss the open browser prompt to continue.":m)}),n.onclick=async()=>{const c=s;if(!c||p||d)return;const v=r;s=null,p=!0,b(),e("install-app-status").textContent="Waiting for the browser’s installation choice. Your notebook stays on this origin.";try{await c.prompt();const A=await c.userChoice;if(v!==r||d)return;e("install-app-status").textContent=A.outcome==="accepted"?"Installation accepted in the browser. Completion is controlled by the device.":"Installation dismissed. Your notebook and current page were kept."}catch{v===r&&!d&&(e("install-app-status").textContent="The device could not open installation. You can keep using this page. Check installation help or wait for a new browser offer.")}finally{p=!1,b(),s&&!d&&(e("install-app-status").textContent=m)}};const E=()=>{a.hidden=!l?.waiting&&!f,l?.waiting&&(e("app-update-status").textContent="A new version is ready. Keep any unsaved text and close other app tabs before applying it.")};return a.onclick=()=>{const c=l?.waiting;if(!c&&!f||a.disabled)return;const v=t();if(v){e("app-update-status").textContent=v;return}if(f){location.reload();return}u=!0,a.disabled=!0,e("app-update-status").textContent="Checking for other app tabs before reloading this page…",c.postMessage({type:"PFT_ACTIVATE_UPDATE"})},navigator.serviceWorker?.addEventListener("message",c=>{c.source!==l?.waiting||c.data?.type!=="PFT_UPDATE_BLOCKED"||(u=!1,a.disabled=!1,e("app-update-status").textContent="Close other app tabs or windows before updating. This page and your unsaved text were kept.")}),navigator.serviceWorker?.addEventListener("controllerchange",()=>{if(!u)return;const c=t();if(!c){location.reload();return}u=!1,f=!0,a.disabled=!1,a.hidden=!1,a.textContent="Reload updated guide",e("app-update-status").textContent="The new version activated while you were working. This page was kept. "+c}),d&&(e("install-app-status").textContent="Running in an app window. Your data stays on this origin; keep a JSON backup."),Ho({blockedReload:t}),c=>{l=c,E(),l.addEventListener("updatefound",()=>{l?.installing?.addEventListener("statechange",E)})}}const Go="pft-runtime-0162b94173a1a8de",Zo={"/runtime/ort-wasm-simd-threaded.asyncify.mjs":"0966b6105cd936744498aa60df7a22cbd47af3374dbc64a9ab561c08a71e3611","/runtime/ort-wasm-simd-threaded.asyncify.wasm":"49871f5a4409519797e127440868a6d1923339d9185907f301a5b2a1d90af082"},Xo=`<a class="skip-link" href="#planner">Skip to trip choices</a>
<div class="shell">
  <header>
    <a class="brand" href="/" aria-label="Pocket Field Trip home"
      ><img src="/leaf.svg" alt="" width="30" height="30" />Pocket Field
      Trip<span class="edition">FIELD GUIDE № 01</span></a
    >
    <nav class="header-actions">
      <button
        class="appearance-open"
        id="appearance-open"
        type="button"
        aria-label="Appearance"
        aria-haspopup="dialog"
        aria-controls="appearance-dialog"
        aria-expanded="false"
        title="Appearance"
      >
        <span aria-hidden="true">◐</span
        ><span class="appearance-label">Appearance</span>
      </button>
      <button
        class="motion-control"
        id="motion-toggle"
        type="button"
        aria-label="Reduced motion"
        aria-pressed="false"
        title="Reduced motion: off"
      >
        <span aria-hidden="true">◌</span
        ><span class="motion-label">Motion</span>
      </button>
      <button
        class="text-button"
        id="notebook-open"
        aria-label="My discoveries"
      >
        <span class="wide-nav-label">My discoveries</span
        ><span class="compact-nav-label" aria-hidden="true">Notes</span
        ><span id="notebook-count">0</span>
      </button>
      <button class="text-button" id="about" aria-label="How it works">
        <span class="wide-nav-label">How it works ↗</span>
        <span class="compact-nav-label" aria-hidden="true">?</span>
      </button>
    </nav>
  </header>
  <main id="main">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">
          <span class="dot"></span> YOUR NEARBY FIELD GUIDE.
        </p>
        <h1>
          Outside,<br />
          <em>for a moment.</em>
        </h1>
        <p class="intro">A little time. A fresh pair of eyes.</p>
        <div class="hero-tokens" aria-label="Field trip basics">
          <span>5–20 minutes</span><span>Right where you are</span>
        </div>
      </div>
      <div class="landscape">
        <!-- LANDSCAPE -->
        <span class="scene-label" aria-hidden="true"
          >THE WORLD IS STILL OUT THERE</span
        >
        <aside
          class="sample-card"
          aria-label="Example authored card, not an AI match"
        >
          <button
            id="sample-open"
            class="sample-preview"
            type="button"
            aria-label="Preview Make a sound map — authored example, no AI"
          >
            <span class="sample-meta"
              ><span>Example · no AI</span><span>5 min · one spot</span></span
            >
            <span id="sample-title" class="sample-title"></span>
            <span class="sample-cues" id="sample-cues"></span>
            <span class="sample-arrow" aria-hidden="true">↗</span>
          </button>
        </aside>
        <svg class="paper-leaf" viewBox="0 0 100 140" aria-hidden="true">
          <path
            d="M19 137C35 102 54 54 79 8"
            fill="none"
            stroke="#123f34"
            stroke-width="5"
          />
          <path
            d="M33 109C-5 97 8 60 33 76C50 87 42 106 33 109ZM48 81C14 66 23 32 49 48C63 59 58 74 48 81ZM64 52C45 21 70 1 80 13C88 33 77 44 64 52ZM38 100C77 92 95 106 72 119C56 123 42 112 38 100ZM55 71C86 54 105 70 90 85C74 98 57 84 55 71"
            fill="#28694b"
            stroke="#123f34"
            stroke-width="1.5"
          />
        </svg>
        <div class="art-caption">
          <span>THE NEARBY IS ENOUGH</span><span aria-hidden="true">↗</span>
        </div>
      </div>
    </section>
    <nav id="journey" aria-label="Your route through the field guide">
      <button type="button" data-stage="choose" aria-current="step">
        <span aria-hidden="true">01</span> Pick a card
      </button>
      <button type="button" data-stage="take" disabled>
        <span aria-hidden="true">02</span> Take it outside
      </button>
      <button type="button" data-stage="keep" disabled>
        <span aria-hidden="true">03</span> Keep a note
      </button>
    </nav>
    <aside id="home-draft" class="home-draft" hidden>
      <p>One unsaved discovery · this tab only.</p>
      <button id="home-resume-draft" class="text-button" type="button">
        Continue my draft ↗
      </button>
    </aside>
    <aside
      id="active-trip"
      class="home-draft active-trip"
      hidden
      aria-labelledby="active-trip-label"
    >
      <p id="active-trip-label">One trip kept for your return</p>
      <p id="active-trip-title"></p>
      <div class="trip-actions">
        <button id="trip-resume" class="text-button" type="button">
          Return to this card ↗
        </button>
        <button id="trip-record" class="text-button" type="button">
          Keep a discovery
        </button>
        <button id="trip-finish" class="text-button" type="button">
          Finish trip…
        </button>
      </div>
      <div id="trip-finish-confirmation" hidden>
        <p>
          Forget only this kept trip? Your saved cards, discoveries and any
          in-tab draft stay. Nothing is marked done.
        </p>
        <div class="trip-actions">
          <button id="trip-finish-confirm" class="secondary" type="button">
            Finish without a note
          </button>
          <button id="trip-finish-cancel" class="text-button" type="button">
            Keep this trip
          </button>
        </div>
      </div>
      <p id="trip-message" role="status"></p>
    </aside>
    <section id="planner" class="planner" aria-labelledby="planner-title">
      <div class="section-heading">
        <h2 id="planner-title">Pick your ingredients.</h2>
      </div>
      <form id="trip-form" aria-busy="false">
        <div class="choices">
          <fieldset class="choice-card time-card">
            <legend><span class="step-index">01</span> Time</legend>
            <div class="segmented">
              <label
                ><input type="radio" name="minutes" value="5" checked /><span
                  >5 min</span
                ></label
              ><label
                ><input type="radio" name="minutes" value="10" /><span
                  >10 min</span
                ></label
              ><label
                ><input type="radio" name="minutes" value="20" /><span
                  >20 min</span
                ></label
              >
            </div>
          </fieldset>
          <fieldset class="choice-card nearby-card">
            <legend><span class="step-index">02</span> Nearby</legend>
            <div class="places">
              <label
                ><input
                  type="radio"
                  name="setting"
                  value="street"
                  checked
                  aria-label="A street"
                /><span
                  ><svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M3 19h18M6 19V8l5-4v15M11 10h7v9M8 10v2m0 3v1m6-3h1m0 3h1"
                    /></svg
                  ><i class="selection-mark" aria-hidden="true">✓</i
                  ><b>Street</b></span
                ></label
              ><label
                ><input
                  type="radio"
                  name="setting"
                  value="park"
                  aria-label="A park"
                /><span
                  ><svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21v-6M7 16h10M6 13l6-10 6 10H6Z" /></svg
                  ><i class="selection-mark" aria-hidden="true">✓</i
                  ><b>Park</b></span
                ></label
              ><label
                ><input
                  type="radio"
                  name="setting"
                  value="garden"
                  aria-label="A garden"
                /><span
                  ><svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12 21v-9m0 5c-6 0-8-4-8-7 5 0 8 3 8 7Zm0-5c0-5 4-8 8-8 0 5-3 8-8 8Z"
                    /></svg
                  ><i class="selection-mark" aria-hidden="true">✓</i
                  ><b>Garden</b></span
                ></label
              ><label
                ><input
                  type="radio"
                  name="setting"
                  value="water"
                  aria-label="Water"
                /><span
                  ><svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M3 9c3-4 6 4 9 0s6 4 9 0M3 15c3-4 6 4 9 0s6 4 9 0"
                    /></svg
                  ><i class="selection-mark" aria-hidden="true">✓</i
                  ><b>Water</b></span
                ></label
              >
            </div>
          </fieldset>
        </div>
        <div class="intent-row">
          <div class="choice-card intent-card">
            <label for="intent"
              ><span class="step-index">03</span> What do you need?</label
            ><textarea
              id="intent"
              maxlength="280"
              rows="2"
              aria-describedby="intent-hint"
              placeholder="My mind is crowded. I want something quiet to notice."
              required
            ></textarea>
            <div class="intent-meta">
              <span id="intent-hint">Use an English sentence.</span
              ><span id="intent-count" aria-hidden="true">0 / 280</span>
            </div>
            <div class="suggestions" aria-label="Intent suggestions">
              <button
                type="button"
                data-intent="My mind is crowded. I want something quiet to notice."
                aria-label="A quieter mind"
              >
                Quiet</button
              ><button
                type="button"
                data-intent="I feel stuck creatively and want to see ordinary things differently."
                aria-label="A spark of curiosity"
              >
                Curiosity</button
              ><button
                type="button"
                data-movement="walk"
                data-intent="I have been sitting all day and want to stretch my legs."
                aria-label="A little movement"
              >
                Movement
              </button>
            </div>
          </div>
          <details id="refinements">
            <summary>
              Optional details<small id="refinement-summary" aria-live="polite"
                >Any lens</small
              >
            </summary>
            <div class="refinement-controls">
              <fieldset class="detail-choices">
                <legend>
                  Details I can actually see
                  <small
                    >Optional · cards needing these stay out until
                    selected</small
                  >
                </legend>
                <label
                  ><input type="checkbox" name="feature" value="light" /> Direct
                  light and shadows</label
                >
                <label
                  ><input type="checkbox" name="feature" value="plant" /> A
                  tree, leaf or planted bed</label
                >
              </fieldset>
              <div class="refinement-lens">
                <label class="lens-choice" for="lens"
                  >A lens to try <span>Narrows the reviewed tasks</span></label
                >
                <select id="lens" name="lens">
                  <option value="any">Any way of noticing</option>
                  <option value="sound">Sound & distance</option>
                  <option value="perspective">A different view</option>
                  <option value="change">Small changes</option>
                  <option value="texture">Surfaces & texture</option>
                  <option value="edges">Edges & boundaries</option>
                </select>
              </div>
            </div>
          </details>
          <div class="action-area">
            <div class="movement-choices" id="movement-choices">
              <label class="still"
                ><input type="checkbox" id="still" /><span class="still-copy"
                  ><b>Keep it in one spot</b
                  ><small>Sit if you like</small></span
                ><i class="toggle-track" aria-hidden="true"></i></label
              ><label class="walk-choice"
                ><input type="checkbox" id="walk" /> I want a gentle walk</label
              >
              <p class="choice-hint">Both welcome unless you choose.</p>
            </div>
            <div class="submit-area">
              <p id="model-download-note" role="status">
                First AI match downloads about 50 MB.
              </p>
              <button
                class="primary"
                id="find"
                type="submit"
                aria-describedby="model-download-note"
              >
                Find my field trip <span aria-hidden="true">↗</span>
              </button>
            </div>
          </div>
        </div>
        <div class="guide-entry">
          <span id="choice-summary" aria-live="polite"></span>
          <button type="button" id="browse" class="text-button">
            Browse field notes <span aria-hidden="true">↗</span>
          </button>
        </div>
        <details class="privacy-details">
          <summary>
            Local AI. Your words stay here.<small
              >Notes stay in this browser. Keep a backup.</small
            >
          </summary>
          <p>
            First AI use downloads about 50 MB of open weights and runtime.
            Downloads contact the model host; matching happens locally. No GPS
            or analytics. Offline matching needs a complete first load and
            retained browser caches.
          </p>
        </details>
      </form>
      <div
        id="offline-routes"
        class="offline-routes"
        role="group"
        aria-label="Offline options"
        hidden
      >
        <button id="offline-open-guide" class="text-button" type="button">
          Browse without AI
        </button>
        <button id="offline-open-notebook" class="text-button" type="button">
          Open my notebook
        </button>
        <button
          id="offline-open-saved"
          class="text-button"
          type="button"
          hidden
        >
          Open saved card
        </button>
      </div>
      <div id="status" role="status" aria-live="polite" hidden></div>
      <div class="loading" id="loading" hidden>
        <div class="loading-heading">
          <span class="loading-flower" aria-hidden="true">✳</span>
          <div>
            <p class="eyebrow">LOCAL INTELLIGENCE, A LITTLE PATIENCE</p>
            <h3 id="loading-title">Preparing your field guide</h3>
          </div>
        </div>
        <div
          class="loading-bar"
          role="progressbar"
          aria-label="Current model loading stage"
        >
          <i></i>
        </div>
        <p id="progress-label" role="status">Getting the field guide ready…</p>
        <div class="loading-foot">
          <span id="loading-note"
            >The first visit downloads open weights. Your words stay here.</span
          ><button id="cancel" class="text-button">Cancel loading</button>
        </div>
        <ol class="loading-stages" aria-label="Model preparation stages">
          <li data-stage="download">Open model</li>
          <li data-stage="catalog">Field notes</li>
          <li data-stage="match">Your intent</li>
        </ol>
        <p class="loading-scope">
          Progress covers the current file. Cancel stops matching; an in-flight
          download may finish.
        </p>
      </div>
      <div id="failure" class="notice" hidden>
        <h3>The model couldn’t load.</h3>
        <p>
          Check your connection, then try again. You can also use the clearly
          labeled keyword guide below. It does not use AI.
        </p>
        <div>
          <button id="retry" class="secondary">Retry model</button
          ><button id="fallback" class="text-button">
            Use keyword guide ↗
          </button>
        </div>
        <details>
          <summary>Technical details</summary>
          <pre id="error-detail"></pre>
        </details>
      </div>
      <div id="empty" class="notice" hidden>
        <h3>No suggestion selected.</h3>
        <p>
          Check your choices, clear card preferences, or browse and choose
          explicitly.
        </p>
      </div>
      <div id="recent" class="notice recent-notice" hidden>
        <h3>A familiar task can have a new day.</h3>
        <p id="recent-detail"></p>
        <button id="allow-repeats" class="secondary">
          Include recently done tasks
        </button>
      </div>
      <div id="weak" class="notice" hidden>
        <p class="eyebrow">A SMALL GUIDE HAS LIMITS</p>
        <h3 id="weak-title" tabindex="-1">Not a clear match yet.</h3>
        <p>
          This guide may not cover what you mean. Try an English sentence about
          a small outdoor observation, or choose a note yourself.
        </p>
        <details class="weak-reason">
          <summary>Why the cautious suggestion?</summary>
          <p id="weak-detail" class="muted"></p>
        </details>
        <div>
          <button id="rewrite" class="secondary">Refine my intent</button
          ><button id="browse-weak" class="text-button">
            Browse field notes</button
          ><button id="closest" class="text-button">View closest note</button>
        </div>
      </div>
    </section>
    <aside id="return-invitation" class="return-invitation" hidden>
      <p class="eyebrow">YOUR NOTEBOOK</p>
      <p id="return-summary"></p>
      <button id="return-open" class="text-button">Open my notebook</button>
    </aside>
    <section id="result" hidden aria-label="Your field trip">
      <div class="result-top">
        <div class="result-heading">
          <h2>Your field note</h2>
        </div>
        <span id="match-type"></span>
        <div class="result-tools">
          <button id="edit" class="text-button">
            Edit choices <span aria-hidden="true">↖</span>
          </button>
          <button id="quiet-card" class="text-button" aria-pressed="false">
            Quiet card view
          </button>
        </div>
      </div>
      <p id="fit-warning" class="notice" role="status" hidden></p>
      <div class="trip-layout">
        <article class="trip-card" id="trip-card" aria-labelledby="card-title">
          <div class="card-hero">
            <div class="card-meta">
              <span id="card-number"></span><span id="card-time"></span>
            </div>
            <div class="card-art-row">
              <div class="card-icon" id="card-motif" aria-hidden="true"></div>
              <span id="card-lens" class="lens-stamp"></span>
            </div>
            <h2 id="card-title" tabindex="-1"></h2>
            <p id="card-subtitle"></p>
          </div>
          <div class="card-body">
            <p class="trip-safety safety">
              Choose a safe, accessible place. Check conditions yourself; this
              guide doesn’t know local weather or hazards.
            </p>
            <details id="match-details" class="match-details">
              <summary>Match &amp; conditions</summary>
              <p id="match-caution" class="match-caution"></p>
              <p id="fit-receipt" class="fit-receipt"></p>
            </details>
            <details id="observation-plan" hidden>
              <summary>Why these steps fit together</summary>
              <p id="observation-receipt"></p>
              <p id="observation-reason"></p>
            </details>
            <p class="steps-heading">Three small steps</p>
            <ol id="steps"></ol>
            <div class="pocket-strip">
              <span class="eyebrow">YOUR THREE POCKET CUES</span>
              <ol id="pocket-cues"></ol>
            </div>
            <p id="takeaway"></p>
            <div class="trip-actions">
              <button id="go" class="primary">
                I’m stepping outside <span aria-hidden="true">↗</span>
              </button>
              <button id="save" class="secondary">
                Save this card for later
              </button>
            </div>
            <p id="save-receipt" class="save-receipt" role="status" hidden>
              <span aria-hidden="true">✓</span> Kept on this device. Ready for
              next time.
            </p>
            <p id="save-error" class="save-error" hidden></p>
            <button id="quiet-return" class="secondary" type="button" hidden>
              I’m back — keep one discovery
            </button>
            <div class="card-foot">
              <span>Leave things as you found them.</span
              ><span aria-hidden="true">↗</span>
            </div>
          </div>
        </article>
        <aside class="departure">
          <p class="eyebrow">AFTER YOUR FIELD TRIP</p>
          <h3>Keep one small discovery.</h3>
          <p>One line, if you like.</p>
          <button id="share-card" class="text-button">
            Take this card as text ↗
          </button>
          <button id="print-card" class="text-button" type="button">
            Print this card ↗
          </button>
          <p id="card-print-status" role="status"></p>
          <div class="feedback-actions" aria-label="Optional card feedback">
            <button id="record" class="secondary">Write one discovery</button>
            <p id="draft-status" class="draft-status" hidden></p>
            <button id="done" class="text-button">
              I did this · without a note
            </button>
            <button id="not-fit" class="text-button">
              Not for me · set family aside
            </button>
            <span id="card-feedback" role="status"></span>
            <button id="undo-card-feedback" class="text-button" hidden>
              Undo last feedback
            </button>
            <span id="feedback-undo-status" role="status"></span>
          </div>
          <div class="card-navigation">
            <button id="previous-card" class="text-button" type="button" hidden>
              <span aria-hidden="true">←</span> Previous note
            </button>
            <button id="another" class="text-button">
              Another eligible note <span aria-hidden="true">↻</span></button
            ><span id="card-position" aria-label="Match position"></span>
          </div>
        </aside>
      </div>
      <details class="lab" id="lab">
        <summary>
          Behind this match <span>Open model · local inference</span>
        </summary>
        <div class="lab-content">
          <p id="explanation"></p>
          <div class="comparison">
            <div>
              <h4>Semantic match</h4>
              <div id="semantic-list"></div>
            </div>
            <div>
              <h4>Keyword baseline</h4>
              <div id="keyword-list"></div>
            </div>
          </div>
          <p class="muted">
            Cosine similarity measures meaning overlap, not a probability of
            suitability. Scores below 0.30 trigger a cautious review step; this
            is a small-fixture guard, not a validated accuracy boundary. The
            baseline counts exact tag words; tied scores use a fixed
            alphabetical order. Both obey the same hard constraints.
          </p>
          <pre id="evidence"></pre>
          <button id="export" class="secondary">
            Download inference evidence
          </button>
        </div>
      </details>
    </section>
    <section id="saved" hidden>
      <div class="saved-row">
        <div>
          <p class="eyebrow">IN YOUR POCKET</p>
          <h3 id="saved-title"></h3>
          <p class="saved-hint">
            One saved card, on this browser. Saving another replaces it.
          </p>
        </div>
        <button id="open-saved" class="secondary">Open saved card</button
        ><button id="clear-saved" class="text-button">Forget card</button>
      </div>
    </section>
    <section
      id="memory"
      class="memory"
      hidden
      aria-label="Local card preferences"
    >
      <div>
        <p class="eyebrow">A LITTLE MEMORY. ONLY HERE.</p>
        <p id="memory-summary"></p>
        <p class="muted">
          Completion preferences contain card IDs only. The three recent content
          families stay out until you include them again; set-aside notes leave
          until cleared. Discoveries you explicitly save can contain your words,
          tags and dates. No account or upload.
        </p>
      </div>
      <button id="undo-feedback" class="secondary" hidden>
        Undo last feedback</button
      ><button id="clear-feedback" class="text-button">
        Clear card preferences
      </button>
    </section>
    <section class="philosophy">
      <span aria-hidden="true">✳</span>
      <p>
        A field trip doesn’t need to be far.<br /><em
          >It only needs you to be there.</em
        >
      </p>
    </section>
  </main>
  <footer>
    <span>Made for the world beyond the screen.</span>
    <div>
      <span id="offline-status">Online · model downloads on first use</span
      ><button id="privacy-info" class="text-button">
        Privacy & open source
      </button>
    </div>
  </footer>
</div>
<dialog id="info" aria-labelledby="info-title">
  <div class="dialog-tools">
    <button class="dialog-close" id="close-info" aria-label="Close information">
      ×
    </button>
  </div>
  <p class="eyebrow">AN OPEN LITTLE FIELD GUIDE</p>
  <h2 id="info-title">Small trips. Local intelligence.</h2>
  <p>
    A real open-weight sentence model, Xenova/all-MiniLM-L6-v2 (Apache-2.0),
    matches the meaning of your English words to original authored observation
    activities. Time, setting, movement and selected visible details are strict
    filters.
  </p>
  <p>
    Transformers.js (Apache-2.0) runs quantized ONNX weights with WebAssembly in
    a worker. No text, location or inference is sent to a server. The first
    download contacts Hugging Face and its delivery hosts, which receive normal
    connection metadata such as your IP address. This page uses no analytics or
    external fonts.
  </p>
  <p>
    First AI use downloads roughly 50 MB of weights and runtime, plus page
    files. Browsing authored notes does not load these AI resources. Model files
    use the browser cache. Production app files use a service worker. Offline
    reuse depends on a complete first load and retained browser storage. A saved
    card and completion preferences are stored locally. Discoveries you
    explicitly save contain your one-line text, tags, dates and the task
    snapshot. Clear model downloads keeps this notebook; removing personal
    records requires confirmation. Your intention is not stored. Inference
    evidence stays in memory unless you download it. Your motion choice is kept
    locally when storage is available; device settings take priority.
  </p>
  <section class="app-access" aria-labelledby="app-access-title">
    <h3 id="app-access-title">Keep the field guide close.</h3>
    <p id="install-app-status" role="status">
      A compatible browser can offer home-screen installation. A complete first
      load and retained caches are still needed for offline AI.
    </p>
    <button id="install-app" class="secondary" type="button" hidden>
      Install on this device
    </button>
    <details class="installation-help">
      <summary>Help with home-screen installation</summary>
      <p>
        If an install button appears here, use it to open your browser’s prompt.
        Some browsers also offer Install in their menu. Availability depends on
        your browser and device; accepting a prompt does not confirm completion.
      </p>
      <p>
        On iPhone or iPad, open this page in Safari and choose Share (inside the
        Page Menu on some iPhones). On iPad, choose View More if needed. Select
        Add to Home Screen, turn on Open as Web App if offered, then choose Add.
        On supported Macs, choose Add to Dock in Safari’s Share or File menu,
        then Add.
      </p>
      <p>
        Keep a JSON backup from your notebook before changing browsers or
        addresses. Saved discoveries belong to this browser and site address;
        another browser or app context may have separate storage. Installation
        does not download the AI model or guarantee offline access.
      </p>
      <p class="muted">
        Browser instructions:
        <a
          href="https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios"
          target="_blank"
          rel="noopener noreferrer"
          >iPhone</a
        >,
        <a
          href="https://support.apple.com/guide/ipad/open-as-web-app-ipad8f1f7a29/ipados"
          target="_blank"
          rel="noopener noreferrer"
          >iPad</a
        >,
        <a
          href="https://support.apple.com/en-us/104996"
          target="_blank"
          rel="noopener noreferrer"
          >Mac</a
        >. Opening these links contacts Apple Support.
      </p>
    </details>
    <p id="app-update-status" role="status"></p>
    <button id="apply-app-update" class="secondary" type="button" hidden>
      Apply update &amp; reload
    </button>
  </section>
  <button id="manage-packs" class="secondary">Review local card packs…</button>
  <p id="pack-load-status" role="status"></p>
  <button id="clear-cache" class="secondary">Clear model downloads</button>
  <details class="cache-inventory">
    <summary>Offline files on this browser</summary>
    <p id="cache-inventory-status" role="status">Not yet checked.</p>
    <button id="refresh-cache-inventory" class="text-button" type="button">
      Check cached files again
    </button>
    <p class="muted">
      File presence is not a successful offline run. Model bytes are not checked
      here; runtime hashes are. Browsers can remove caches. If AI fails, browse
      the authored field guide. Clearing model downloads keeps your notebook.
    </p>
  </details>
  <p id="cache-message" role="status"></p>
  <button id="clear-personal" class="text-button">
    Remove personal records…
  </button>
</dialog>
<dialog id="guide" aria-labelledby="guide-title">
  <div class="dialog-tools">
    <button
      class="dialog-close"
      id="close-guide"
      aria-label="Close field guide"
    >
      ×
    </button>
  </div>
  <p class="eyebrow">REVIEWABLE TASKS. A WORLD OF SMALL DETAILS.</p>
  <h2 id="guide-title">A small field guide.</h2>
  <p>
    Choose an authored field note. No AI or model download. A familiar note can
    reveal something new.
  </p>
  <label class="local-search" for="guide-search"
    >Search field notes
    <input
      id="guide-search"
      type="search"
      placeholder="Title, description or tag"
      autocomplete="off"
    />
  </label>
  <button id="guide-search-clear" class="text-button" type="button" hidden>
    Clear search
  </button>
  <label class="guide-filter"
    ><input id="guide-all" type="checkbox" /> Show all authored tasks</label
  >
  <p id="guide-summary" class="muted" role="status"></p>
  <details class="composition-builder">
    <summary>Compose a reviewed observation</summary>
    <div
      id="compose-presets"
      class="collection-chips"
      aria-label="Reviewed combinations"
    ></div>
    <p class="compose-intro">
      Four reviewed plans. Five minutes. One safe spot. No AI.
    </p>
    <details id="compose-customize">
      <summary>Customize these ingredients</summary>
      <label for="compose-lens">Lens</label
      ><select id="compose-lens">
        <option value="edges">Edges &amp; boundaries</option>
        <option value="texture">Surfaces &amp; texture</option>
      </select>
      <label for="compose-action">Action</label
      ><select id="compose-action">
        <option value="compare">Compare two details</option>
        <option value="trace-with-eyes">Follow a line with your eyes</option>
      </select>
      <p class="muted">
        Constraint: one safe spot, seated or standing. No touching or moving
        closer.
      </p>
      <label for="compose-trace">Bring back</label
      ><select id="compose-trace">
        <option value="one-line-contrast">One contrast sentence</option>
        <option value="one-line-shape">
          One imagined mark or shape sentence
        </option>
        <option value="two-words">Two describing words</option>
      </select>
    </details>
    <p id="compose-status" role="status"></p>
    <div
      id="compose-alternatives"
      class="collection-chips"
      aria-label="Reviewed alternatives"
      hidden
    ></div>
    <section
      id="compose-preview"
      class="compose-preview"
      aria-labelledby="compose-preview-title"
      hidden
    >
      <p class="eyebrow">YOUR REVIEWED POCKET PLAN</p>
      <h3 id="compose-preview-title"></h3>
      <ol id="compose-preview-steps"></ol>
      <p id="compose-preview-trace"></p>
      <details>
        <summary>Modules &amp; source review</summary>
        <p id="compose-receipt"></p>
      </details>
    </section>
    <button id="compose-open" class="secondary" type="button">
      Open reviewed card
    </button>
  </details>
  <div id="guide-list" class="guide-list"></div>
  <p id="guide-empty" class="muted" hidden>
    No field notes match. Clear the search or show all authored tasks.
  </p>
  <button id="guide-expand" class="secondary" type="button" hidden>
    Search all 20 authored notes
  </button>
</dialog>
<dialog id="departure" aria-labelledby="departure-title">
  <p class="eyebrow">YOU HAVE EVERYTHING YOU NEED</p>
  <h2 id="departure-title">Three cues. Then the world.</h2>
  <p id="departure-card"></p>
  <ol id="departure-cues" class="departure-cues"></ol>
  <details class="full-steps">
    <summary>Read the full steps again</summary>
    <p id="departure-steps"></p>
  </details>
  <p class="muted">
    You can close this screen now. No timer. No streak. Nothing to check.
  </p>
  <p class="muted">
    If you return with a detail, Write one discovery can keep a line here.
    Leaving this screen never marks the task done.
  </p>
  <p id="trip-start-status" role="status">
    Start keeps only this card identity locally. No intent, location, timer or
    completion is stored.
  </p>
  <button id="start-trip" class="primary" type="button">
    Start this trip · keep it locally
  </button>
  <div id="trip-replace" hidden>
    <p id="trip-replace-text"></p>
    <button id="trip-replace-confirm" class="secondary" type="button">
      Replace kept trip
    </button>
    <button id="trip-replace-cancel" class="text-button" type="button">
      Keep previous trip
    </button>
  </div>
  <button id="return-from-trip" class="secondary" type="button">
    I’m back — keep one discovery
  </button>
  <button id="back" class="secondary">Back to my card</button>
</dialog>

<dialog id="discovery-editor" aria-labelledby="discovery-title">
  <div class="dialog-tools">
    <button
      id="close-discovery"
      class="dialog-close"
      aria-label="Close discovery editor"
    >
      ×
    </button>
  </div>
  <p class="eyebrow">A SMALL THING, KEPT BY YOU</p>
  <h2 id="discovery-title">One thing you noticed.</h2>
  <p id="discovery-task" class="discovery-task-name"></p>
  <form id="discovery-form">
    <div class="editor-fields">
      <label for="discovery-text" id="discovery-prompt"></label
      ><textarea
        id="discovery-text"
        rows="3"
        maxlength="280"
        placeholder="The railing’s shadow bent where a leaf interrupted it."
        required
      ></textarea>
      <p id="discovery-count" class="muted">0 / 280</p>
      <div
        id="writing-starters"
        class="writing-starters"
        aria-label="Optional writing starters"
      >
        <button type="button" data-starter="I noticed ">I noticed…</button>
        <button type="button" data-starter="A small detail was ">
          A small detail…
        </button>
        <button type="button" data-starter="Next time I want to notice ">
          Next time…
        </button>
      </div>
      <label for="discovery-scene"
        >Scene <span class="muted">Optional · chosen by you</span></label
      >
      <select id="discovery-scene">
        <option value="">Unclassified</option>
        <option value="street">Street</option>
        <option value="park">Park</option>
        <option value="garden">Garden</option>
        <option value="water">Waterside</option>
      </select>
      <fieldset>
        <legend>Tags <span class="muted">Optional · up to three</span></legend>
        <div id="discovery-tags" class="discovery-tags"></div>
      </fieldset>
      <label id="done-with-note" class="done-with-note"
        ><input id="note-done" type="checkbox" checked /> Also mark this task
        done by me</label
      >
    </div>
    <div class="editor-actions">
      <p id="discovery-message" role="status"></p>
      <button id="save-discovery" class="primary" type="submit">
        Save discovery on this browser</button
      ><button id="discard-discovery" class="text-button" type="button">
        Discard draft
      </button>
    </div>
  </form>
  <details class="editor-privacy">
    <summary>Only Save keeps your discovery</summary>
    <p class="muted">
      Your chosen discovery text can be in any language; AI matching uses
      English. Only Save stores it here. No upload or proof required. Clearing
      browser data can remove it.
    </p>
  </details>
</dialog>
<dialog id="notebook" class="notebook-dialog" aria-labelledby="notebook-title">
  <div class="dialog-tools">
    <button
      id="close-notebook"
      class="dialog-close"
      aria-label="Close notebook"
    >
      ×
    </button>
  </div>
  <p class="eyebrow">THE ORDINARY, NEWLY NOTICED</p>
  <h2 id="notebook-title">Your discoveries.</h2>
  <p id="notebook-summary"></p>
  <p id="notebook-problem" role="status"></p>
  <details
    id="notebook-collection"
    class="notebook-collection"
    aria-label="Saved collection"
    hidden
  >
    <summary id="collection-summary"></summary>
    <p class="eyebrow">SMALL THINGS, KEPT</p>
    <div
      id="collection-scenes"
      class="collection-chips"
      aria-label="Scene collections"
    ></div>
    <p class="muted">
      Scene categories describe your choice, not a place. No streaks or
      automatic change detection.
    </p>
  </details>
  <section
    id="raw-rescue-panel"
    class="raw-rescue-panel"
    hidden
    aria-label="Unverified raw data rescue / 未验证原始数据救援"
  >
    <p>
      Keep a raw copy before repair. It contains personal stored text, not a
      verified restorable backup. Nothing is uploaded.
    </p>
    <p lang="zh">
      可先保存待修复的原始数据副本，内含个人存储内容，未经恢复验证，不会上传。
    </p>
    <button id="prepare-raw-rescue" class="secondary" type="button">
      Prepare raw rescue / 准备原始数据救援
    </button>
    <p id="raw-rescue-status" role="status"></p>
  </section>
  <div id="notebook-draft" class="notebook-draft" hidden>
    <p id="notebook-draft-status"></p>
    <button id="resume-discovery" class="secondary" type="button">
      Continue draft
    </button>
  </div>
  <label class="local-search" for="notebook-search"
    >Search discoveries
    <input
      id="notebook-search"
      type="search"
      placeholder="Words, task, tags or scene"
      autocomplete="off"
    />
  </label>
  <details id="notebook-tools" class="notebook-tools">
    <summary>Filter &amp; compare</summary>
    <div class="notebook-filters">
      <label for="notebook-lens"
        >Lens<br /><select id="notebook-lens">
          <option value="any">All lenses</option>
          <option value="sound">Sound &amp; distance</option>
          <option value="perspective">A different view</option>
          <option value="change">Small changes</option>
          <option value="texture">Surfaces &amp; texture</option>
          <option value="edges">Edges &amp; boundaries</option>
        </select></label
      >
      <label for="notebook-month"
        >Month (UTC)<br /><select id="notebook-month">
          <option value="any">All months</option>
        </select></label
      >
      <label for="notebook-sort"
        >Order<br /><select id="notebook-sort">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="edited">Recently edited first</option>
        </select></label
      >
      <label for="notebook-filter"
        >Tag<br /><select id="notebook-filter">
          <option value="any">All discoveries</option>
          <option>light</option>
          <option>sound</option>
          <option>texture</option>
          <option>movement</option>
          <option>change</option>
          <option>edges</option>
        </select></label
      >
      <label for="notebook-scene"
        >Scene<br /><select id="notebook-scene">
          <option value="any">All scenes</option>
          <option value="unclassified">Unclassified</option>
          <option value="street">Street</option>
          <option value="park">Park</option>
          <option value="garden">Garden</option>
          <option value="water">Waterside</option>
        </select></label
      >
      <label for="notebook-from"
        >From date (UTC)<br /><input id="notebook-from" type="date"
      /></label>
      <label for="notebook-to"
        >Through date (UTC)<br /><input id="notebook-to" type="date"
      /></label>
    </div>
    <button id="clear-note-filters" class="text-button">Clear filters</button>
    <section class="notebook-comparison" aria-labelledby="compare-title">
      <h3 id="compare-title">Look back, side by side.</h3>
      <p class="muted">
        Choose two visible discoveries. You decide which is “Previous” and “This
        time”. Scene categories do not identify a place; no change is inferred.
      </p>
      <div class="comparison-choices">
        <label for="compare-previous"
          >Previous · your choice<br /><select id="compare-previous">
            <option value="">Choose a discovery</option>
          </select></label
        >
        <label for="compare-current"
          >This time · your choice<br /><select id="compare-current">
            <option value="">Choose a different discovery</option>
          </select></label
        >
      </div>
      <div class="comparison-actions">
        <button id="swap-comparison" class="text-button" type="button" disabled>
          Swap previous &amp; this time
        </button>
        <button id="clear-comparison" class="text-button">
          Clear comparison
        </button>
        <button id="compare-boundaries" class="text-button" type="button">
          Compare earliest &amp; latest visible
        </button>
      </div>
      <p id="comparison-status" role="status"></p>
      <div id="comparison-notes" class="comparison-notes" hidden></div>
    </section>
  </details>
  <details class="notebook-backup">
    <summary>Back up &amp; restore</summary>
    <p>
      Download your saved notes, task snapshots and preferences as JSON. Keep
      the file somewhere you control; unsaved drafts are excluded. Nothing is
      uploaded.
    </p>
    <button id="export-notebook" class="secondary">Download JSON backup</button>
    <button id="export-notebook-text" class="text-button" type="button">
      Download all saved notes as TXT
    </button>
    <p class="muted">A readable copy. Use JSON to restore your notebook.</p>
    <button id="choose-backup" class="text-button">
      Choose a JSON backup to restore…
    </button>
    <button id="cancel-backup-read" class="text-button" type="button" hidden>
      Stop waiting for this file
    </button>
    <input
      id="restore-file"
      type="file"
      accept=".json,application/json"
      hidden
    />
    <p id="backup-status" role="status"></p>
  </details>
  <p id="notebook-filter-status" role="status"></p>
  <div id="notebook-view-context" class="notebook-view-context" hidden>
    <p id="active-note-filters"></p>
    <p id="notebook-view-summary"></p>
    <button id="clear-view-filters" class="text-button" type="button">
      Show all saved notes
    </button>
  </div>
  <p id="notebook-status" role="status"></p>
  <div id="family-view" class="notebook-view-context" hidden>
    <p id="family-view-label"></p>
    <button id="clear-family-view" class="text-button" type="button">
      Show all task families
    </button>
  </div>
  <details id="note-selection-tools" class="notebook-tools" hidden>
    <summary>Choose saved notes to take with you</summary>
    <p class="muted">
      Nothing is selected by default. This output includes private discoveries;
      public card sharing stays separate.
    </p>
    <button id="select-visible-notes" class="text-button" type="button">
      Select notes in this view
    </button>
    <button id="clear-selected-notes" class="text-button" type="button">
      Clear selection
    </button>
    <p id="selected-notes-status" role="status"></p>
    <button
      id="prepare-selected-notes"
      class="secondary"
      type="button"
      disabled
    >
      Preview selected private notes
    </button>
  </details>
  <button id="undo-discovery" class="secondary" hidden>
    Undo last deletion
  </button>
  <button
    id="notebook-density"
    class="text-button"
    type="button"
    aria-pressed="false"
    hidden
  >
    Use compact view
  </button>
  <div id="notebook-list" class="notebook-list"></div>
  <div class="notebook-empty">
    <p id="notebook-empty">Keep one thing you noticed after a field trip.</p>
    <button id="notebook-start" class="secondary" type="button" hidden>
      Browse field notes
    </button>
  </div>
  <button id="notebook-tools-jump" class="text-button" type="button">
    Back to search &amp; filters ↑
  </button>
  <details class="notebook-about">
    <summary>About this notebook</summary>
    <p class="muted">
      Up to 100 discoveries on this browser. JSON backups stay with you; there
      is no cloud sync. Deleting a discovery keeps completion preferences; clear
      those separately to reset suggestions.
    </p>
    <p class="muted">
      Saved task snapshots are notebook data. Revisit opens the current authored
      guide; restored snapshots never become new recommendations.
    </p>
  </details>
</dialog>
<dialog id="raw-rescue-dialog" aria-labelledby="raw-rescue-title">
  <h2 id="raw-rescue-title">
    Raw notebook rescue <span lang="zh">/ 原始笔记救援</span>
  </h2>
  <p>
    This TXT file wraps the exact stored string in a labeled envelope. It needs
    review or repair with a compatible version; do not import it as a notebook
    backup.
  </p>
  <p lang="zh">
    TXT
    文件以明确标记的封装保留原始存储字符串，需审查或由兼容版本修复，不能当作已验证的笔记备份导入。
  </p>
  <p class="muted">
    No edits, migration or clearing. Unsaved drafts are excluded. Up to 2 MiB;
    oversized data is never shortened.
  </p>
  <p class="muted" lang="zh">
    不会修改、迁移或清空；不含未保存草稿。文件上限 2 MiB，超限不会截断。
  </p>
  <p id="raw-rescue-file-name" class="muted"></p>
  <p id="raw-rescue-error" role="status"></p>
  <div class="raw-rescue-actions">
    <button id="cancel-raw-rescue" class="secondary" type="button">
      Cancel / 取消
    </button>
    <button id="download-raw-rescue" class="primary" type="button" disabled>
      Request rescue download / 请求救援下载
    </button>
  </div>
</dialog>
<dialog id="restore-notebook" aria-labelledby="restore-title">
  <p class="eyebrow">LOCAL JSON RESTORE</p>
  <h2 id="restore-title">Choose what to keep.</h2>
  <p>
    Supported backups only · up to 1 MiB and 100 discoveries. No records change
    until you confirm. Imported text is displayed literally; snapshots cannot
    add tasks to the guide.
  </p>
  <fieldset class="restore-modes">
    <legend>Restore discoveries</legend>
    <label
      ><input
        id="restore-merge"
        type="radio"
        name="restore-mode"
        value="merge"
        checked
      />
      Merge · keep current same-ID records</label
    >
    <label
      ><input
        id="restore-replace"
        type="radio"
        name="restore-mode"
        value="replace"
      />
      Replace · use the backup's discoveries</label
    >
  </fieldset>
  <label class="done-with-note"
    ><input id="restore-preferences" type="checkbox" /> Also replace completed
    and set-aside preferences with this backup</label
  >
  <p id="restore-preferences-detail" class="muted"></p>
  <p id="restore-file-identity" class="muted"></p>
  <p id="restore-summary" role="status"></p>
  <details>
    <summary>Review all imported discoveries and task snapshots</summary>
    <div id="restore-sample"></div>
  </details>
  <details id="restore-removed-review" hidden>
    <summary>Current discoveries absent from replacement</summary>
    <div id="restore-removed"></div>
  </details>
  <label id="restore-replace-confirmation" class="done-with-note" hidden
    ><input id="restore-replace-ack" type="checkbox" /> I understand this
    replaces my current discoveries. I can cancel and download a backup
    first.</label
  >
  <p id="restore-error" role="status"></p>
  <button id="cancel-restore" class="secondary">
    Cancel · keep current records
  </button>
  <button id="confirm-restore" class="text-button">Merge discoveries</button>
</dialog>
<dialog id="clear-personal-dialog" aria-labelledby="clear-personal-title">
  <p class="eyebrow">PERSONAL RECORDS</p>
  <h2 id="clear-personal-title">Remove your local records?</h2>
  <p id="clear-personal-count"></p>
  <p>
    Existing discoveries leave this browser. You can recover them only from a
    JSON backup you kept. Cancel keeps them.
  </p>
  <p id="personal-clear-message" role="status"></p>
  <button id="cancel-personal-clear" class="secondary">Keep my records</button
  ><button id="confirm-personal-clear" class="text-button">
    Remove personal records
  </button>
</dialog>

<dialog id="card-packs" aria-labelledby="packs-title">
  <div class="dialog-tools">
    <button id="close-packs" class="dialog-close" aria-label="Close card packs">
      ×
    </button>
  </div>
  <p class="eyebrow">LOCAL FILES · REVIEW ONLY</p>
  <h2 id="packs-title">A pocket-sized card pack.</h2>
  <p>
    Download the four reviewed visual cards, or preview a local JSON pack. One
    review pack can be kept here. Imported text is not approved for an activity
    and never enters the original 20-card guide or AI pool.
  </p>
  <p id="pack-status" role="status"></p>
  <section id="pack-controls" aria-label="Card-pack files">
    <p id="pack-stored-summary"></p>
    <button id="export-reviewed-pack" class="secondary">
      Download reviewed four-card JSON
    </button>
    <button id="share-reviewed-pack" class="secondary" type="button">
      Share reviewed JSON…
    </button>
    <button id="print-reviewed-pack" class="secondary" type="button">
      Print reviewed cards
    </button>
    <button id="choose-pack" class="text-button">
      Choose a card-pack JSON…
    </button>
    <button id="review-stored-pack" class="secondary" type="button" disabled>
      Review stored pack
    </button>
    <button id="remove-stored-pack" class="text-button" type="button" disabled>
      Remove stored review pack…
    </button>
    <button id="rescue-stored-pack" class="text-button" type="button" disabled>
      Keep an unverified raw pack copy…
    </button>
    <button id="export-stored-pack" class="secondary" disabled>
      Download stored review pack
    </button>
    <input id="pack-file" type="file" accept=".json,application/json" hidden />
    <p class="muted">
      Supported private safe-stationary format only · 1 MiB maximum · up to 24
      declared cards and four supported module identities. JSON stays local.
      Browser data removal can lose the stored pack; keep a download. Notebook
      backups use a separate format and are not accepted here.
    </p>
  </section>
  <section id="pack-preview" hidden aria-label="Import preview">
    <h3 id="pack-preview-heading" tabindex="-1"></h3>
    <p id="pack-preview-meta"></p>
    <p id="pack-conflict-summary"></p>
    <button id="export-before-replace" class="secondary" hidden>
      Download current pack before replacing
    </button>
    <button id="cancel-pack" class="secondary">
      Cancel · keep current pack
    </button>
    <div id="pack-preview-cards"></div>
    <label id="pack-replace-confirmation" class="done-with-note" hidden
      ><input id="pack-replace-ack" type="checkbox" /> I understand this
      replaces only the stored review pack. My notebook and original guide are
      kept.</label
    >
    <button id="cancel-pack-bottom" class="secondary">
      Cancel · keep current pack
    </button>
    <button id="confirm-pack" class="primary">Keep review pack locally</button>
  </section>
</dialog>

<dialog id="remove-pack-dialog" aria-labelledby="remove-pack-title">
  <h2 id="remove-pack-title">Remove this stored review pack?</h2>
  <p id="remove-pack-detail"></p>
  <p>
    Your notebook, original guide, saved activity and model downloads stay.
    Download the pack first if you want a copy.
  </p>
  <label
    ><input type="checkbox" id="remove-pack-ack" /> I want to remove this one
    stored review pack.</label
  >
  <p id="remove-pack-status" role="status"></p>
  <button id="cancel-remove-pack" class="secondary" type="button">
    Keep stored pack</button
  ><button id="confirm-remove-pack" class="primary" type="button" disabled>
    Remove stored pack
  </button>
</dialog>
<dialog id="rescue-pack-dialog" aria-labelledby="rescue-pack-title">
  <h2 id="rescue-pack-title">Keep an unverified raw pack copy</h2>
  <p>
    This contains literal stored text, which may include private words. It is
    not a supported import or approved activity. No data is repaired, uploaded
    or removed.
  </p>
  <textarea
    id="rescue-pack-text"
    readonly
    aria-label="Unverified stored pack text"
  ></textarea>
  <label
    ><input type="checkbox" id="rescue-pack-ack" /> I want a local unverified
    text copy.</label
  >
  <p id="rescue-pack-status" role="status"></p>
  <button id="cancel-rescue-pack" class="secondary" type="button">Cancel</button
  ><button id="download-rescue-pack" class="primary" type="button" disabled>
    Request raw pack download
  </button>
</dialog>

<dialog id="card-text-dialog" aria-labelledby="card-text-title">
  <div class="dialog-heading">
    <h2 id="card-text-title">Your pocket card as text</h2>
    <button
      id="close-card-text"
      class="text-button"
      aria-label="Close card text"
    >
      Close
    </button>
  </div>
  <label for="card-text">Full steps, cues and safety notes</label>
  <textarea id="card-text" readonly spellcheck="false"></textarea>
  <button id="copy-card-text" class="secondary">Copy text</button>
  <button id="download-card-text" class="text-button" type="button">
    Download this card as TXT
  </button>
  <button id="native-share-card" class="text-button" type="button">
    Open device share chooser
  </button>
  <p id="card-text-status" role="status">
    You can also select this text and copy it yourself.
  </p>
</dialog>
<dialog id="feedback-choice" aria-labelledby="feedback-choice-title">
  <h2 id="feedback-choice-title">What doesn’t fit?</h2>
  <p id="feedback-card-title"></p>
  <label for="feedback-reason">Optional reason</label>
  <select id="feedback-reason">
    <option value="other">Not my kind of observation</option>
    <option value="environment">Not available around me</option>
    <option value="movement">This action is not comfortable here</option>
    <option value="recent">I already did this recently</option>
  </select>
  <p id="feedback-scope" role="status"></p>
  <div class="output-actions">
    <button id="cancel-feedback-choice" class="text-button" type="button">
      Cancel</button
    ><button id="confirm-feedback-choice" class="secondary" type="button">
      Set family aside
    </button>
  </div>
</dialog>
<dialog id="selected-notes-dialog" aria-labelledby="selected-notes-title">
  <h2 id="selected-notes-title">Your selected discoveries.</h2>
  <p>Private words, deliberately chosen. No automatic sharing.</p>
  <label for="selected-note-text">Exact readable preview</label
  ><textarea id="selected-note-text" readonly spellcheck="false"></textarea>
  <div class="output-actions">
    <button id="close-selected-notes" class="text-button" type="button">
      Close preview</button
    ><button id="download-selected-notes" class="secondary" type="button">
      Download selected TXT</button
    ><button id="print-selected-notes" class="text-button" type="button">
      Print selected private notes
    </button>
  </div>
  <p id="selected-output-status" role="status"></p>
</dialog>
<dialog
  id="appearance-dialog"
  aria-labelledby="appearance-title"
  aria-describedby="appearance-intro"
>
  <div class="dialog-tools">
    <button
      class="dialog-close"
      id="appearance-close"
      type="button"
      aria-label="Close appearance"
    >
      ×
    </button>
  </div>
  <p class="eyebrow">A LITTLE CHANGE OF SCENERY</p>
  <h2 id="appearance-title">Appearance</h2>
  <p id="appearance-intro">Find your kind of paper.</p>
  <fieldset class="appearance-choices">
    <legend>Colour theme</legend>
    <div class="appearance-options">
      <label class="appearance-option"
        ><input
          type="radio"
          name="appearance-theme"
          value="forest"
          checked
        /><span
          class="appearance-swatch swatch-forest"
          aria-hidden="true"
        ></span
        ><span><b>Forest</b><small>Cream paper</small></span
        ><span class="appearance-check" aria-hidden="true">✓</span></label
      >
      <label class="appearance-option"
        ><input type="radio" name="appearance-theme" value="tidal" /><span
          class="appearance-swatch swatch-tidal"
          aria-hidden="true"
        ></span
        ><span><b>Tidal</b><small>Mist blue</small></span
        ><span class="appearance-check" aria-hidden="true">✓</span></label
      >
      <label class="appearance-option"
        ><input type="radio" name="appearance-theme" value="clay" /><span
          class="appearance-swatch swatch-clay"
          aria-hidden="true"
        ></span
        ><span><b>Clay</b><small>Warm earth</small></span
        ><span class="appearance-check" aria-hidden="true">✓</span></label
      >
    </div>
  </fieldset>
  <label class="appearance-depth-control"
    ><input
      type="checkbox"
      id="appearance-depth"
      aria-describedby="appearance-depth-hint appearance-status"
    /><span
      ><b>3D cards</b
      ><small id="appearance-depth-hint"
        >A little paper depth, only when you interact.</small
      ></span
    ></label
  >
  <button
    class="appearance-specimen"
    type="button"
    aria-label="Try paper depth preview"
  >
    <span class="specimen-meta">PAPER STUDY</span
    ><span>A small reason<br />to look up.</span
    ><span class="specimen-corner" aria-hidden="true">↗</span>
  </button>
  <p id="appearance-status" role="status"></p>
  <p
    id="appearance-storage-status"
    class="appearance-storage-status"
    role="status"
  ></p>
</dialog>
`,Qo=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 400" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="specimen-sky" x2="0" y2="400" gradientUnits="userSpaceOnUse"><stop stop-color="#d2e1de"/><stop offset="1" stop-color="#eeeee1"/></linearGradient>
    <linearGradient id="specimen-rim" x1="260" y1="40" x2="546" y2="316" gradientUnits="userSpaceOnUse"><stop stop-color="#fff"/><stop offset=".36" stop-color="#b7c9bd"/><stop offset=".55" stop-color="#fffef4"/><stop offset=".78" stop-color="#8ba99b"/><stop offset="1" stop-color="#eef6e9"/></linearGradient>
    <radialGradient id="specimen-glass"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".72" stop-color="#fff" stop-opacity=".07"/><stop offset=".95" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#f0fffc" stop-opacity=".65"/></radialGradient>
    <clipPath id="specimen-lens"><circle cx="420" cy="165" r="127"/></clipPath>
  </defs>
  <path d="M40 354C189 319 324 350 484 363" stroke="#688d7b" stroke-opacity=".15" stroke-width="22" stroke-linecap="round"/>
  <g transform="rotate(-8 307 208)">
    <rect x="167" y="83" width="307" height="253" rx="6" fill="#b7c2ac"/>
    <rect x="159" y="70" width="307" height="253" rx="6" fill="#e7e4d3" stroke="#c2bfae"/>
    <rect x="151" y="57" width="307" height="253" rx="6" fill="#faf8ee" stroke="#c8c7b8"/>
    <path d="M172 76h122M172 87h76M172 273h260M172 285h119" stroke="#b7b6a4" stroke-width="1"/>
    <path d="M215 269C249 209 285 149 317 114" stroke="#425d46" stroke-width="3"/>
    <path d="M245 219C195 216 193 169 211 169C241 171 248 201 245 219Z" fill="#698a57"/>
    <path d="M263 188C279 153 329 160 319 181C303 202 279 200 263 188Z" fill="#90a878"/>
    <path d="M283 156C251 146 263 107 277 111C292 119 300 140 283 156Z" fill="#4d7153"/>
    <path d="M236 232C259 210 300 215 293 234C278 259 248 251 236 232Z" fill="#a4b482"/>
    <path d="M309 125C307 91 336 76 341 91C345 108 329 125 309 125Z" fill="#758e63"/>
  </g>
  <circle cx="422" cy="173" r="139" fill="#314e43" fill-opacity=".10"/>
  <circle cx="420" cy="165" r="139" fill="url(#specimen-rim)" stroke="#fffef4" stroke-width="2"/>
  <g clip-path="url(#specimen-lens)">
    <path d="M293 38h254v254H293z" fill="url(#specimen-sky)"/>
    <path d="M292 222C355 182 402 221 449 187C487 161 515 195 554 182V312H292Z" fill="#a7b7a0"/>
    <path d="M289 255C381 223 418 255 459 225C494 201 526 225 552 218V312H289Z" fill="#6d8c70"/>
    <path d="M355 325C388 239 416 167 442 101" stroke="#294c3a" stroke-width="4"/>
    <path d="M397 218C350 206 346 158 364 154C392 157 404 193 397 218Z" fill="#345f46"/>
    <path d="M415 176C448 135 493 141 484 169C471 198 434 195 415 176Z" fill="#9eae72"/>
    <path d="M433 128C407 103 410 65 427 72C449 78 451 104 433 128Z" fill="#678855"/>
    <path d="M392 240C419 209 470 211 461 237C440 266 413 258 392 240Z" fill="#c0c18b"/>
    <path d="M453 80C453 59 467 45 476 53C483 68 470 86 453 80Z" fill="#698257"/>
    <path d="M398 217L365 160M416 176L476 163M392 240L450 232" stroke="#d8ddaf" stroke-opacity=".55"/>
    <circle cx="420" cy="165" r="127" fill="url(#specimen-glass)"/>
    <path d="M322 101C345 62 381 45 419 47" stroke="#fffef4" stroke-opacity=".75" stroke-width="4" stroke-linecap="round"/>
    <path d="M461 276C506 257 531 218 534 180" stroke="#fffef4" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>
  </g>
  <circle cx="420" cy="165" r="128" stroke="#4c7464" stroke-opacity=".25"/>
  <path d="M332 280L285 345" stroke="#e8ede4" stroke-width="18" stroke-linecap="round"/>
  <path d="M330 280L283 345" stroke="#fffdf3" stroke-width="10" stroke-linecap="round"/>
  <path d="M43 89h40M63 69v40M557 333h24M569 321v24" stroke="#879584" stroke-width="1"/>
  <circle cx="81" cy="329" r="4" fill="#b7754d"/>
  <path d="M46 302l27-7M55 316l17-8" stroke="#728968" stroke-width="2"/>
</svg>
`;function ea(t){const e=c=>document.getElementById(c);let n={kind:"empty",raw:null},a=null,s=null,r=null,p=null;const d=()=>{if(n.kind!=="valid")return;const c=n.trip;return H.find(v=>v.id===c.taskId&&v.version===c.taskVersion)},l=c=>n.kind==="valid"&&n.trip.taskId===c.id&&n.trip.taskVersion===c.version,u=()=>{try{return Lo(localStorage)}catch{return{kind:"unreadable"}}},f=(c,v)=>{try{return Ro(localStorage,c,v?{schema:1,token:crypto.randomUUID(),taskId:v.id,taskVersion:v.version}:null)}catch{return"failed"}};function m(c){e("trip-message").textContent=c,e("trip-start-status").textContent=c,t.announce(c)}function b(){const c=e("active-trip");c.hidden=n.kind==="empty";const v=d();e("active-trip-title").textContent=v?v.title:n.kind==="unreadable"?"Trip recovery is unavailable in this browser.":"The kept trip is unavailable in this guide.",e("trip-resume").disabled=!v,e("trip-record").disabled=!v,e("trip-finish").disabled=n.kind==="unreadable";const A=e("start-trip");A.disabled=!a||n.kind==="invalid"||n.kind==="unreadable"||n.kind==="valid"&&!v||!!a&&l(a),A.textContent=a&&l(a)?"This trip is kept for your return ✓":"Start this trip · keep it locally",c.hidden&&c.contains(document.activeElement)&&t.focusHome()}function h(){const c=e("trip-replace").contains(document.activeElement)||e("trip-finish-confirmation").contains(document.activeElement);if(n=u(),s=null,r=null,e("trip-replace").hidden=!0,e("trip-finish-confirmation").hidden=!0,b(),c)if(e("departure").open){const v=e("start-trip");(v.disabled?e("back"):v).focus()}else!e("active-trip").hidden&&!e("trip-finish").disabled?e("trip-finish").focus():t.focusHome()}function E(c,v){if(t.hasDraft()){m("Your unsaved discovery was kept. Save or discard it before starting another trip.");return}const A=f(v,c);h(),m(A==="saved"?"Trip kept on this browser for your return. Nothing is marked done. You can put your phone away.":A==="changed"?"Your kept trip changed in another tab. Review it before trying again; nothing was replaced.":"The trip could not be kept or verified in storage. This card is still available in this tab; retry or use it without starting."),A==="saved"&&e("back").focus()}return e("start-trip").onclick=()=>{if(!a)return;const c=n;if(n=u(),b(),n.kind==="unreadable"||n.kind==="invalid"||n.kind==="valid"&&!d()){m("Stored trip data could not be used. It was preserved; explicitly finish that kept trip before starting a new one.");return}if(!l(a)){if(c.kind!=="unreadable"&&c.raw!==n.raw){m("Your kept trip changed. Review the current card and try again; nothing was replaced.");return}n.kind==="valid"?(s={card:a,raw:n.raw},e("trip-replace-text").textContent=`Replace “${d().title}” with “${a.title}”? Existing discoveries and saved cards stay.`,e("trip-replace").hidden=!1,e("trip-replace-confirm").focus()):E(a,null)}},e("trip-replace-confirm").onclick=()=>{if(s){const c=s;s=null,E(c.card,c.raw)}},e("trip-replace-cancel").onclick=()=>{s=null,e("trip-replace").hidden=!0,e("start-trip").focus()},e("trip-resume").onclick=()=>{h();const c=d();c&&t.openCard(c)},e("trip-record").onclick=()=>{if(h(),t.hasDraft()){t.resumeDraft();return}const c=d();c&&(t.openCard(c),t.openNote(c))},e("trip-finish").onclick=()=>{n=u(),b(),!(n.kind==="unreadable"||n.kind==="empty")&&(r=n.raw,e("trip-finish-confirmation").hidden=!1,e("trip-finish-confirm").focus())},e("trip-finish-cancel").onclick=()=>{r=null,e("trip-finish-confirmation").hidden=!0,e("trip-finish").focus()},e("trip-finish-confirm").onclick=()=>{if(r===null)return;const c=r;r=null;const v=f(c,null);h(),m(v==="saved"?"Trip finished on this browser. No discovery or completion was recorded; your saved cards and existing notes stay.":v==="changed"?"A newer kept trip was preserved. Review it before finishing.":"The trip could not be finished or verified in storage. Your kept trip and discoveries were not intentionally replaced; retry when storage is available."),v==="saved"&&t.focusHome()},window.addEventListener("storage",c=>{if(!(c.key!==xn&&c.key!==null)){try{if(c.storageArea&&c.storageArea!==localStorage)return}catch{}h()}}),h(),{refresh:h,prepare:c=>{a=c,h(),e("trip-start-status").textContent=n.kind==="valid"&&l(c)?"This card is already kept on this browser.":n.kind==="invalid"||n.kind==="unreadable"||n.kind==="valid"&&!d()?"Stored trip data is unavailable. It has not been replaced.":"Start keeps only this card identity locally. No intent, location, timer or completion is stored."},newDraft:(c,v,A)=>{n=u(),p=n.kind==="valid"&&l(v)&&(A===void 0||A===n.raw&&$o(A).kind==="valid")?{id:c,raw:n.raw}:null},saved:(c,v,A)=>{if(A||p?.id!==c)return;const q=p.raw;p=null;const ee=f(q,null);if(h(),ee==="saved")return m("Discovery saved and this trip finished. Your separate saved card stays."),"This trip is finished.";if(ee==="changed")return"A different or newer kept trip was left unchanged.";const w="Your discovery is saved, but finishing the trip could not be verified. You do not need to save the discovery again."+(n.kind==="valid"||n.kind==="invalid"?" Use Finish trip to retry removing the remaining kept trip.":"");return m(w),w}}}const no=["forest","tidal","clay"],ht="pft-appearance",dn=()=>({version:1,theme:"forest",depth:!1});function ln(t){if(!t||t.length>1024)return dn();try{const e=JSON.parse(t);return!e||typeof e!="object"||Array.isArray(e)||e.version!==1||!no.includes(e.theme)||typeof e.depth!="boolean"?dn():{version:1,theme:e.theme,depth:e.depth}}catch{return dn()}}function Kn(t,e){return t.depth&&!e.reducedMotion&&!e.simpleEffects&&!e.hidden&&!e.saveData}const mn=new WeakMap,wt=new Set;let he;const ta="cubic-bezier(.22,.68,.25,1)",Kt=()=>document.hidden||document.documentElement.dataset.motion==="reduced"||document.documentElement.dataset.effects==="simple"||matchMedia("(prefers-reduced-motion: reduce)").matches||!!navigator.connection?.saveData;function na(){const t=()=>{if(document.documentElement.dataset.pageVisibility=document.hidden?"hidden":"visible",document.hidden){he?.disconnect(),he=void 0;for(const n of wt)n.cancel()}};t(),document.addEventListener("visibilitychange",t);const e=()=>{if(Kt()){he?.disconnect(),he=void 0;for(const n of[...wt])n.cancel()}};matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change",e),navigator.connection?.addEventListener?.("change",e),new MutationObserver(e).observe(document.documentElement,{attributes:!0,attributeFilter:["data-effects","data-motion","data-page-visibility"]})}function xt(t){mn.get(t)?.cancel()}function oa(){for(const t of wt)t.effect.getKeyframes().some(n=>typeof n.rotate=="string"&&n.rotate!=="none")&&t.cancel()}function ve(t,e,n=420,a=0){const s=mn.get(t),r={...e};if(s?.playState==="running"||s?.pending){const u=getComputedStyle(t),f=s.effect.getKeyframes()[0];for(const m of["opacity","translate","scale","rotate"])m in f&&(r[m]=u.getPropertyValue(m));for(const m of Object.keys(e))r[m]=u.getPropertyValue(m)}if(document.documentElement.dataset.depth!=="on"&&delete r.rotate,s?.cancel(),Kt())return;const p={};for(const u of Object.keys(r))p[u]=u==="opacity"||u==="scale"?"1":u==="rotate"?"none":"0 0";const d=t.animate([r,p],{duration:n,delay:a,easing:ta,fill:"backwards",iterations:1});mn.set(t,d),wt.add(d);const l=()=>wt.delete(d);d.addEventListener("finish",l,{once:!0}),d.addEventListener("cancel",l,{once:!0})}function aa(){he?.disconnect(),he=void 0;const t=document.querySelector("#trip-card");if(!t||Kt())return;const e=()=>{ve(t,{opacity:.97,translate:"0 8px",rotate:"1 0 0 1.6deg"},460);const a=document.querySelector(".pocket-strip");a&&ve(a,{translate:"0 3px"},300,60);const s=document.querySelector("#result .departure");s&&ve(s,{translate:"0 5px",rotate:"1 0 0 .8deg"},400,35)},n=t.getBoundingClientRect();if(n.top<innerHeight-64&&n.bottom>0)e();else{const a=new IntersectionObserver(s=>{he===a&&s.some(r=>r.isIntersecting)&&(a.disconnect(),he=void 0,e())},{threshold:.12,rootMargin:"0px 0px -64px 0px"});he=a,a.observe(t)}}function sa(){const t=document.getElementById("refinement-summary");t&&ve(t,{opacity:.9,translate:"0 3px"},260)}function ra(t,e){if(he?.disconnect(),he=void 0,xt(t),Kt())return;const n=t.getBoundingClientRect();if(n.top>=innerHeight-64||n.bottom<=0)return;const a=e.left-n.left,s=e.top-n.top;Math.abs(a)<1&&Math.abs(s)<1||ve(t,{translate:`${a}px ${s}px`},380)}function un(t,e=!1){t.dataset.retirement=e?"saved":"closed",t.close()}function ia(){for(const[t,e]of[".hero",".time-card",".nearby-card",".intent-card"].entries()){const n=document.querySelector(e);n&&ve(n,{opacity:.94,translate:"0 6px"},460,t*25)}}function ca(){const t=document.documentElement,e=document.getElementById("appearance-open"),n=document.getElementById("appearance-dialog"),a=document.getElementById("appearance-depth"),s=document.getElementById("appearance-status"),r=document.getElementById("appearance-storage-status"),p=matchMedia("(prefers-reduced-motion: reduce)"),d=navigator.connection;let l=ln(null),u=!0;try{l=ln(localStorage.getItem(ht))}catch{u=!1}const f=new Set,m=()=>{for(const c of f)delete c.dataset.depthPress;f.clear()},b=()=>({reducedMotion:p.matches||t.dataset.motion==="reduced",simpleEffects:t.dataset.effects==="simple",hidden:document.hidden||t.dataset.pageVisibility==="hidden",saveData:!!d?.saveData}),h=()=>{const c=b(),v=Kn(l,c);t.dataset.theme=l.theme,t.dataset.depth=v?"on":"off",a.checked=l.depth;for(const A of n.querySelectorAll('input[name="appearance-theme"]'))A.checked=A.value===l.theme;v||(m(),oa()),s.textContent=l.depth?c.hidden?"3D is paused while this tab is hidden.":c.saveData?"Data saver is on. 3D stays flat.":c.reducedMotion?"Reduced motion is on. 3D stays flat.":c.simpleEffects?"Your device is using simpler effects. 3D stays flat.":"Paper lifts when you interact. Still while you read.":"Flat paper. A quiet place to read.",r.textContent=u?"Choices stay on this browser.":"For this tab. Browser storage is unavailable.",e.title=`Appearance · ${l.theme==="forest"?"Forest":l.theme==="tidal"?"Tidal":"Clay"}${l.depth?" · 3D selected":""}`},E=()=>{const c=JSON.stringify(l);try{localStorage.setItem(ht,c),u=localStorage.getItem(ht)===c}catch{u=!1}h()};e.addEventListener("click",()=>{n.showModal(),e.setAttribute("aria-expanded","true"),n.querySelector('input[name="appearance-theme"]:checked')?.focus()}),document.getElementById("appearance-close").addEventListener("click",()=>n.close()),n.addEventListener("close",()=>{m(),e.setAttribute("aria-expanded","false"),e.focus({preventScroll:!0})}),n.addEventListener("change",c=>{const v=c.target;if(v instanceof HTMLInputElement){if(v.name==="appearance-theme"&&no.includes(v.value))l={...l,theme:v.value};else if(v===a)l={...l,depth:a.checked};else return;E()}}),window.addEventListener("storage",c=>{if(!(c.key!==ht&&c.key!==null)){try{if(c.storageArea&&c.storageArea!==localStorage)return;l=ln(localStorage.getItem(ht)),u=!0}catch{u=!1}h()}}),document.addEventListener("pointerdown",c=>{if(!c.isPrimary||c.button!==0||!Kn(l,b()))return;const v=c.target instanceof Element?c.target:null,A=v?.closest(".sample-card, .compose-preview, .discovery-note, .pack-preview-card, .comparison-note, .appearance-specimen");!A||v?.closest("input, textarea, select, .discovery-actions")||(A.dataset.depthPress="true",f.add(A))});for(const c of["pointerup","pointercancel","lostpointercapture"])document.addEventListener(c,m,!0);document.addEventListener("scroll",m,!0),document.addEventListener("keydown",c=>{c.key==="Escape"&&m()}),window.addEventListener("blur",m),document.addEventListener("visibilitychange",h),p.addEventListener("change",h),d?.addEventListener("change",h),new MutationObserver(h).observe(t,{attributes:!0,attributeFilter:["data-motion","data-effects","data-page-visibility"]}),h()}function da(t){const e=u=>document.getElementById(u),n=e("compose-lens"),a=e("compose-action"),s=e("compose-trace"),r=e("compose-open"),p=()=>({lens:n.value,action:a.value,constraint:"safe-one-spot",trace:s.value}),d=()=>{const u=Yn(p());r.disabled=!u.allowed;for(const f of e("compose-presets").querySelectorAll("button"))f.setAttribute("aria-pressed",String(f.dataset.cardId===u.id));if(e("compose-preview").hidden=!u.allowed,e("compose-alternatives").hidden=u.allowed,e("compose-alternatives").replaceChildren(),u.allowed){const f=jn(p());e("compose-preview-title").textContent=f.title,e("compose-preview-steps").replaceChildren(...f.steps.map(m=>{const b=document.createElement("li");return b.textContent=m,b})),e("compose-preview-trace").textContent=f.prompt,e("compose-receipt").textContent=u.reason+" "+f.composition.receipt+" Source review: "+f.composition.reviewId+". "+f.composition.explanation+" Manual reviewed assembly; no AI generation.",ve(e("compose-preview"),{opacity:.96,translate:"0 4px"},240)}else for(const f of qn.filter(m=>m.lens===n.value))e("compose-alternatives").append(l(f,"Use reviewed alternative: "));e("compose-status").textContent=u.allowed?`${jn(p()).title} · reviewed, no AI.`:`${u.reason} No card will open for this combination.`};function l(u,f=""){const m=document.createElement("button");return m.type="button",m.className="text-button",m.textContent=f+u.title,m.dataset.cardId=u.id,m.setAttribute("aria-pressed","false"),m.onclick=()=>{n.value=u.lens,a.value=u.action,s.value=u.trace,d(),m.isConnected||e("compose-open").focus()},m}e("compose-presets").replaceChildren(...qn.map(u=>l(u)));for(const u of[n,a,s])u.addEventListener("change",d);r.onclick=()=>{const u=Yn(p());if(!u.allowed)return d();const f=H.find(m=>m.id===u.id);if(!f){r.disabled=!0,e("compose-status").textContent="This reviewed card is unavailable in the current guide. Nothing was selected.";return}e("guide").close(),t(f)},d()}function la(t,e,n){const a=l=>document.getElementById(l),s=a("feedback-choice"),r=a("feedback-reason");let p="";function d(){const l=r.value==="recent"?"Mark this family recently done. It enters the normal three-family cooldown; it is not permanently set aside.":r.value==="environment"||r.value==="movement"?"Open the field guide to choose a different activity. No persistent preference is changed. Adjust your explicit conditions yourself.":"Set this content family aside until you undo or clear preferences. Every sibling shares this choice; model scores stay unchanged.";a("feedback-scope").textContent="Content family: "+(t()?.family||"unknown")+". "+l+" The reason is not saved or used to infer health or location.",a("confirm-feedback-choice").textContent=r.value==="recent"?"Mark recently done":["environment","movement"].includes(r.value)?"Choose another activity":"Set family aside"}return a("cancel-feedback-choice").onclick=()=>s.close(),r.onchange=d,a("confirm-feedback-choice").onclick=()=>{const l=t();if(!s.open||l?.id!==p){s.close();return}const u=r.value;s.close(),["environment","movement"].includes(u)?n():e(p,u==="recent"?"done":"skipped")},l=>{p=l.id,r.value="other",a("feedback-card-title").textContent=l.title,d(),s.showModal(),r.focus()}}let jt=null;class oo extends Error{}function U(t,e,n){const a=document.createElement(e);return a.textContent=n,t.append(a),a}function ze(){jt=null,document.getElementById("print-pack-sheet")?.remove()}function ao(t){let e=document.getElementById("print-pack-sheet");e||(e=document.createElement("section"),e.id="print-pack-sheet",e.setAttribute("aria-hidden","true"),document.body.append(e)),e.replaceChildren(...t)}function ua(t){window.addEventListener("beforeprint",()=>ao(jt??t())),window.addEventListener("afterprint",ze)}function so(t){if(document.readyState!=="complete")throw ze(),new oo("The page is still loading.");jt=t,ao(t);try{window.print()}catch(e){throw ze(),e}finally{jt=null}}function Vn(t){const e=document.createElement("article");if(e.className="printed-field-card printed-current-card",U(e,"p","POCKET FIELD TRIP / TAKE ONE CARD OUTSIDE"),!t)return U(e,"h1","Choose a field note first."),U(e,"p","Open the field guide or match a trip, then choose Print this card. No notebook records are printed."),[e];const{card:n}=t;U(e,"h1",n.title),U(e,"p",`${n.minutes} min · ${n.still?"One spot":"A gentle walk"}`),U(e,"p",n.subtitle),U(e,"p",t.safety),U(e,"p",t.fit),t.warning&&(U(e,"p",t.warning).className="printed-fit-warning");const a=document.createElement("ol");return n.steps.forEach(s=>U(a,"li",s)),e.append(a),U(e,"h2","Three cues. Then the world."),U(e,"p",Tt[n.id].join(" / ")),U(e,"p",n.takeaway),U(e,"h2","One thing you noticed"),U(e,"p",n.prompt),U(e,"p","________________________________________________"),U(e,"p","Leave things as you found them."),U(e,"footer",`${t.match}
${t.caution}
${n.id} / ${n.version} · authored field note · private candidate; publication pending`),[e]}function pa(t){const e=document.getElementById("card-print-status");ua(()=>Vn(t())),document.getElementById("print-card").onclick=()=>{const n=t();if(n){e.textContent="Print preview requested for this card only. Check the preview; choose your printer or Save as PDF yourself. Notebook records are excluded.";try{so(Vn(n))}catch(a){e.textContent=a instanceof oo?"The page is still loading. Try printing again once it finishes, or use Take this card as text.":"Print could not open. Use Take this card as text to copy or download the full instructions.",document.getElementById("share-card").focus()}}}}function fa(){const t=navigator,e=matchMedia("(prefers-reduced-transparency: reduce)"),n=()=>{const a=e.matches||!!t.connection?.saveData||/^(slow-)?2g$/.test(t.connection?.effectiveType||"")||typeof t.deviceMemory=="number"&&t.deviceMemory<=4||t.hardwareConcurrency>0&&t.hardwareConcurrency<=4;document.documentElement.dataset.effects=a?"simple":"full"};n(),e.addEventListener("change",n),t.connection?.addEventListener?.("change",n)}function bn(t){ve(t,{scale:".99"},180)}function Ge(t,e,n="text/plain;charset=utf-8"){const a=URL.createObjectURL(new Blob([e],{type:n}));let s,r=!1;try{s=document.createElement("a"),s.href=a,s.download=t,document.body.append(s),s.click(),r=!0}finally{s?.remove(),r?setTimeout(()=>URL.revokeObjectURL(a),1e3):URL.revokeObjectURL(a)}}const ha="pocket-field-trip-unverified-raw-notebook",Hn=2*1024*1024;class Ze extends Error{problem;constructor(e){super(e),this.problem=e}}function ma(t){let e;try{e=t()}catch{throw new Ze("read-failed")}if(e===null)throw new Ze("not-found");return e}function ba(t,e,n=!1){if(t.length>Hn)throw new Ze("too-large");const a=JSON.stringify({format:n?"pocket-field-trip-unverified-raw-card-pack":ha,version:1,status:"unverified-not-a-restorable-backup",storageKey:n?"pft-card-pack-review-v1":be,capturedAt:e,raw:t},null,2)+`
`,s=new TextEncoder().encode(a).byteLength;if(s>Hn)throw new Ze("too-large");return{raw:t,text:a,bytes:s,filename:`pocket-field-trip-UNVERIFIED-${n?"card-pack":"raw-rescue"}-${e.slice(0,10)}.txt`}}const va={"read-failed":"Storage could not be read. Nothing exported; try again later. / 暂时无法读取存储，未导出，请稍后重试。","not-found":"No stored notebook was found. Nothing exported. / 未找到已存笔记，未导出。","too-large":"Rescue file exceeds 2 MiB. Nothing was shortened or exported; original data stays here. / 救援文件超过 2 MiB，未截断或导出，原数据仍保留。",changed:"Stored data changed. Cancel and prepare a fresh copy; nothing exported. / 存储数据已变化，请取消后重新准备，未导出。","download-failed":"Download could not start. Original data stays here; retry or cancel. / 无法开始下载，原数据仍保留，可重试或取消。"};function ya(t){const e=b=>document.getElementById(b),n=e("raw-rescue-panel"),a=e("notebook"),s=e("raw-rescue-dialog"),r=e("prepare-raw-rescue"),p=e("download-raw-rescue");let d=null;const l=b=>{e("raw-rescue-status").textContent=b},u=b=>va[b instanceof Ze?b.problem:"download-failed"];function f(){n.hidden=t.readable()}e("notebook-open").addEventListener("click",f),f(),r.onclick=()=>{if(f(),!(t.readable()||s.open||d))try{d=ba(t.readRaw(),new Date().toISOString()),e("raw-rescue-file-name").textContent=`${d.filename} · ${d.bytes.toLocaleString()} bytes`,e("raw-rescue-error").textContent="",p.disabled=!1,a.close(),s.showModal(),e("cancel-raw-rescue").focus()}catch(b){d=null,l(u(b))}};function m(){l("Rescue cancelled. Original data stays here. / 已取消救援，原数据仍保留。"),s.close()}e("cancel-raw-rescue").onclick=m,s.addEventListener("cancel",b=>{b.preventDefault(),m()}),s.addEventListener("close",()=>{d=null,p.disabled=!0,a.open||a.showModal(),r.focus()}),p.onclick=()=>{if(!d||p.disabled||!s.open)return;p.disabled=!0;let b=null,h=null;try{if(t.readRaw()!==d.raw)throw d=null,new Ze("changed");b=URL.createObjectURL(new Blob([d.text],{type:"text/plain;charset=utf-8"})),h=document.createElement("a"),h.href=b,h.download=d.filename,document.body.append(h),h.click(),d=null,l("Download requested, not confirmed saved. Check your browser/system save result. Original data is unchanged. / 已请求下载，尚未确认保存；请检查浏览器或系统结果，原数据未变。"),s.close()}catch(E){e("raw-rescue-error").textContent=u(E),p.disabled=!d}finally{if(h?.remove(),b){const E=b;setTimeout(()=>URL.revokeObjectURL(E),1e3)}}}}function ro(t,...e){const n=t.normalize("NFC").trim().toLowerCase();return!n||e.some(a=>a.normalize("NFC").toLowerCase().includes(n))}function ga(t,e){return t.filter(n=>ro(e,n.title,n.subtitle,...n.tags,...n.steps,...n.cues||Tt[n.id]||[],n.prompt))}function ka(t,e){return t.filter(n=>ro(e,n.text,n.task.title,...n.tags,Re(n.scene),Ot[n.task.lens]))}function io(t,e){return t.map((n,a)=>({note:n,index:a,time:Date.parse(e==="edited"?n.updatedAt:n.createdAt)})).sort((n,a)=>(n.time-a.time)*(e==="oldest"?1:-1)||n.index-a.index).map(({note:n})=>n)}function wa(t,e,n){return[t.title,t.subtitle,`${t.minutes} min · ${t.still?"One spot":"A gentle walk"}`,"Steps",...t.steps.map((a,s)=>`${s+1}. ${a}`),"Pocket cues",...e.map((a,s)=>`${s+1}. ${a}`),t.takeaway,...n].join(`

`)}function xa(t,e){const n=u=>({done:[...u.done],skipped:[...u.skipped]}),a=(u,f)=>JSON.stringify(u)===JSON.stringify(f);if(a(t,e.after)||a(t,e.before))return n(e.before);const s=(u,f)=>[u.done.filter(m=>X(m)===f),u.skipped.filter(m=>X(m)===f)],r=new Set([...e.before.done,...e.before.skipped,...e.after.done,...e.after.skipped].map(X)),p=new Set([...r].filter(u=>!a(s(e.before,u),s(e.after,u))));for(const u of p)if(!a(s(t,u),s(e.after,u))&&!a(s(t,u),s(e.before,u)))return null;const d=u=>[...t[u].filter(f=>!p.has(X(f))),...e.before[u].filter(f=>p.has(X(f)))],l=d("done");return l.length>3?null:(l.sort((u,f)=>{const m=e.before.done.indexOf(u),b=e.before.done.indexOf(f);return(m<0?-1:m)-(b<0?-1:b)}),{done:l,skipped:d("skipped")})}const B=()=>navigator.userAgent.includes("PocketFieldTripApp/0.3.0");function Ca(){if(!B())return;document.documentElement.dataset.androidApp="true";let t="explore";document.documentElement.dataset.appSection=t;const e=h=>document.getElementById(h),n=document.createElement("section");n.id="android-empty-trip",n.innerHTML='<p class="eyebrow">YOUR POCKET CARD</p><h2>A small trip awaits.</h2><p>Choose an authored card or match your words in Explore. Start keeps its identity here for your return.</p><button type="button" class="primary">Choose a card</button>',e("result").before(n),n.querySelector("button").onclick=()=>l("explore");let a="explore";const s=()=>(e("notebook").open&&t!=="notebook"&&(a=t,t="notebook",document.documentElement.dataset.appSection=t),{section:t,modal:!!document.querySelector("dialog[open]:modal"),theme:document.documentElement.dataset.theme||"forest"}),r=()=>window.__pftNativeSend?.({type:"shell",...s()}),p=()=>Array.from(document.querySelectorAll("dialog[open]")).filter(h=>h.matches(":modal")).at(-1),d=()=>{const h=p();return h?(h.dispatchEvent(new Event("cancel",{cancelable:!0}))&&h.close(),!0):!1},l=h=>{if(!["explore","trip","notebook"].includes(h)||p())return!1;const E=e("notebook");if(E.open&&h!=="notebook"&&E.close(),h==="notebook"&&t!=="notebook"&&(a=t),t=h,document.documentElement.dataset.appSection=t,h==="notebook")e("notebook-open").click();else if(h==="trip"){const c=e("active-trip").hidden?e("result").hidden?e("android-empty-trip"):e("result"):e("active-trip");c.scrollIntoView({block:"start",behavior:"instant"}),(c.matches("button")?c:c.querySelector("button:not(:disabled)"))?.focus({preventScroll:!0})}else window.scrollTo({top:0,behavior:"instant"}),e("sample-open").focus({preventScroll:!0});return r(),!0};window.PocketAndroid={navigate:l,state:s,back:()=>{if(d())return!0;const h=e("notebook");return h.open?(h.close(),!0):t!=="explore"?l("explore"):!1}},e("notebook").addEventListener("close",()=>{t==="notebook"&&(t=a,document.documentElement.dataset.appSection=t,r())}),e("notebook").addEventListener("cancel",h=>{p()||(h.preventDefault(),e("notebook").close())}),e("notebook-open").addEventListener("click",()=>{t!=="notebook"&&(a=t),t="notebook",document.documentElement.dataset.appSection=t,r()}),window.addEventListener("pft-card-open",()=>l("trip")),e("edit").onclick=()=>{l("explore")&&(e("planner").scrollIntoView({block:"start",behavior:"instant"}),e("intent").focus())};const u=document.querySelector(".brand");u.onclick=h=>{h.preventDefault(),l("explore")};const f=document.querySelectorAll("#info > p:not(.eyebrow)");f[0].textContent="Transformers.js runs Xenova/all-MiniLM-L6-v2 (Apache-2.0), the pinned open q8 model through WebAssembly on this device. The Android APK includes the model, runtime and authored cards. No network permission, account, location access or model download is needed. The current matcher processes English sentences.",f[1].textContent="Your saved discoveries, kept trip and choices live in this app’s private device storage. An unfinished discovery has a separate local recovery copy, removed after verified Save or explicit Discard. Your intent is not stored. Clear personal records includes draft recovery; uninstalling or clearing Android app data removes these records. Make an explicit JSON backup first. Exports use a system chooser only when requested.",f[2].textContent="Guide, runtime and model files are bundled in this Android test APK. Offline matching prepares those files locally; there is no service-worker installation or remote model download. Release model from memory keeps the package and your records. Android uninstall or app-data clearing removes private records; make a JSON backup before changing installation.",e("install-app-status").textContent="Android test App content · model included. Installation is provided by the APK.";for(const h of document.querySelectorAll(".app-access > details"))h.hidden=!0;const m=e("home-draft").querySelector("p");m&&(m.textContent="One unsaved discovery · kept privately for App recovery."),e("save-discovery").textContent="Save discovery on this device",document.querySelector(".editor-privacy summary").textContent="Save adds this discovery to your notebook",document.querySelector(".editor-privacy p").textContent="Unfinished writing has a separate private recovery copy when storage works. Save adds your discovery to the notebook; Discard removes its recovery copy. Android app-data clearing or uninstalling removes local records. Matching uses English; your discovery can use any language.",window.addEventListener("pft-native-lifecycle",h=>{const E=h.detail==="paused";document.documentElement.dataset.pageVisibility=E?"hidden":"visible",E&&document.getAnimations().forEach(c=>c.cancel())});let b=!1;new MutationObserver(()=>{b||(b=!0,requestAnimationFrame(()=>{b=!1,r()}))}).observe(document.documentElement,{attributes:!0,subtree:!0,attributeFilter:["open","data-theme","hidden"]}),window.addEventListener("pft-native-connected",r)}const Sa=["I noticed ","A small detail was ","Next time I want to notice "];function Ea(t,e){return t.length===0&&Sa.some(n=>n===e)?e:null}function Aa(t){const e=[...document.querySelectorAll("#writing-starters button")],n=()=>e.forEach(a=>{a.disabled=t.value.length>0});return e.forEach(a=>{a.onclick=()=>{const s=Ea(t.value,a.dataset.starter||"");s!==null&&(t.value=s,t.dispatchEvent(new Event("input",{bubbles:!0})),t.focus(),t.setSelectionRange(s.length,s.length))}}),t.addEventListener("input",n),n(),n}function Ia(t){const e=[];t.search.trim()&&e.push("Search: “"+t.search.trim()+"”");for(const[n,a]of[["Tag",t.tag],["Scene",t.scene],["Lens",t.lens],["Month",t.month]])a&&a!=="any"&&e.push(n+": "+a);return t.from&&e.push("From "+t.from+" (UTC)"),t.to&&e.push("Through "+t.to+" (UTC)"),t.family&&e.push("Family: "+t.family),e}function Na(t,e){return t.filter(n=>(e.lens==="any"||n.task.lens===e.lens)&&(e.month==="any"||n.createdAt.slice(0,7)===e.month)&&(!e.family||n.task.family===e.family))}function Ta(t){const e=new Set(t.map(s=>s.createdAt.slice(0,10))).size,n=new Set(t.map(s=>s.task.lens)).size,a=new Set(t.flatMap(s=>s.scene?[s.scene]:[])).size;return{notes:t.length,days:e,lenses:n,scenes:a}}function zn(t){return["street","park","garden","water","unclassified"].map(e=>({scene:e,label:Re(e==="unclassified"?void 0:e),count:t.filter(n=>(n.scene||"unclassified")===e).length}))}function Oa(t){const e=[...t].sort((n,a)=>n.createdAt.localeCompare(a.createdAt)||n.id.localeCompare(a.id));return e.length>=2?[e[0].id,e.at(-1).id]:null}function co(t,e){const n=["Pocket Field Trip — saved discoveries",`Exported ${e}`,`${t.entries.length} saved discoveries. Unsaved drafts are excluded.`,"This is a readable text copy. Keep a JSON backup to restore your notebook."].join(`

`),a=io(t.entries,"newest").map((s,r)=>[`Discovery ${r+1}`,s.text,`Created: ${s.createdAt}
Updated: ${s.updatedAt}`,`Scene: ${Re(s.scene)}
Tags: ${s.tags.join(", ")||"None"}`,`Stored task: ${s.task.title}
Card: ${s.task.id} · ${s.task.version}`,"Stored task snapshot (not revalidated):",...s.task.steps.map((p,d)=>`${d+1}. ${p}`),`Pocket cues: ${s.task.cues.join(" / ")}`].join(`

`));return[n,...a].join(`

────────────────────

`)}function $a(t,e){const n=r=>et(JSON.stringify({schema:2,entries:r,feedback:eo()})).entries,a=n(t),s=new Map(n(e).map(r=>[r.id,JSON.stringify(r)]));return a.every(r=>s.get(r.id)===JSON.stringify(r))}function Gn(t,e){return co({entries:t},e).replace("— saved discoveries","— selected saved discoveries")}function La(t,e){const n=u=>document.getElementById(u),a=n("selected-notes-dialog");let s=[],r="",p="";const d=u=>n("selected-output-status").textContent=u;function l(){try{if(!e()||JSON.stringify(t())!==r||!s.length)throw Error();const u=et(localStorage.getItem(be));if(!$a(s,u.entries))throw Error();return!0}catch{return d("Selection or saved data changed, or storage cannot be read. Close this preview and prepare it again. Nothing was exported."),!1}}n("prepare-selected-notes").onclick=()=>{e()&&(s=structuredClone(t()),s.length&&(r=JSON.stringify(t()),p=new Date().toISOString(),n("selected-note-text").value=Gn(s,p),d(`${s.length} selected saved discoveries. This includes your private words, tags and task snapshots. Unsaved drafts and preferences are excluded. Choose where to keep the file yourself.`),a.showModal()))},n("close-selected-notes").onclick=()=>a.close(),a.addEventListener("close",()=>{s=[],r="",n("selected-note-text").value="",ze()}),n("download-selected-notes").onclick=()=>{if(!(!a.open||!l()))try{Ge("pocket-field-trip-selected-discoveries.txt",Gn(s,p)),d("TXT download requested for the previewed private notes only. Check your device for the file; this readable copy cannot restore a notebook.")}catch{d("Download could not start. Your notes were kept. Select the preview text and copy it yourself, or retry.")}},n("print-selected-notes").onclick=()=>{if(!a.open||!l())return;const u=s.map(f=>{const m=document.createElement("article");m.className="printed-field-card printed-discovery",U(m,"p","POCKET FIELD TRIP / PRIVATE SAVED DISCOVERY"),U(m,"h1",f.text),U(m,"p",`${f.createdAt.slice(0,10)} (UTC) · ${Re(f.scene)} · ${f.tags.join(", ")||"No tags"}`),U(m,"h2",f.task.title),U(m,"p","Stored snapshot, not revalidated for your current conditions.");const b=document.createElement("ol");return f.task.steps.forEach(h=>U(b,"li",h)),m.append(b),U(m,"footer",`${f.task.id} / ${f.task.version} · Private content selected by you. No intent or preference history included.`),m});try{so(u),d("Print preview requested for the selected private notes only. Check the preview; no printer or PDF success is confirmed.")}catch{d("Print could not open. Your notes were kept. Download this preview as TXT instead.")}finally{ze()}}}function vn(t){const e=document.createElement("article");e.className="literal-discovery-review";const n=r=>{const p=document.createElement("p");return p.textContent=r,p},a=document.createElement("details"),s=document.createElement("summary");return s.textContent="Stored task snapshot · read only",a.append(s,n(`${t.task.title} · ${Ot[t.task.lens]} · ${t.task.version} · ${t.task.minutes} min`),n("Steps"),...t.task.steps.map((r,p)=>n(`${p+1}. ${r}`)),n("Pocket cues"),...t.task.cues.map((r,p)=>n(`${p+1}. ${r}`)),n(`Observation prompt: ${t.task.prompt}`),n(`Stored ID: ${t.task.id}; family: ${t.task.family}; settings: ${t.task.settings.join(", ")}; one spot: ${t.task.still?"yes":"no"}; requires: ${(t.task.requires||[]).join(", ")||"none"}. Literal historical content, not a current fit check or AI analysis.`)),e.append(n(t.text),n(`${t.createdAt} · updated ${t.updatedAt} (UTC) · ${Re(t.scene)} · ${t.tags.map(r=>"#"+r).join(" ")}`),a),e}function yn({from:t,to:e}){return!(t&&e&&t>e)}function Ra(t,e){return yn(e)?t.filter(n=>{const a=n.createdAt.slice(0,10);return(e.tag==="any"||n.tags.includes(e.tag))&&(e.scene==="any"||(e.scene==="unclassified"?n.scene===void 0:n.scene===e.scene))&&(!e.from||a>=e.from)&&(!e.to||a<=e.to)}):[]}function Zn(t,e,n){if(!e||!n||e===n)return null;const a=t.find(r=>r.id===e),s=t.find(r=>r.id===n);return a&&s?[a,s]:null}function Da(t){const e=i=>document.getElementById(i),n=e("discovery-editor"),a=e("notebook"),s=e("discovery-text"),r=Aa(s),p=e("discovery-scene");let d="",l="",u="";const f=new Map;let m="",b=0,h="",E=[];const c=new Set,v=new Map;for(const i of zn([])){const g=document.createElement("button");g.type="button",g.className="text-button",g.onclick=()=>{e("notebook-scene").value=i.scene,F(),g.focus(),ve(e("collection-summary"),{opacity:.96,translate:"0 3px"},160)},v.set(i.scene,g),e("collection-scenes").append(g)}La(()=>t.get().entries.filter(i=>c.has(i.id)),()=>t.readable());function q(){for(const[g,I]of f){const C=I.article.querySelector(".discovery-select input");C&&(C.checked=c.has(g))}const i=c.size;e("selected-notes-status").textContent=i?`${i} saved discoveries selected in this view. Preview their private content before output.`:"No discoveries selected. Selection stays in this tab only.",e("prepare-selected-notes").disabled=!i||!t.readable(),e("clear-selected-notes").disabled=!i}function ee(){b++;for(const{article:i}of f.values()){const g=i.querySelector('[data-copy-pending="true"]');g&&(g.dataset.copyPending="false",g.textContent="Copy discovery",i.querySelector(".discovery-copy-status").textContent="")}}a.addEventListener("close",ee);function w(){ee(),B()?a.open||a.show():a.showModal()}let S=null,P="",O=!1,x=!1,j=!1,oe=[],ue=null;const $=(i,g,I="")=>{const C=document.createElement(i);return C.textContent=g,C.className=I,C};let T=null,J=!1,z=null,Pe=null,pe="";const ce=document.createElement("aside");ce.className="home-draft",ce.id="android-draft-recovery",ce.hidden=!0;const Be=document.createElement("p");Be.setAttribute("role","status");const Ne=document.createElement("button");Ne.id="android-resume-draft",Ne.textContent="Resume recovered draft";const ke=document.createElement("button");ke.id="android-discard-draft",ke.textContent="Discard recovery copy";const ot=document.createElement("button");ot.id="android-export-recovery",ot.textContent="Save recovery copy…",ot.onclick=()=>{try{const i=localStorage.getItem(mt);if(i===null||i.length>16e3)throw Error("Recovery copy is unavailable or too large.");Ge("pocket-field-trip-UNVERIFIED-draft-recovery.json",JSON.stringify({format:"pft-unverified-draft-recovery",version:1,raw:i})+`
`)}catch(i){Be.textContent=String(i)}},ce.append(Be,Ne,ot,ke),B()&&e("home-draft").before(ce);function wo(){if(B())try{if(x&&S){if(ce.hidden===!1&&!J)throw Error("Resume or discard the earlier recovery copy first.");T=_t(localStorage,T,{schema:1,id:P,task:S,text:s.value,tags:oe,scene:p.value||void 0,editing:O,originalUpdatedAt:Pe,noteDone:e("note-done").checked,tripRaw:z}),J=!0,pe=""}else J&&(T=_t(localStorage,T,null),J=!1,pe="")}catch(i){pe=String(i instanceof Error?i.message:i)}}function tn(){if(!B())return;try{T=localStorage.getItem(mt)}catch{Be.textContent="Draft recovery storage is unavailable. Current writing stays in memory.",ce.hidden=!1,Ne.disabled=!0,ke.disabled=!0;return}if(!T)return;const i=Bo(T);ce.hidden=!1;const g=i&&t.get().entries.find(_=>_.id===i.id);if(g&&i&&g.text===i.text.trim().replace(/\s+/g," ")&&JSON.stringify(g.tags)===JSON.stringify(i.tags)&&g.scene===i.scene&&JSON.stringify(g.task)===JSON.stringify(i.task)&&(!i.editing||g.updatedAt!==i.originalUpdatedAt)){try{T=_t(localStorage,T,null),ce.hidden=!0,t.announce("The discovery was already saved. Its leftover draft recovery was removed.")}catch{}return}const C=!i||(i.editing?!g||g.updatedAt!==i.originalUpdatedAt:!!g);Be.textContent=C?"An earlier draft recovery could not be safely resumed. It was preserved; save its unverified recovery copy before discarding it.":"An unsaved discovery was recovered on this device. Resume it or explicitly discard this recovery copy. It is not a saved discovery.",Ne.disabled=!!C,Ne.onclick=()=>{if(!i||x){t.announce("Keep or discard the current draft first.");return}try{if(localStorage.getItem(mt)!==T){tn();return}}catch{return}on(i.task,i.id,i.text,i.tags,i.editing,i.scene,i.tripRaw),z=i.tripRaw,Pe=i.originalUpdatedAt,e("note-done").checked=i.noteDone,J=!0,x=!0,ce.hidden=!0,Se(),Bt()},ke.onclick=()=>{if(x){Be.textContent="Save or discard the current writing first; its recovery was kept.";return}if(ke.dataset.confirm!=="true"){ke.dataset.confirm="true",ke.textContent="Confirm discard recovery copy";return}try{T=_t(localStorage,T,null),ce.hidden=!0,J=!1,ke.dataset.confirm="false",ke.textContent="Discard recovery copy"}catch(_){Be.textContent=String(_)}}}let nn=!1;const Ce=i=>{nn=!1,e("discovery-message").textContent=i};function Te(){(e("notebook-draft").hidden?e("notebook-start").hidden?e("notebook-search").closest("label").hidden?e("close-notebook"):e("notebook-search"):e("notebook-start"):e("resume-discovery")).focus()}let at=null;const st=()=>{at&&delete at.button.dataset.pressing,at=null};e("discovery-tags").addEventListener("pointerdown",i=>{if(!i.isPrimary||!["touch","pen"].includes(i.pointerType))return;const g=i.target.closest("button");!g||g.disabled||(st(),at={button:g,pointerId:i.pointerId},g.dataset.pressing="true")});for(const i of["pointerup","pointercancel","lostpointercapture"])document.addEventListener(i,g=>{at?.pointerId===g.pointerId&&st()});n.addEventListener("close",st),window.addEventListener("blur",st),document.addEventListener("visibilitychange",()=>{document.hidden&&st()});function Pt(i){const g=f.get(i)?.article,I=g?.isConnected?Array.from(g.querySelectorAll("button")).find(C=>!C.disabled&&C.getClientRects().length>0&&getComputedStyle(C).visibility!=="hidden"):void 0;I?I.focus():Te()}function Se(){wo(),t.onDraftChange?.(x&&!!S);const i=e("backup-status");!x&&i.dataset.draftBlocked==="true"&&(i.dataset.draftBlocked="false",i.textContent="Draft resolved. You can choose a JSON backup to restore.");const g=e("draft-status");if(g.hidden=!x||!S,g.textContent=x&&S?`Unsaved draft for “${S.title}” · this tab only. Write one discovery continues it.`:"",e("notebook-draft").hidden=!x||!S,e("notebook-draft-status").textContent=x&&S?`Unsaved draft for “${S.title}” · this tab only.`:"",B()&&x&&S){const I=pe?" · recovery was not verified: "+pe:" · recovery kept privately on this device; Save adds it to your notebook.";g.textContent=`Unsaved draft for “${S.title}”${I}`;const C=e("home-draft").querySelector("p");C&&(C.textContent=pe?"One unsaved discovery · recovery was not verified. Keep your words before closing.":"One unsaved discovery · recovery kept privately on this device."),e("notebook-draft-status").textContent=g.textContent}}function Bt(){if(!x||!S){B()&&T!==null&&(tn(),ce.scrollIntoView({block:"center",behavior:"instant"}),(Ne.disabled?ot:Ne).focus());return}j=a.open,a.open&&a.close(),Ce("Continuing your unsaved draft. Only Save keeps it."),n.open||n.showModal(),s.focus()}e("resume-discovery").onclick=Bt;function Rn(i=!0){if(!i){for(const g of e("discovery-tags").querySelectorAll("button"))g.setAttribute("aria-pressed",String(oe.includes(g.textContent)));return}e("discovery-tags").replaceChildren(...Uo.map(g=>{const I=document.createElement("button");return I.type="button",I.textContent=g,I.setAttribute("aria-pressed",String(oe.includes(g))),I.onclick=()=>{if(oe.includes(g))oe=oe.filter(C=>C!==g);else if(oe.length<3)oe=[...oe,g];else{Ce("Choose up to three tags. Remove one to choose another."),nn=!0;return}nn&&Ce(""),x=!0,Se(),Rn(!1)},I}))}function on(i,g,I="",C=[],_=!1,te,L){if(e("record").textContent="Write one discovery",e("record").dataset.confirmed="false",S=i,P=g,O=_,_||t.onNewDraft?.(g,i,L),B()){try{z=L===void 0?localStorage.getItem(xn):L}catch{z=null}Pe=_&&t.get().entries.find(G=>G.id===g)?.updatedAt||null}s.value=I,oe=[...C],p.value=te||"",x=!1,e("discovery-title").textContent=_?"Edit your discovery":"One thing you noticed.",e("discovery-task").textContent=i.title,e("discovery-prompt").textContent=i.prompt,e("done-with-note").hidden=_,e("note-done").checked=!0,Rn(),Ce(""),Dn(),Se()}function Dn(){e("discovery-count").textContent=`${s.value.length} / 280`,r()}s.oninput=()=>{x=!0,Dn(),Se()},e("note-done").addEventListener("change",()=>{x=!0,Se()}),p.onchange=()=>{x=!0,Se()};let rt=!1;e("discovery-form").onsubmit=async i=>{if(i.preventDefault(),!n.open||!S||rt)return;rt=!0,e("save-discovery").disabled=!0;const g=e("discovery-form"),I=[...g.querySelectorAll("input,button,select,textarea")].map(C=>({control:C,disabled:C.disabled}));for(const{control:C}of I)C.disabled=!0;g.setAttribute("aria-busy","true"),Ce("Saving your discovery…");try{const C=Fo(t.get(),{id:P,text:s.value,tags:oe,task:S,markDone:!O&&e("note-done").checked,scene:p.value||null},new Date().toISOString());if(!await t.commit(C)){Ce((B()?"Saving was not confirmed. ":"Not saved. ")+(t.problem()||"Your draft is still here; no completion was recorded. Retry when browser storage is available."));return}const _=S,te=O,L=j;j=!1,x=!1,S=null,s.value="",O=!1,un(n,!0),F();const G=te?"Discovery updated. Completion order unchanged.":B()?"Discovery saved on this device. Nothing was uploaded.":"Discovery saved on this browser. Nothing was uploaded.";e("notebook-status").textContent=G,t.announce(G),te||L?(w(),Pt(P),f.get(P)?.article.isConnected||(e("notebook-status").textContent+=" This discovery is outside the current search or filters.")):(e("record").textContent="Discovery saved ✓",e("record").dataset.confirmed="true",e("record").focus(),bn(e("record")));const Y=t.onSaved?.(P,_,te);Y&&(e("notebook-status").textContent+=" "+Y,t.announce(G+" "+Y))}catch(C){Ce(String(C instanceof Error?C.message:C))}finally{rt=!1;for(const{control:C,disabled:_}of I)C.disabled=_;g.setAttribute("aria-busy","false"),e("save-discovery").disabled=!1}};function Mn(){if(rt)return;un(n),Se();const i=O||j;j=!1,i&&(F(),w(),f.get(P)?.article.isConnected?Pt(P):x?e("resume-discovery").focus():Te())}e("close-discovery").onclick=Mn,n.addEventListener("cancel",i=>{i.preventDefault(),Mn()}),e("discard-discovery").onclick=()=>{if(rt)return;x=!1,S=null,s.value="",oe=[],Se();const i=O,g=j;j=!1,O=!1,un(n),(i||g)&&(F(),w(),Pt(P))},window.addEventListener("beforeunload",i=>{x&&(i.preventDefault(),i.returnValue="")});function an(i){if(B()&&T!==null&&!J&&!x){t.announce("Resume or discard the earlier recovered draft before starting a new discovery. Its words were preserved."),Bt();return}if(j=!1,x&&S){Ce(`Your unsaved draft for “${S.title}” was kept. Save it or discard it before starting a different discovery.`),n.open||n.showModal(),s.focus();return}on(Po(i),crypto.randomUUID()),n.showModal(),s.focus()}function xo(i){if(j=!1,x&&S){j=!0,a.close(),Ce("Your unsaved draft was kept. Save or discard it first."),n.showModal(),s.focus();return}on(i.task,i.id,i.text,i.tags,!0,i.scene),a.close(),n.showModal(),s.focus()}function F(){const i=e("notebook-search").closest("label"),g=a.open&&(i.contains(document.activeElement)||e("notebook-tools").contains(document.activeElement));Se(),e("record").textContent="Write one discovery",e("record").dataset.confirmed="false";const I=t.get();a.dataset.depth=String(Math.min(3,I.entries.length));const C=t.readable(),_=Ta(I.entries);e("notebook-collection").hidden=!C||!_.notes,e("collection-summary").textContent=`${_.notes} discoveries · ${_.days} UTC days with notes · ${_.lenses} lenses · ${_.scenes} chosen scene categories`;for(const k of zn(I.entries)){const Ee=v.get(k.scene);Ee.textContent=`${k.label} · ${k.count}`,Ee.setAttribute("aria-pressed",String(e("notebook-scene").value===k.scene)),Ee.disabled=!k.count}const te=e("notebook-month"),L=te.value,G=[...new Set(I.entries.map(k=>k.createdAt.slice(0,7)))].sort().reverse();L!=="any"&&!G.includes(L)&&G.push(L),JSON.stringify(G)!==te.dataset.months&&(te.replaceChildren(new Option("All months","any"),...G.map(k=>new Option(k,k))),te.value=L,te.dataset.months=JSON.stringify(G)),e("notebook-count").textContent=C?String(I.entries.length):"—",e("notebook-summary").textContent=C?I.entries.length?`${I.entries.length} ${I.entries.length===1?"discovery":"discoveries"} · only on this browser`:"Only on this browser.":"Stored content is unreadable here; its count is unknown. / 此处无法读取存储内容，条目数未知。",e("notebook-problem").textContent=t.problem()||"";const Y={tag:e("notebook-filter").value,scene:e("notebook-scene").value,from:e("notebook-from").value,to:e("notebook-to").value},ae=io(ka(Na(Ra(I.entries,Y),{lens:e("notebook-lens").value,month:te.value,family:h}),e("notebook-search").value),e("notebook-sort").value),fe=!!(e("notebook-search").value.trim()||Y.tag!=="any"||Y.scene!=="any"||Y.from||Y.to||e("notebook-lens").value!=="any"||te.value!=="any"||h),qe=C&&!I.entries.length&&!fe;i.hidden=qe,e("notebook-tools").hidden=qe,e("notebook-tools-jump").hidden=!ae.length,e("notebook-start").hidden=!qe||x,e("notebook-start").textContent=t.currentTask()?"Write one discovery":"Browse field notes",e("notebook-filter-status").hidden=C&&!fe,e("notebook-filter-status").textContent=C?yn(Y)?`${ae.length} of ${I.entries.length} discoveries shown.`:"Choose a through date on or after the from date.":"Stored notebook cannot be filtered here. Count unknown. / 此处无法筛选原始笔记，条目数未知。",e("notebook-view-context").hidden=!fe,e("active-note-filters").textContent=t.readable()?Ia({...Y,scene:Y.scene==="any"?"any":e("notebook-scene").selectedOptions[0]?.textContent||"",search:e("notebook-search").value,lens:e("notebook-lens").selectedOptions[0]?.value==="any"?"any":e("notebook-lens").selectedOptions[0]?.textContent||"",month:te.value,family:h}).join(" · "):"",e("notebook-density").hidden=!C||!I.entries.length,e("notebook-view-summary").hidden=C,e("notebook-view-summary").textContent=C?yn(Y)?`${ae.length} of ${I.entries.length} saved notes in this view.`:"This date range is reversed. No notes are shown.":"Stored content is not shown. Count unknown. / 原始内容未显示，条目数未知。",Co(ae),E=ae,e("family-view").hidden=!h,e("family-view-label").textContent=h?"Task-family view: "+h+". Same content family, not necessarily the same place.":"",e("note-selection-tools").hidden=!C||!I.entries.length;let Ye=0;for(const k of c){const Ee=ae.find(je=>je.id===k);(!C||!Ee||f.has(k)&&f.get(k).signature!==JSON.stringify(Ee))&&(c.delete(k),Ye++)}Ye&&(e("notebook-status").textContent=`${Ye} selected discoveries cleared because they changed or left this view. Preview the remaining selection again.`);const Eo=new Set(I.entries.map(k=>k.id));for(const k of f.keys())Eo.has(k)||f.delete(k);const Ao=ae.map(k=>{const Ee=JSON.stringify(k),je=f.get(k.id);if(je?.signature===Ee)return je.article;const we=document.createElement("article");we.className="discovery-note",we.dataset.noteId=k.id,we.dataset.expanded=je?.article.dataset.expanded||"false";const sn=document.createElement("label");sn.className="discovery-select";const Je=document.createElement("input");Je.type="checkbox",Je.checked=c.has(k.id),Je.setAttribute("aria-label","Select saved discovery: "+k.text),Je.onchange=()=>{Je.checked?c.add(k.id):c.delete(k.id),q()},sn.append(Je,document.createTextNode("Select for private output"));const Io=$("p",`${Ot[k.task.lens]} · ${k.createdAt.slice(0,10)} (UTC) · ${Re(k.scene)}`,"eyebrow"),Bn=$("p",k.text,"discovery-line"),No=$("p",k.task.title,"discovery-task-name"),To=$("p",k.tags.map(Z=>"#"+Z).join(" "),"discovery-labels"),it=document.createElement("div");it.className="discovery-actions",it.id="note-actions-"+crypto.randomUUID();const ct=document.createElement("button");ct.textContent="Edit",ct.className="text-button",ct.setAttribute("aria-label",`Edit discovery: ${k.text}`),ct.onclick=()=>xo(k);const se=document.createElement("button");se.className="text-button",se.textContent="Copy discovery",se.setAttribute("aria-label",`Copy discovery: ${k.text}`);const dt=$("p","","discovery-copy-status");dt.setAttribute("role","status");let rn=0;se.onclick=async()=>{const Z=++rn,Ut=b,Ft=()=>Z===rn&&Ut===b&&a.open&&we.isConnected&&t.get().entries.some(ft=>ft.id===k.id&&ft.text===k.text);se.textContent="Copying…",se.dataset.copyPending="true",dt.textContent="";try{if(await navigator.clipboard.writeText(k.text),!Ft())return;se.dataset.copyPending="false",se.textContent="Copied ✓",dt.textContent="Copied. Your discovery is on the clipboard.",bn(se)}catch{if(!Ft())return;se.dataset.copyPending="false",se.textContent="Copy discovery",dt.textContent="Clipboard unavailable. Select this line and copy it yourself.";const ft=document.createRange();ft.selectNodeContents(Bn);const _n=window.getSelection();_n?.removeAllRanges(),_n?.addRange(ft)}finally{Z===rn&&Ut===b&&se.dataset.copyPending==="true"&&(se.dataset.copyPending="false",se.textContent="Copy discovery")}};const lt=document.createElement("button");lt.textContent="Delete",lt.className="text-button",lt.setAttribute("aria-label",`Delete discovery: ${k.text}`),lt.onclick=async()=>{const Z=t.get(),Ut=Z.entries.findIndex(Ft=>Ft.id===k.id);if(!await t.commit(Do(Z,k.id))){e("notebook-status").textContent="Deletion failed. Your discovery was kept.";return}ue={entry:k,index:Ut},F(),e("notebook-status").textContent="Discovery deleted. Undo is available here; completion preferences are unchanged.",e("undo-discovery").focus()};const ut=document.createElement("button");ut.textContent="Revisit task",ut.className="text-button",ut.disabled=!cn(k.task.id)||cn(k.task.id)?.version!==k.task.version,ut.onclick=()=>{const Z=cn(k.task.id);if(Z){if(x&&S){a.close(),an(Z),j=!0;return}a.close(),t.openTask(Z)}};const pt=document.createElement("button");pt.type="button",pt.className="text-button",pt.textContent="More from this task family",pt.onclick=()=>{h=k.task.family,F(),e("clear-family-view").focus()};const We=document.createElement("details");We.className="note-snapshot",We.id="note-snapshot-"+crypto.randomUUID(),We.open=je?.article.querySelector("details")?.open||!1;const Oo=$("summary","Stored task snapshot · read-only"),Un=document.createElement("ol");k.task.steps.forEach(Z=>Un.append($("li",Z))),We.append(Oo,Un,$("small",`Card ${k.task.id} · ${k.task.version}`)),it.append(ct,se,lt,ut,pt);const $e=document.createElement("button");$e.type="button",$e.className="text-button discovery-row-toggle",$e.setAttribute("aria-controls",it.id+" "+We.id);const Fn=()=>{const Z=we.dataset.expanded==="true";$e.textContent=Z?"Hide note actions":"Show note actions",$e.setAttribute("aria-expanded",String(Z)),$e.setAttribute("aria-label",`${Z?"Hide":"Show"} actions for discovery: ${k.text}`)};return Fn(),$e.onclick=()=>{ee(),we.dataset.expanded=we.dataset.expanded==="true"?"false":"true",Fn()},we.append(Io,Bn,No,To,sn,$e,it,dt,We),f.set(k.id,{signature:Ee,article:we}),we}),Pn=e("notebook-list");let Oe=Pn.firstElementChild;for(const k of Ao)k===Oe?Oe=Oe.nextElementSibling:Pn.insertBefore(k,Oe);for(;Oe;){const k=Oe.nextElementSibling;Oe.remove(),Oe=k}e("notebook-empty").hidden=ae.length>0,e("notebook-empty").textContent=C?I.entries.length?"No discoveries match this view.":"Keep one thing you noticed after a field trip.":"Original stored content was not replaced by an empty notebook. / 原始存储内容未被空笔记替换。",e("undo-discovery").hidden=!ue,q(),qe&&g&&Te()}e("notebook-open").onclick=()=>{F(),w()},e("notebook-start").onclick=()=>{if(!a.open||!t.readable()||t.get().entries.length||x)return;const i=t.currentTask();a.close(),i?(an(i),j=!0):t.browse()},e("close-notebook").onclick=()=>a.close(),e("notebook-tools-jump").onclick=Te,e("notebook-search").oninput=F,e("notebook-search").addEventListener("search",F),e("notebook-sort").onchange=F,e("notebook-density").onclick=()=>{ee();const i=a.dataset.density!=="compact";if(a.dataset.density=i?"compact":"full",e("notebook-density").setAttribute("aria-pressed",String(i)),e("notebook-density").textContent=i?"Use full view":"Use compact view",i)for(const g of f.values())g.article.contains(document.activeElement)&&g.article.dataset.expanded!=="true"&&g.article.querySelector(".discovery-row-toggle")?.focus()},e("notebook-filter").onchange=F;for(const i of["notebook-lens","notebook-month"])e(i).onchange=F;e("select-visible-notes").onclick=()=>{if(t.readable()){for(const i of E)c.add(i.id);q()}},e("clear-selected-notes").onclick=()=>{c.clear(),q()},e("clear-family-view").onclick=()=>{h="",F(),Te()};for(const i of["notebook-scene","notebook-from","notebook-to"])e(i).onchange=F;e("clear-note-filters").onclick=()=>{e("notebook-search").value="",e("notebook-filter").value="any",e("notebook-scene").value="any",e("notebook-from").value="",e("notebook-to").value="",e("notebook-lens").value="any",e("notebook-month").value="any",h="",F()},e("clear-view-filters").onclick=()=>{e("clear-note-filters").click(),Te()};function Co(i){if(JSON.stringify([i,d,l,u])===m)return;[d,l].some(L=>L&&!i.some(G=>G.id===L))&&(u="A selected discovery was removed from this comparison. Choose it again if it is visible. "),i.some(L=>L.id===d)||(d=""),i.some(L=>L.id===l)||(l="");for(const[L,G,Y]of[["compare-previous",d,l],["compare-current",l,d]]){const ae=e(L);ae.replaceChildren(new Option("Choose a discovery",""),...i.map((fe,qe)=>{const Ye=new Option(`${qe+1}. ${fe.createdAt.slice(0,10)} · ${Re(fe.scene)} · ${fe.text.slice(0,60)}`,fe.id);return Ye.disabled=fe.id===Y,Ye})),ae.value=G,ae.disabled=i.length<2}const C=Zn(i,d,l);e("compare-boundaries").disabled=i.length<2,e("swap-comparison").disabled=!C;const _=e("comparison-notes"),te=new Set(Array.from(_.querySelectorAll(".comparison-note")).filter(L=>L.querySelector("details")?.open).map(L=>L.dataset.noteId));_.hidden=!C,_.replaceChildren(...(C||[]).map((L,G)=>{const Y=document.createElement("article");Y.className="comparison-note",Y.dataset.noteId=L.id,Y.append($("h4",G===0?"Previous · your choice":"This time · your choice"),$("p",`${L.createdAt.slice(0,10)} (UTC) · ${Re(L.scene)}`,"eyebrow"),$("p",L.text,"discovery-line"),$("p",L.task.title,"discovery-task-name"),$("p",L.tags.map(fe=>"#"+fe).join(" "),"discovery-labels"));const ae=vn(L).querySelector("details");return ae.open=te.has(L.id),Y.append(ae),Y})),e("comparison-status").textContent=u+(i.length<2?"Two visible discoveries are needed for a comparison.":C?"Showing your two saved observations. No AI analysis or same-place claim.":"Choose two different discoveries to compare."),e("clear-comparison").hidden=!d&&!l,m=JSON.stringify([i,d,l,u])}e("swap-comparison").onclick=()=>{Zn(E,d,l)&&([d,l]=[l,d],u="Positions swapped by your explicit choice. ",F(),e("swap-comparison").focus())},e("compare-previous").onchange=()=>{u="",d=e("compare-previous").value,F()},e("compare-boundaries").onclick=()=>{const i=Oa(E);i&&([d,l]=i,u="Earliest and latest visible discoveries selected by your explicit request. ",F(),e("compare-current").focus())},e("compare-current").onchange=()=>{u="",l=e("compare-current").value,F()},e("clear-comparison").onclick=()=>{u="",d="",l="",F(),e("compare-previous").disabled?Te():e("compare-previous").focus()},e("undo-discovery").onclick=async()=>{if(!ue)return;const i=ue.entry.id;try{if(!await t.commit(Mo(t.get(),ue.entry,ue.index))){e("notebook-status").textContent="Undo could not be saved. The deleted discovery remains available to retry.";return}ue=null,F(),e("notebook-status").textContent="Discovery restored. Completion order unchanged.",Pt(i)}catch(g){e("notebook-status").textContent=String(g)}};function So(){if(B())try{T=localStorage.getItem(mt),T===null&&(J=!1,pe="",ce.hidden=!0)}catch{}c.clear(),h="",u="",d="",l="",O=!1,j=!1,ue=null,x=!1,S=null,s.value="",oe=[],n.open&&n.close(),F()}return F(),{open:an,render:F,reset:So,focusHome:Te,resumeDraft:Bt,restoreRecovery:tn,hasDraft:()=>x||B()&&T!==null}}function Ma(t){const e=[...document.querySelectorAll("#journey button")],n=document.getElementById("result"),a=document.getElementById("discovery-editor"),s=["choose","take","keep"];function r(d){for(const l of e)l.dataset.stage===d?l.setAttribute("aria-current","step"):l.removeAttribute("aria-current")}function p(){e[1].disabled=!t.hasCard(),e[2].disabled=!t.hasCard()&&!t.hasDraft()}return e.forEach((d,l)=>{d.onclick=()=>{p(),!d.disabled&&([t.choose,t.take,t.keep][l](),r(s[l]))}}),new MutationObserver(()=>{p(),n.hidden||r("take")}).observe(n,{attributes:!0,attributeFilter:["hidden"]}),new MutationObserver(()=>{a.open&&r("keep"),p()}).observe(a,{attributes:!0,attributeFilter:["open"]}),r("choose"),p(),{refresh:p,cardReady:()=>{p(),r("take")}}}async function Pa(t){const e=await t.arrayBuffer();try{return new TextDecoder("utf-8",{fatal:!0}).decode(e)}catch{throw Error("This JSON file contains invalid UTF-8. Choose an intact backup or card pack. Nothing was changed.")}}function Ba(t){const e=w=>document.getElementById(w),n=e("notebook"),a=e("restore-notebook"),s=e("restore-file"),r=e("choose-backup"),p=e("cancel-backup-read"),d=e("confirm-restore"),l=e("restore-preferences"),u=e("restore-replace-ack");let f=null,m="",b=0,h=null;const E=(w,S=!1)=>{e("backup-status").textContent=w,e("backup-status").dataset.draftBlocked=String(S)},c=()=>document.querySelector('input[name="restore-mode"]:checked')?.value||"merge";function v(){if(!t.readable())throw Error("Stored notebook format is unreadable. Original bytes were kept. Restore is blocked until a compatible version can read them or you explicitly clear personal data.")}e("export-notebook").onclick=()=>{try{if(!t.readable())throw Error("Stored notebook format is unreadable. Original bytes were kept; a supported backup cannot be created from it.");const w=t.currentForExport(),S=Sn(w,new Date().toISOString());Ge(`pocket-field-trip-notebook-${new Date().toISOString().slice(0,10)}.json`,S,"application/json"),E(`Backup download requested for ${w.entries.length} saved discoveries. Keep the JSON file somewhere you control. Unsaved drafts are not included.`)}catch(w){E(`Backup download could not be requested. Saved discoveries were kept. ${String(w instanceof Error?w.message:w)}`)}},e("export-notebook-text").onclick=()=>{try{v();const w=t.currentForExport(),S=new Date().toISOString();Ge(`pocket-field-trip-discoveries-${S.slice(0,10)}.txt`,co(w,S)),E(`Readable copy download requested for all ${w.entries.length} saved discoveries. Unsaved drafts are excluded. Keep JSON for restoration.`)}catch(w){E(`Readable copy download could not be requested. Saved discoveries were kept. ${String(w instanceof Error?w.message:w)}`)}},r.onclick=()=>{try{v()}catch(w){E(String(w instanceof Error?w.message:w));return}if(t.hasDraft()){E("Save or discard your discovery draft before restoring a backup. Your draft was kept.",!0);return}s.value="",s.click()},s.addEventListener("cancel",()=>{!n.open||h!==null||(E("File choice cancelled. Existing discoveries and preferences were kept."),r.focus())}),p.onclick=()=>{h!==null&&(b++,h=null,r.disabled=!1,p.hidden=!0,s.value="",E("Stopped waiting for the file. Existing discoveries and preferences were kept. You can choose a backup again."),r.focus())},s.onchange=async()=>{const w=s.files?.[0];if(!w||!n.open)return;const S=++b;h=S,r.disabled=!0,p.hidden=!1,E("Reading a local JSON file. Nothing has been changed.");try{if(v(),w.size>kt)throw Error("Choose a JSON backup no larger than 1 MiB. Nothing was changed.");const P=Wt(await Pa(w));if(S!==b||!n.open)return;if(v(),t.hasDraft()){E("Save or discard your discovery draft before restoring. Nothing was changed.",!0);return}f=P,m=JSON.stringify(t.get()),l.checked=!1,u.checked=!1,e("restore-merge").checked=!0,e("restore-error").textContent="",e("restore-file-identity").textContent=`${w.name} · ${w.size.toLocaleString("en-US")} bytes · backup v${P.version} · exported ${P.exportedAt} (UTC). File identity is a label, not proof of origin.`,e("restore-sample").replaceChildren(...P.journal.entries.map(vn)),h=null,r.disabled=!1,p.hidden=!0,n.close(),A(),a.showModal()}catch(P){S===b&&E(String(P instanceof Error?P.message:P))}finally{if(h===S){const P=document.activeElement===p;h=null,r.disabled=!1,p.hidden=!0,P&&n.open&&r.focus()}}},n.addEventListener("close",()=>{b++,h!==null&&(h=null,r.disabled=!1,p.hidden=!0,E("Stopped waiting for the file. Existing discoveries were kept."))});function A(){if(!f)return;const w=c()==="replace";e("restore-replace-confirmation").hidden=!w,e("restore-removed-review").hidden=!w;const S=new Set(f.journal.entries.map(O=>O.id)),P=t.get().entries.filter(O=>!S.has(O.id));e("restore-removed").replaceChildren(...P.map(vn)),P.length||(e("restore-removed").textContent="No current discovery IDs are absent from this backup. Same-ID contents still follow the selected restore mode."),d.textContent=w?"Replace discoveries":"Merge discoveries",e("restore-error").textContent="",e("restore-preferences-detail").textContent=l.checked?"Completed and set-aside preferences will be replaced by this backup.":"Your current completed and set-aside preferences will be kept.";try{const x=Jn(t.get(),f,c(),l.checked).stats;e("restore-summary").textContent=w?`Replace all ${x.existing} current discoveries with ${x.incoming} imported discoveries. ${x.removed} current IDs are absent from the backup. Model downloads and saved card stay unchanged.`:`Keep ${x.existing} current discoveries and add ${x.additions} new IDs. ${x.duplicates} identical IDs and ${x.conflicts} different same-ID records keep the current version. Result: ${x.result} of 100 discoveries.`,d.disabled=w&&!u.checked}catch(O){e("restore-summary").textContent=`${f.journal.entries.length} discoveries in this supported backup.`,e("restore-error").textContent=String(O instanceof Error?O.message:O),d.disabled=!0}}for(const w of document.querySelectorAll('input[name="restore-mode"], #restore-preferences, #restore-replace-ack'))w.onchange=()=>{u.checked=w.id==="restore-replace-ack"?u.checked:!1,A()};let q=!1;function ee(){q||(f=null,b++,a.close(),n.showModal(),r.focus(),E("Restore cancelled. Existing discoveries and preferences were kept."))}e("cancel-restore").onclick=ee,a.addEventListener("cancel",w=>{w.preventDefault(),ee()}),d.onclick=async()=>{if(!f||d.disabled||q)return;q=!0;const w=c(),S=l.checked,P=[...a.querySelectorAll("input,button")].map(O=>({control:O,disabled:O.disabled}));for(const{control:O}of P)O.disabled=!0;a.setAttribute("aria-busy","true");try{if(v(),t.hasDraft())throw Error("Save or discard your discovery draft first. Nothing was changed.");if(JSON.stringify(t.get())!==m)throw Error("Notebook changed after preview. Cancel and choose the file again; nothing was changed.");if(w==="replace"&&!u.checked)throw Error("Confirm replacement before restoring.");const{next:O,stats:x}=Jn(t.get(),f,w,S);if(!await t.commit(O))throw Error(t.problem()||"Restore could not be saved. Existing discoveries were kept.");const j=`${w==="merge"?`${x.additions} discoveries added; existing same-ID records kept`:`${x.result} discoveries restored by replacement`}. ${S?"Backup preferences restored":"Current preferences kept"}.`;f=null,t.afterRestore(),a.close(),n.showModal(),t.focusNotebook(),E(j),t.announce(j)}catch(O){e("restore-error").textContent=`Not restored. ${String(O instanceof Error?O.message:O)}`}finally{q=!1;for(const{control:O,disabled:x}of P)O.disabled=x;a.setAttribute("aria-busy","false"),A()}}}const Ua="751bff37182d3f1213fa05d7196b954e230abad9",Fa=.3;function gn(t){return!Number.isFinite(t)||t<Fa}function $t(t){return H.filter(e=>e.minutes<=t.minutes&&(!t.lens||t.lens==="any"||e.lens===t.lens)&&e.settings.includes(t.setting)&&(!t.still||e.still)&&(!t.walk||!e.still)&&(e.requires||[]).every(n=>(t.features||[]).includes(n)))}function _a(t,e){const n=new Set(e.toLowerCase().match(/[a-z]+/g)||[]);return $t(t).map(a=>({activity:a,score:a.tags.filter(s=>n.has(s)).length})).sort((a,s)=>s.score-a.score||a.activity.id.localeCompare(s.activity.id))}fa();const qa=document.querySelector("#app");qa.innerHTML=Xo.replace("<!-- LANDSCAPE -->",Qo);const o=t=>document.getElementById(t),y=(t,e)=>o(t).hidden=!e,En=H.find(t=>t.id==="sound-map");o("sample-title").textContent=En.title;o("sample-cues").textContent=Tt[En.id].join(" / ");let re=null,Le=0,kn,R=[],le=[],de=0,N="semantic",ne=null,ie=[],K=to(),me=null,ye=null,Ct=!1,_e=!0;try{if(window.__pftJournalBootError)throw Error(window.__pftJournalBootError);me=localStorage.getItem(be),K=et(me),me===null&&(K.feedback=_o(localStorage.getItem(Cn)))}catch{_e=!1,ye=window.__pftJournalBootError?window.__pftJournalBootError+" A raw page rescue contains only the WebView cache; it does not rescue an unreadable device journal.":me===null?"Notebook storage could not be read. Nothing was changed. / 暂时无法读取笔记存储，数据未变。":"Unknown or damaged notebook; saving is paused. Original text kept. / 笔记格式未知或损坏，写入已暂停，原内容保留。",Ct=me!==null||!!window.__pftJournalBootError}let D=K.feedback,W,An,St,ge=!1,Ue=null,Et=!1,At=!0,It=null,V=!1,Fe=null,Q=null;pa(()=>Q&&!o("result").hidden?{card:Q,match:o("match-type").textContent.trim(),caution:o("match-caution").textContent.trim(),fit:o("fit-receipt").textContent.trim(),warning:o("fit-warning").hidden?void 0:o("fit-warning").textContent.trim(),safety:o("result").querySelector(".safety").textContent.replace(/\s+/g," ").trim()}:null);o("quiet-card").onclick=()=>{const t=o("trip-card"),e=t.getBoundingClientRect(),n=o("quiet-card").getAttribute("aria-pressed")!=="true";o("result").dataset.reading=n?"quiet":"full",y("quiet-return",n),o("quiet-card").setAttribute("aria-pressed",String(n)),o("quiet-card").textContent=n?"Show notes & tools":"Quiet card view",ra(t,e)};let Nt=0;const Ya=la(()=>!V&&!o("result").hidden?Q:null,go,Xt);let wn=0;const Ae=o("card-text-dialog");Ae.addEventListener("close",()=>{wn++,qt++,o("native-share-card").disabled=!1});o("close-card-text").onclick=()=>Ae.close();o("share-card").onclick=()=>{!Q||o("result").hidden||(o("card-text").value=wa(Q,Tt[Q.id],[o("fit-receipt").textContent.trim(),...o("fit-warning").hidden?[]:[o("fit-warning").textContent.trim()],o("trip-card").querySelector(".card-foot").textContent.replace("↗","").trim(),o("result").querySelector(".safety").textContent.replace(/\s+/g," ").trim()]),o("card-text-status").textContent="You can also select this text and copy it yourself.",Ae.showModal())};o("copy-card-text").onclick=async()=>{const t=Nt,e=++wn,n=()=>e===wn&&t===Nt&&Ae.open&&!o("result").hidden;o("card-text-status").textContent="Copying…";try{if(await navigator.clipboard.writeText(o("card-text").value),!n())return;o("card-text-status").textContent="Copied. The full card text is on your clipboard."}catch{if(!n())return;o("card-text-status").textContent="Clipboard unavailable. Select the text above and copy it yourself.",o("card-text").focus(),o("card-text").select()}};o("download-card-text").onclick=()=>{if(!(!Ae.open||!Q||o("result").hidden))try{Ge(`pocket-field-trip-${Q.id}.txt`,o("card-text").value),o("card-text-status").textContent="Card text download requested. Keep the file somewhere you can find it offline."}catch{o("card-text-status").textContent="Download unavailable. You can select the card text and copy it yourself."}};const In=matchMedia("(prefers-reduced-motion: reduce)");let qt=0;o("native-share-card").onclick=async()=>{if(!Ae.open||!Q||o("result").hidden)return;if(!navigator.share){o("card-text-status").textContent="Device sharing is unavailable. Copy or download this card text, then choose a destination yourself. Nothing was sent.",o("copy-card-text").focus();return}const t=o("native-share-card"),e=Nt,n=++qt,a=o("card-text").value,s=Q.title;t.disabled=!0,o("card-text-status").textContent="Opening the device share chooser for authored card text only. Your notebook and intent are excluded.";const r=()=>n===qt&&e===Nt&&Ae.open;try{await navigator.share({title:s,text:a}),r()&&(o("card-text-status").textContent="Device share request completed. Delivery is controlled by the chosen app; no receipt is tracked here.")}catch(p){r()&&(o("card-text-status").textContent=p instanceof DOMException&&p.name==="AbortError"?"Share cancelled. Nothing changed here.":"Sharing could not complete. Copy or download the card text instead.")}finally{n===qt&&(t.disabled=!1)}};const lo=navigator.connection,uo=()=>!!lo?.saveData;let Ke=!1,Xe=!0;try{Ke=localStorage.getItem("pft-motion")==="reduced"}catch{Xe=!1}const Nn=()=>In.matches||uo()||Ke;function Lt(){const t=Nn();document.documentElement.dataset.motion=t?"reduced":"full";const e=o("motion-toggle");e.setAttribute("aria-pressed",String(t)),e.disabled=In.matches||uo(),e.title=e.disabled?"Motion follows your device settings":t?"Reduced motion: on":"Reduced motion: off",Xe||(e.title+=" · this tab only (browser storage unavailable)"),t&&document.getAnimations().forEach(n=>n.cancel())}o("motion-toggle").onclick=()=>{Ke=!Ke;try{localStorage.setItem("pft-motion",Ke?"reduced":"full"),Xe=!0}catch{Xe=!1}Lt()};window.addEventListener("storage",t=>{if(!(t.key!=="pft-motion"&&t.key!==null)){try{if(t.storageArea&&t.storageArea!==localStorage)return;Ke=localStorage.getItem("pft-motion")==="reduced",Xe=!0}catch{Xe=!1}Lt()}});In.addEventListener("change",Lt);lo?.addEventListener?.("change",Lt);na();Lt();ca();ia();function po(t){V=t,o("trip-form").setAttribute("aria-busy",String(t));for(const e of document.querySelectorAll("#trip-form input, #trip-form textarea, #trip-form button, #trip-form select"))e.disabled=t;o("find").innerHTML=t?'Finding your field trip <span class="button-orbit" aria-hidden="true">✳</span>':'Find my field trip <span aria-hidden="true">↗</span>'}function Vt(){const t=o("intent");o("intent-count").textContent=`${t.value.length} / 280`;for(const e of document.querySelectorAll("[data-intent]"))e.setAttribute("aria-pressed",String(e.dataset.intent===t.value))}function fo(t){const e=t.closest(".choice-card");!e||Nn()||ve(e,{scale:".997",opacity:.98},240)}function Qe(t,e=!1){t.scrollIntoView({behavior:Nn()?"instant":"smooth",block:"start"}),e&&t.focus({preventScroll:!0})}function xe(t,e=t){t.focus({preventScroll:!0}),e.scrollIntoView({behavior:"instant",block:"nearest"}),requestAnimationFrame(()=>{const n=t.getBoundingClientRect();n.height&&(n.top<0||n.bottom>innerHeight)&&t.scrollIntoView({behavior:"instant",block:"nearest"})})}function Ie(t){Le++,re?.terminate(),re=null,Ht(),M(t)}function M(t){o("status").textContent=t,y("status",!0)}function Ht(){clearTimeout(kn),y("loading",!1),po(!1)}function Jt(t){Le++,re?.terminate(),re=null,Ht(),y("failure",!0),o("error-detail").textContent=t,M("Local AI is unavailable. No AI match was produced."),xe(o("retry"),o("failure"))}function ja(){if(re)return re;const t=new Worker(new URL("/assets/ai.worker-Dqb_1vpf.js",import.meta.url),{type:"module"});return re=t,re.onmessage=({data:e})=>{if(!(re!==t||e.id!==Le||!V)){if(e.type==="progress"){o("progress-label").textContent=e.label+(e.progress===void 0?"":` · ${e.progress}%${e.total?` · ${(e.loaded/1e6).toFixed(1)} / ${(e.total/1e6).toFixed(1)} MB`:""}`),o("loading-title").textContent=e.phase==="catalog"?`Reading the ${H.length} field notes`:e.phase==="match"?"Finding a little outside for you":"Preparing the open model";for(const a of document.querySelectorAll("[data-stage]"))a.dataset.active=String(a.dataset.stage===e.phase);const n=o("loading").querySelector(".loading-bar");o("loading").dataset.determinate=String(e.progress!==void 0),e.progress!==void 0?(n.setAttribute("aria-valuenow",String(e.progress)),n.setAttribute("aria-valuemin","0"),n.setAttribute("aria-valuemax","100"),n.style.setProperty("--progress",`${e.progress}%`)):n.removeAttribute("aria-valuenow")}e.type==="error"&&Jt(e.message),e.type==="result"&&(Ht(),N="semantic",ne=e.evidence,ie=e.ranked.map(n=>({activity:H.find(a=>a.id===n.id),score:n.score})),R=He(ie,D,ge),de=0,en(),Zt())}},re.onerror=e=>{re===t&&(e.preventDefault(),V?Jt(e.message||"The inference worker stopped unexpectedly."):(t.terminate(),re=null))},re}function zt(){const t=new FormData(o("trip-form"));return{lens:t.get("lens"),minutes:Number(t.get("minutes")),setting:t.get("setting"),still:o("still").checked,walk:o("walk").checked,features:t.getAll("feature")}}async function ho(){if(V)return;clearTimeout(kn),y("lab",!0);const t=o("intent").value.trim();if(!t){o("intent").setCustomValidity("Tell us what you would like to notice."),o("intent").reportValidity();return}const e=zt();if(ge=!1,It={text:t,constraints:e},le=_a(e,t),ie=[],ne=null,y("recent",!1),y("failure",!1),y("result",!1),y("empty",!1),y("weak",!1),!$t(e).length){Ht(),y("empty",!0),M("No matching activities for these constraints.");return}Le++,ne=null,o("loading").dataset.determinate="false",o("loading").querySelector(".loading-bar").removeAttribute("aria-valuenow"),o("loading-title").textContent=re?"Finding your next small adventure":"Preparing your field guide",o("progress-label").textContent="Starting local WebAssembly…";for(const a of document.querySelectorAll("[data-stage]"))a.dataset.active=String(a.dataset.stage==="download");o("loading-note").textContent=re?"Using the open model already in this browser. Your words stay here.":B()?"Preparing the model included in this app. Your words stay here.":"Loading or reusing cached weights. First visit needs internet.",y("loading",!0),po(!0),M("Loading or reusing the open model. This may take a minute on your first visit."),xe(o("cancel"),o("loading"));const n=Le;if(kn=setTimeout(()=>{n===Le&&Jt("Model setup or inference exceeded 120 seconds. Retry on a faster connection or use the keyword guide.")},12e4),!B()&&"serviceWorker"in navigator&&!navigator.serviceWorker.controller&&await new Promise(a=>{const s=()=>{clearTimeout(r),navigator.serviceWorker.removeEventListener("controllerchange",s),a()},r=setTimeout(s,5e3);navigator.serviceWorker.addEventListener("controllerchange",s),navigator.serviceWorker.controller&&s()}),n===Le&&V)try{ja().postMessage({id:n,text:t,constraints:e})}catch(a){n===Le&&V&&Jt(a instanceof Error?a.message:"The browser could not start or contact the local inference worker.")}}o("trip-form").addEventListener("submit",t=>{t.preventDefault(),ho()});o("intent").addEventListener("input",()=>{o("intent").setCustomValidity(""),Vt()});for(const t of document.querySelectorAll("[data-intent]"))t.onclick=()=>{V||(o("intent").value=t.dataset.intent,o("intent").setCustomValidity(""),t.dataset.movement==="walk"&&(o("walk").checked=!0,o("still").checked=!1,Dt()),Vt(),fo(t))};o("cancel").onclick=()=>{Ie("Loading cancelled. No match was produced."),xe(o("find"))};document.addEventListener("keydown",t=>{t.key==="Escape"&&V&&!document.querySelector("dialog[open]")&&(t.preventDefault(),o("cancel").click())});o("retry").onclick=ho;o("fallback").onclick=()=>{N="keyword",ne=null,R=He(le,D,ge),de=0,y("failure",!1),Gt(),M("Keyword guide active. This result did not use AI.")};o("rewrite").onclick=()=>Qe(o("intent"),!0);o("closest").onclick=()=>{N!=="semantic"||!ne||!R.length||(y("weak",!1),Me(),M("Showing the closest available note. Its relevance was weak; choose it only if it suits you."))};function Rt(){if(N!=="semantic"&&N!=="keyword"){y("recent",!1);return}const t=N==="semantic"?ie:le,e=new Set(D.skipped.map(X)),n=t.filter(r=>!e.has(r.activity.family)),a=new Set(D.done.map(X)),s=n.some(r=>a.has(r.activity.family));y("recent",!ge&&s),o("recent-detail").textContent="Recent content families are kept out of suggestions. With few fresh options, you can choose to revisit them. Time, setting, movement and detail rules still apply."}o("allow-repeats").onclick=()=>{N!=="semantic"&&N!=="keyword"||(ge=!0,R=He(N==="semantic"?ie:le,D,!0),de=0,Rt(),N==="semantic"?Zt():Gt(),M("You chose to include recently done tasks. Hard constraints remain unchanged."))};function Gt(){Rt(),y("weak",!1),y("result",!1),y("empty",!R.length),R.length?Me():o("recent").hidden?D.skipped.length&&xe(o("clear-feedback"),o("memory")):xe(o("allow-repeats"),o("recent"))}function Zt(){if(Rt(),y("result",!1),y("weak",!1),y("empty",!1),!R.length){y("empty",!0),M("No fresh suggestion remains within these choices. Include recently done tasks, clear set-aside preferences, or browse explicitly."),o("recent").hidden?D.skipped.length&&xe(o("clear-feedback"),o("memory")):xe(o("allow-repeats"),o("recent"));return}if(gn(R[0].score)){y("weak",!0),o("weak-detail").textContent=`Closest remaining semantic score: ${R[0].score.toFixed(3)}. Below the cautious 0.30 guard; this is not an accuracy guarantee.`,M("The model ran locally, but no clear suggestion was selected. Refine your words, undo a preference or browse the guide."),xe(o("weak-title"),o("weak"));return}M(`A local semantic suggestion from ${H.length} authored notes. Read it and decide what suits you.`),Me()}function Dt(){const t=Array.from(document.querySelectorAll('input[name="feature"]:checked')).map(s=>s.value==="light"?"Light & shadows":"Plants"),e=o("lens").value;o("refinement-summary").textContent=[...t,e==="any"?"Any lens":Ot[e]].join(" · ");const n=$t(zt()),a=n.filter(s=>!s.still).length;o("choice-summary").textContent=`${n.length} of ${H.length} notes fit these choices · ${a?a+" gentle walks available":"all in one spot"} · ${n.filter(s=>D.skipped.some(r=>X(r)===s.family)).length} set aside`}for(const t of document.querySelectorAll("#trip-form input"))t.addEventListener("change",()=>{t.id==="still"&&t.checked&&(o("walk").checked=!1),t.id==="walk"&&t.checked&&(o("still").checked=!1),ge=!1,Dt(),fo(t),On()});o("lens").onchange=()=>{ge=!1,Dt(),On(),sa()};function tt(){const t=o("guide-all").checked,e=$t(zt()),n=new Set(e.map(p=>p.id)),a=t?H:e,s=o("guide-search").value,r=ga(a,s);o("guide-summary").textContent=s.trim()?`${r.length} of ${a.length} ${t?"authored":"fitting"} notes match your search. No AI used.`:t?`All ${H.length} notes. Check each note's time and setting yourself.`:`${r.length} notes fit your time, setting and one-spot choices.`,y("guide-search-clear",!!s),y("guide-empty",r.length===0),y("guide-expand",r.length===0&&!t),o("guide-list").replaceChildren(...r.map(p=>{const d=document.createElement("button");d.className="guide-note";const l=document.createElement("small");l.textContent=`${p.minutes} MIN · ${p.still?"ONE SPOT":"GENTLE WALK"}${t?" · "+p.settings.join(" / "):""}`,D.skipped.some(b=>X(b)===p.family)?l.textContent+=" · SET ASIDE":D.done.some(b=>X(b)===p.family)&&(l.textContent+=" · RECENTLY DONE");const u=document.createElement("span");u.textContent=p.title;const f=document.createElement("span");f.className="guide-arrow",f.textContent="↗",f.setAttribute("aria-hidden","true");const m=document.createElement("span");return m.className="guide-fit",m.dataset.fits=String(n.has(p.id)),m.textContent=n.has(p.id)?"Fits your choices":"Different choices",d.append(l,u,m,f),d.onclick=()=>{o("guide").close(),Tn(p)},d}))}function Tn(t){V&&Ie("Matching cancelled. Opening an authored example.");for(const e of["failure","empty","weak"])y(e,!1);N="browse",R=[],le=[],ne=null,Me(!0,t),M("You chose an authored field note. No AI inference was used.")}o("sample-open").onclick=()=>Tn(En);da(Tn);function Xt(){V&&Ie("Matching cancelled. Opening the field guide."),y("failure",!1),o("guide-all").checked=!1,tt(),o("guide").showModal()}for(const t of["browse","browse-weak"])o(t).onclick=Xt;o("offline-open-guide").onclick=Xt;o("offline-open-notebook").onclick=()=>o("notebook-open").click();o("offline-open-saved").onclick=()=>{Mt();const t=o("open-saved");t.disabled?M("This saved card is unavailable. Browse an authored note instead."):t.click()};o("close-guide").onclick=()=>o("guide").close();o("guide-all").onchange=tt;o("guide-search").oninput=tt;o("guide-search").addEventListener("search",tt);o("guide-search-clear").onclick=()=>{o("guide-search").value="",tt(),o("guide-search").focus()};o("guide-expand").onclick=()=>{o("guide-all").checked=!0,tt(),o("guide-search").focus()};function Xn(t,e,n){o(t).replaceChildren(...e.slice(0,3).map(a=>{const s=document.createElement("p");return s.textContent=`${a.activity.title} · ${n?a.score.toFixed(3):a.score+" exact tags"}`,s}))}function Me(t=!0,e){const n=e||R[de]?.activity;if(!n){y("empty",!0);return}y("empty",!1),y("result",!0),Fe=n.id,Q=n,ze(),o("card-print-status").textContent="",Nt++,Ae.open&&Ae.close(),o("card-position").textContent=e?"":`${de+1} / ${R.length}`,o("card-position").setAttribute("aria-label",e?"Saved card":`Match ${de+1} of ${R.length}`),o("match-type").textContent=N==="semantic"?gn(R[de]?.score)?"Closest available · relevance uncertain":"Suggested by meaning, on your device":N==="browse"?"Field guide · no AI":N==="return"?"Kept trip · no new inference":N==="saved"?"Saved card · no new inference":"Keyword guide · no AI",o("match-caution").textContent=N==="semantic"?gn(R[de]?.score)?"This note has weak semantic relevance to your words. It fits your choices, but may not cover your intent. You decide.":`A suggestion from ${H.length} authored notes. Check that it suits you; the guide cannot assess local conditions.`:N==="browse"?"Chosen by you from the field guide. Check the time, setting and conditions before going.":N==="return"?"Your user-started trip kept on this browser. No new match or proof of going outside. Check current conditions before returning.":N==="saved"?"Your one saved card. No new match was made. Check the current choices before revisiting.":"An exact-keyword guide, without AI. Read the card and judge it for yourself.",o("card-number").textContent=`FIELD NOTE ${String(H.indexOf(n)+1).padStart(2,"0")}`,o("card-time").textContent=`${n.minutes} MIN · ${n.still?"ONE SPOT":"A GENTLE WALK"}`,o("card-title").textContent=n.title,o("card-subtitle").textContent=n.subtitle,o("card-lens").textContent=Ot[n.lens],o("observation-plan").hidden=!n.composition,o("observation-plan").open=!1,o("observation-receipt").textContent=n.composition?.receipt||"",o("observation-reason").textContent=n.composition?.explanation||"",o("record").textContent="Write one discovery",o("record").dataset.confirmed="false",o("record").onclick=()=>W?.open(n),On(n);const a=qo(n);o("trip-card").dataset.motif=a,o("card-motif").innerHTML=`<svg viewBox="0 0 84 80" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${Yo[a]}"/></svg>`;const s=l=>o(l).replaceChildren(...Tt[n.id].map(u=>{const f=document.createElement("li");return f.textContent=u,f}));s("pocket-cues");const r=It?.constraints,p=(n.requires||[]).map(l=>l==="light"?"direct light":"a plant in view");o("fit-receipt").textContent=N==="semantic"||N==="keyword"?`${n.minutes} min within your ${r?.minutes} · ${r?.setting} · ${n.still?"one spot":"gentle walk"}${p.length?" · you confirmed "+p.join(", "):""}${N==="semantic"&&de===0&&(D.done.length>0||D.skipped.length>0)&&ie[0]?.activity.id!==n.id?" · local preferences affected this choice":""}`:`Check before you go: ${n.minutes} min · ${n.still?"one spot":"gentle walk"} · ${n.settings.join(" / ")}${p.length?" · needs "+p.join(", "):""}`,vo(),B()&&window.dispatchEvent(new Event("pft-card-open")),o("done").onclick=()=>go(n.id,"done"),o("not-fit").onclick=()=>Ya(n),o("steps").replaceChildren(...n.steps.map(l=>{const u=document.createElement("li");return u.textContent=l,u})),o("takeaway").textContent=n.takeaway,o("explanation").textContent=N==="semantic"?`The model ranks eligible trips by cosine similarity to your intent. These are the closest matches among ${ie.length} activities that fit your choices. Local feedback keeps scores unchanged: set-aside notes and the three recently completed content families are excluded, unless you explicitly include recent tasks. Each content family appears once; an eligible curated Lens variant has its own embedded description and score.`:"This is a deterministic keyword result, not a model prediction. Retry the model to compare semantic retrieval.",Xn("semantic-list",N==="semantic"?ie:[],!0),N!=="semantic"&&(o("semantic-list").textContent="Not available; model did not run."),Xn("keyword-list",le,!1),o("evidence").textContent=ne?JSON.stringify({...ne,constraints:It?.constraints,ranking:ie.map(l=>({id:l.activity.id,score:l.score})),presentedOrder:R.map(l=>l.activity.id),localPreferences:D},null,2):"No inference evidence for this card.",y("export",!!ne),y("lab",N==="semantic"||N==="keyword"),y("another",!e&&R.length>1),y("previous-card",!e&&R.length>1),Rt();const d=Yt(Ln(),n);o("save").textContent=d?"Saved on this device ✓":"Save this card for later",o("save").setAttribute("aria-pressed",String(d)),y("save-receipt",d),y("save-error",!1),o("save-error").textContent="",o("save").removeAttribute("aria-describedby"),o("go").onclick=()=>{s("departure-cues"),o("departure-card").textContent=n.title,o("departure-steps").textContent=n.steps.map((l,u)=>`${u+1}. ${l}`).join(`

`),St?.prepare(n),o("departure").showModal()},o("save").onclick=()=>{y("save-receipt",!1),y("save-error",!1),o("save-error").textContent="",o("save").removeAttribute("aria-describedby");try{localStorage.setItem("pft-card",JSON.stringify({id:n.id,version:n.version}))}catch{xt(o("save")),xt(o("save-receipt"));const l="Browser storage is unavailable. Your card could not be saved.";o("save-error").textContent=l,y("save-error",!0),o("save").setAttribute("aria-describedby","save-error"),M(l);return}o("save").textContent="Saved on this device ✓",o("save").setAttribute("aria-pressed","true"),y("save-receipt",!0),Mt(),M("Card saved on this browser. It replaces the previous saved card; no intent is stored."),bn(o("save")),ve(o("save-receipt"),{opacity:.94,translate:"0 3px"},280)},An?.cardReady(),aa(),t&&(Qe(o("result")),o("card-title").focus({preventScroll:!0}))}function mo(t){if(V||N!=="semantic"&&N!=="keyword")return;const e=Fe;if(R=He(N==="semantic"?ie:le,D,ge),Rt(),!R.length){N==="semantic"?Zt():Gt();return}const n=R.findIndex(r=>r.activity.id===e);de=n<0?0:(n+t+R.length)%R.length,Me(!1),M(`Showing match ${de+1} of ${R.length}: ${R[de].activity.title}.`);const a=o("card-title"),s=a.getBoundingClientRect();(s.top<0||s.bottom>window.innerHeight)&&(Qe(o("result")),a.focus({preventScroll:!0}))}o("another").onclick=()=>mo(1);o("previous-card").onclick=()=>mo(-1);o("edit").onclick=()=>Qe(o("intent"),!0);o("back").onclick=()=>o("departure").close();function bo(){const t=o("departure");t.open&&t.close(),!(!Q||o("result").hidden)&&(o("quiet-card").getAttribute("aria-pressed")==="true"&&o("quiet-card").click(),W?.open(Q))}o("return-from-trip").onclick=bo;o("quiet-return").onclick=bo;function Mt(){const t=Ln();if(Fe){const e=Yt(t,H.find(n=>n.id===Fe));o("save").textContent=e?"Saved on this device ✓":"Save this card for later",o("save").setAttribute("aria-pressed",String(e)),y("save-receipt",e)}try{const e=H.find(a=>a.id===t?.id),n=Yt(t,e);y("saved",!!t?.id),o("open-saved").disabled=!n,!n&&t?.id&&(o("saved-title").textContent="Saved task unavailable in this guide version. Your saved ID was kept; browse to choose again."),e&&n&&(o("saved-title").textContent=e.title,o("open-saved").onclick=()=>{V&&Ie("Loading cancelled. Opening your saved card."),y("failure",!1),y("empty",!1),y("weak",!1),N="saved",R=[],le=[],ne=null,Me(!0,e),o("match-type").textContent="Saved card · no new inference",y("lab",!1)})}catch{y("saved",!1)}nt()}o("clear-saved").onclick=()=>{try{localStorage.removeItem("pft-card"),xt(o("save")),xt(o("save-receipt")),Mt(),y("save-receipt",!1),y("save-error",!1),o("save-error").textContent="",o("save").removeAttribute("aria-describedby"),o("save").textContent="Save this card for later",o("save").setAttribute("aria-pressed","false"),M("Saved card forgotten on this browser."),(o("result").hidden?o(V?"notebook-open":"intent"):o("save")).focus()}catch{M("Could not clear saved card.")}};o("find").addEventListener("click",()=>y("lab",!0));o("export").onclick=()=>{if(ne)try{Ge("pocket-field-trip-inference.json",JSON.stringify({createdAt:new Date().toISOString(),...ne,constraints:It?.constraints,ranking:ie.map(t=>({id:t.activity.id,score:t.score})),presentedOrder:R.map(t=>t.activity.id),localPreferences:D},null,2),"application/json"),M("Inference JSON download requested. It includes your explicit conditions and local card preferences; your raw intent and notebook are excluded. Check your device for the file.")}catch{M("Inference download could not start. The in-memory evidence was kept; try again.")}};for(const t of["about","privacy-info"])o(t).onclick=()=>o("info").showModal();o("close-info").onclick=()=>o("info").close();o("clear-cache").onclick=async()=>{if(B()){Ie("Releasing the in-memory model…"),o("cache-message").textContent="In-memory model released. The model bundled in the APK stays installed; your trip, notebook and draft were kept. The next match prepares it again, offline.";return}const t=o("clear-cache");if(t.disabled)return;t.disabled=!0,vt++,Ie("Clearing model downloads…"),ne=null,ie=[],R=[],le=[];for(const n of["result","weak","failure","empty","recent"])y(n,!1);const e=[];try{for(const n of await caches.keys())try{if(n.startsWith("pft-model-")||n.startsWith("pft-runtime-"))await caches.delete(n);else if(n.startsWith("pft-shell-")){const a=await caches.open(n);for(const s of await a.keys())new URL(s.url).pathname.startsWith("/runtime/")&&await a.delete(s)}}catch{e.push(n)}}catch{e.push("cache access")}try{for(const n of await caches.keys())(n.startsWith("pft-model-")||n.startsWith("pft-runtime-")||n.startsWith("pft-shell-")&&(await(await caches.open(n)).keys()).some(s=>new URL(s.url).pathname.startsWith("/runtime/")))&&e.push(n)}catch{e.push("verification unavailable")}yt=!1,o("cache-inventory-status").textContent="Model downloads were cleared or clearing was attempted. Check cached files again for the current inventory.",o("refresh-cache-inventory").disabled=!1,nt(),t.disabled=!1,o("cache-message").textContent=e.length?"Some model downloads could not be cleared. Your notebook and saved card were kept.":"Model downloads cleared. Your notebook, card preferences and saved card were kept. Offline AI needs a complete download again."};o("clear-personal").onclick=()=>{o("clear-personal-count").textContent=_e?`This removes ${K.entries.length} saved discoveries, your saved card, any kept trip and card preferences from this browser.${W?.hasDraft()?" Your unsaved discovery draft will also be discarded.":""} Model downloads are kept.`:"This removes unreadable notebook data (count unknown), your saved card, any kept trip and preferences. Keep a raw rescue copy before choosing removal. Model downloads stay. / 这会移除无法读取的笔记（条目数未知）、已保存卡片和偏好。移除前请保留原始救援副本。模型下载保留。",B()&&(o("clear-personal-count").textContent+=" Any private draft recovery copy is also removed. The model bundled in the APK stays installed."),o("clear-personal-dialog").showModal()};o("cancel-personal-clear").onclick=()=>o("clear-personal-dialog").close();o("confirm-personal-clear").onclick=async()=>{const t=[];if(Ve){o("personal-clear-message").textContent="Wait for the notebook save to finish before clearing records.";return}Ve=!0;let e=!1;try{if(B())try{if(!window.__pftPersistJournal)throw Error("Device notebook support unavailable");await window.__pftPersistJournal(null,me),e=!0}catch{o("personal-clear-message").textContent="Device notebook removal was not confirmed. Existing records were kept; reopen the notebook before retrying.";return}for(const n of[be,Cn,"pft-card",xn,...B()?[mt]:[]])try{localStorage.removeItem(n),localStorage.getItem(n)!==null&&t.push(n)}catch{t.push(n)}t.includes(be)||(K=to(),me=null,ye=null,Ct=!1,_e=!0,D=K.feedback,$n(),W?.reset(),De()),Mt(),St?.refresh(),Ie("Clearing personal records…"),It=null,ne=null,ie=[],R=[],le=[],Fe=null,o("intent").value="",Vt();for(const n of["result","weak","empty","failure","recent"])y(n,!1);e&&t.includes(be)&&(Ct=!0,ye="The device notebook was cleared, but its page cache could not be updated. Reopen the notebook before writing again."),o("personal-clear-message").textContent=e&&t.includes(be)?ye:t.length?"Some personal records could not be removed or verified in browser storage; no complete-clear success is claimed. Reopen before retrying.":B()?"Discoveries cleared on this device. Other card, trip and recovery copies were removed from this page; their removal is not confirmed across an immediate force-stop. Model downloads were kept.":"Discoveries, saved card, kept trip and preferences cleared. Model downloads were kept.",B()&&(o("cache-message").textContent=o("personal-clear-message").textContent),t.length||o("clear-personal-dialog").close()}finally{Ve=!1}};function On(t){const e=t||H.find(a=>a.id===Fe),n=!!e&&$t(zt()).some(a=>a.id===e.id);y("fit-warning",!!e&&!n),o("fit-warning").textContent="This task does not fit all your current choices. It is an explicit revisit or manual selection. Update your choices or browse a fitting task before going."}function Ja(){let t;try{t=localStorage.getItem(be)}catch{throw Error("Browser storage could not be read. Export is paused; nothing was changed. Your draft remains in this tab.")}if(t!==me)throw Error("Stored notebook changed since this page loaded. Reload before exporting current records; keep any unsaved draft text first. Nothing was overwritten.");return K}let Ve=!1;async function Qt(t,e=!1){if(Ve)return!1;Ve=!0;let n=!1;try{if(Ct)throw Error(ye||"Notebook saving is paused.");if(localStorage.getItem(be)!==me)throw Error("Notebook changed in another tab. Reload to read the latest records before saving; your draft was kept.");Vo(K,t);const a=JSON.stringify(t);if(B()){if(!window.__pftPersistJournal)throw Error("Device notebook support is not ready. Your draft was kept.");await window.__pftPersistJournal(a,me),n=!0}localStorage.setItem(be,a),me=a,K=t,D=t.feedback,At=!0,ye=null,_e=!0;try{localStorage.removeItem(Cn)}catch{}return De(),W?.render(),!0}catch(a){return ye=n?"The device notebook was written, but its page cache could not be updated. Keep your draft and reopen the notebook before retrying.":String(a instanceof Error?a.message:a),n&&(Ct=!0),a instanceof fn||(At=!1),e&&!(a instanceof fn)&&(K=t,D=t.feedback,De()),!1}finally{Ve=!1}}function vo(){const t=Fe,e=!!t&&D.done.some(a=>X(a)===X(t)),n=!!t&&D.skipped.some(a=>X(a)===X(t));o("card-feedback").textContent=n?"Set aside until you clear preferences.":e?"Recently done · this content family stays out until you include recent tasks.":"Optional. No proof or account needed.",o("done").setAttribute("aria-pressed",String(e)),o("not-fit").setAttribute("aria-pressed",String(n))}function De(){document.documentElement.dataset.hasDiscoveries=String(K.entries.length>0),y("return-invitation",K.entries.length>0),o("return-summary").textContent=K.entries.length?`${K.entries.length} ${K.entries.length===1?"discovery":"discoveries"} kept here. Look back at your notebook, or choose what fits today.`:"",y("memory",!!(D.done.length||D.skipped.length||Ue));for(const t of["undo-feedback","undo-card-feedback"])y(t,!!Ue),o(t).textContent=Et?"Retry saving undo":"Undo last feedback";o("memory-summary").textContent=`${D.done.length} recently done · ${D.skipped.length} set aside${At?" · on this browser":" · this session only (storage unavailable)"}`,vo(),Dt()}function $n(){Ue=null,Et=!1,o("feedback-undo-status").textContent=""}async function yo(t){return Qt({...K,feedback:t},!0)}async function go(t,e){if(V)return;const n={done:[...D.done],skipped:[...D.skipped]},a=jo(D,t,e);if(await yo(a),JSON.stringify(D)!==JSON.stringify(a)){M("Feedback not changed. "+(ye||"Existing preferences were kept."));return}Ue={before:n,after:a},Et=!1,o("feedback-undo-status").textContent="",De(),e==="skipped"&&(N==="semantic"||N==="keyword")&&(R=N==="semantic"?He(ie,D,ge):He(le,D,ge),de=0,N==="semantic"?Zt():Gt()),M(e==="done"?`Marked done by you${At?"":" for this session only (storage unavailable)"}. This content family stays out next time unless you choose to revisit it; scores stay unchanged.`:`Note set aside ${At?"on this browser":"for this session only (storage unavailable)"}. You can undo or clear preferences.`)}async function ko(){if(!Ue||V)return;const t=xa(D,Ue);if(!t){const a="Feedback changed since that action. Undo could not safely restore it; your current preferences and discoveries were kept.";o("feedback-undo-status").textContent=a,M(a);return}const e=await yo(t);if(JSON.stringify(D)!==JSON.stringify(t)){const a="Feedback not undone. "+(ye||"Current preferences and the undo choice were kept.");o("feedback-undo-status").textContent=a,M(a);return}e?(Ue=null,Et=!1):Et=!0,De(),y("empty",!1);const n=e?"Last card feedback undone and saved on this browser. Your discoveries were kept.":"Feedback undone for this session only. It could not be saved on this browser; retry saving undo, or reload to read stored preferences. Your stored discoveries were kept.";o("feedback-undo-status").textContent=n,M(n),e&&xe(o("browse"))}o("undo-feedback").onclick=ko;o("undo-card-feedback").onclick=ko;o("clear-feedback").onclick=async()=>{if(!await Qt({...K,feedback:eo()})){M("Preferences could not be cleared in storage. Discoveries and existing preferences were kept.");return}$n(),ge=!1,De(),y("empty",!1),y("recent",!1),M("Card preferences cleared. Your discoveries and model downloads were kept."),xe(o("browse"))};function Ln(){try{const t=JSON.parse(localStorage.getItem("pft-card")||"null");return t&&typeof t=="object"&&!Array.isArray(t)?t:null}catch{return null}}let yt=!1,vt=0;async function en(){const t=++vt,e=o("refresh-cache-inventory");if(e.disabled=!0,B()){try{const d=await(await fetch("/model-manifest.json")).json();o("cache-inventory-status").textContent=`Bundled pinned package: ${Object.keys(d.files).length} model files, ${d.totalBytes} bytes. Presence is packaging metadata; an actual match provides inference evidence.`}catch{o("cache-inventory-status").textContent="Bundled model inventory could not be read. Try a match or browse the authored guide."}e.disabled=!1;return}o("cache-inventory-status").textContent="Checking local cached files and runtime hashes… No inference or model download is started.";let n=!1,a=!1,s=!1,r=0,p=!1;try{if("caches"in window&&navigator.serviceWorker?.controller){const d=await caches.keys();if(t!==vt)return;const l=d.filter(v=>v.startsWith("pft-shell-")),u=await Promise.all(l.map(async v=>(await(await caches.open(v)).keys()).map(A=>new URL(A.url).pathname))),f=new URL(import.meta.url).pathname,m=[...document.querySelectorAll('link[rel="stylesheet"]')].map(v=>new URL(v.href).pathname);a=u.some(v=>["/index.html",f,...m].every(A=>v.includes(A)));const b=await caches.open(Go),h=await Promise.all(Object.entries(Zo).map(async([v,A])=>{const q=await b.match(v,{ignoreVary:!0});if(!q?.ok)return!1;const ee=await crypto.subtle.digest("SHA-256",await q.arrayBuffer());return[...new Uint8Array(ee)].map(w=>w.toString(16).padStart(2,"0")).join("")===A})),E=d.find(v=>v==="pft-model-"+Ua);if(t!==vt)return;const c=E?(await(await caches.open(E)).keys()).map(v=>new URL(v.url).pathname.split("/").pop()):[];s=h.every(Boolean),r=["model_quantized.onnx","config.json","tokenizer.json","tokenizer_config.json"].filter(v=>c.includes(v)).length,n=a&&s&&["model_quantized.onnx","config.json","tokenizer.json","tokenizer_config.json"].every(v=>c.includes(v))}}catch{n=!1,p=!0}t===vt&&(yt=n,e.disabled=!1,o("cache-inventory-status").textContent=p?"Cache access failed. Presence is unknown; browse the authored field guide and try checking again.":`Checked ${new Date().toISOString()} · controlling service worker: ${navigator.serviceWorker?.controller?"present":"absent"} · current app shell: ${a?"present":"not found"} · runtime hashes: ${s?"match":"not verified"} · pinned model filenames: ${r}/4 found. This inventory does not prove offline execution or future retention.`,nt())}o("refresh-cache-inventory").onclick=()=>en();function nt(){if(B()){o("offline-status").textContent="Android App · guide, runtime and model bundled",o("model-download-note").textContent="Offline AI is included in this APK. No model download or account is needed.",y("offline-routes",!0);return}o("offline-status").textContent=`${navigator.onLine?"Online":"Offline"} · ${yt?"app, runtime and model found in cache":"AI cache incomplete · field guide available"}`,o("model-download-note").textContent=navigator.onLine?yt?"App, runtime and model files found in this browser’s cache.":"First AI match downloads about 50 MB.":yt?"Offline · app, runtime and model files found in cache.":"Offline · AI cache incomplete. Authored notes still work.",y("offline-routes",!navigator.onLine);const t=Ln(),e=Yt(t,H.find(n=>n.id===t?.id));y("offline-open-saved",e),o("offline-open-saved").disabled=!e}window.addEventListener("online",nt);window.addEventListener("offline",nt);W=Da({get:()=>K,commit:t=>Qt(t),problem:()=>ye,readable:()=>_e,currentTask:()=>Q,browse:Xt,announce:M,onDraftChange:t=>{y("home-draft",t),An?.refresh()},onNewDraft:(t,e,n)=>St?.newDraft(t,e,n),onSaved:(t,e,n)=>St?.saved(t,e,n),openTask:t=>{V&&Ie("Opening a previous task."),N="saved",R=[],le=[],ne=null,y("weak",!1),y("failure",!1),Me(!0,t)}});St=ea({hasDraft:()=>W?.hasDraft()||!1,resumeDraft:()=>W?.resumeDraft(),openNote:t=>W?.open(t),announce:M,focusHome:()=>{W?.hasDraft()?o("home-resume-draft").focus():o("journey").querySelector("button")?.focus()},openCard:t=>{V&&Ie("Matching cancelled. Returning to your kept trip."),N="return",R=[],le=[],ne=null,y("weak",!1),y("failure",!1),Me(!0,t)}});An=Ma({hasCard:()=>!!Q&&!o("result").hidden,hasDraft:()=>W?.hasDraft()||!1,choose:()=>Qe(o("intent"),!0),take:()=>{Qe(o("result")),o("card-title").focus({preventScroll:!0})},keep:()=>{W?.hasDraft()?W.resumeDraft():Q&&!o("result").hidden&&W?.open(Q)}});o("home-resume-draft").onclick=()=>W?.resumeDraft();o("return-open").onclick=()=>o("notebook-open").click();Ba({get:()=>K,currentForExport:Ja,commit:t=>Qt(t),problem:()=>ye,readable:()=>_e,hasDraft:()=>W?.hasDraft()||!1,focusNotebook:()=>W?.focusHome(),afterRestore:()=>{$n(),W?.reset(),De()},announce:M});ya({readable:()=>_e,readRaw:()=>ma(()=>localStorage.getItem(be))});nt();Mt();Vt();Dt();De();en();const Wa=zo(()=>W?.hasDraft()?"Save or discard your discovery draft before updating. The draft remains in this tab.":V?"Finish or cancel matching before updating. Nothing was reloaded.":o("intent").value.trim()?"Keep your current intent somewhere you control, then clear the intent field before updating. It is not stored by this app.":null);!B()&&"serviceWorker"in navigator&&navigator.serviceWorker.register("/sw.js").then(Wa).catch(()=>M("Offline app caching is unavailable in this browser."));navigator.serviceWorker?.addEventListener("controllerchange",en);let pn;o("manage-packs").onclick=async()=>{const t=o("manage-packs");t.disabled=!0;try{pn||(pn=(await Jo(async()=>{const{cardPackUI:e}=await import("./card-pack-ui-C0LXisfD.js");return{cardPackUI:e}},__vite__mapDeps([0,1]))).cardPackUI()),o("pack-load-status").textContent="",pn()}catch{o("pack-load-status").textContent="Card-pack tools could not load. Your existing data was kept. Please retry."}finally{t.disabled=!1}};Ca();W?.restoreRecovery();const Va=Object.freeze(Object.defineProperty({__proto__:null},Symbol.toStringTag,{value:"Module"}));export{oo as P,Pa as a,ba as b,Ge as d,Va as m,U as p,so as r};
