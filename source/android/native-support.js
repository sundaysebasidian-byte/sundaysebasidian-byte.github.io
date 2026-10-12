(() => {
  if (window.__pftNativeFiles) return;
  window.__pftNativeFiles = true;
  window.PocketUpdateNotice?.mountUpdateNotice({installed:window.__pftInstalledBuild, blockedReload:() => {
    if (document.getElementById('draft-status')?.hidden === false || (document.getElementById('discovery-editor')?.open && document.getElementById('discovery-text')?.value.trim())) return 'Save or discard your discovery draft before updating. The draft remains in this tab.';
    if (document.getElementById('intent')?.value.trim()) return 'Keep your current intent somewhere you control, then clear the intent field before updating. It is not stored by this app.';
    return null;
  }});
  const status = document.createElement('p');
  status.id = 'native-transfer-status';
  status.setAttribute('role', 'status');
  status.className = 'muted';
  const receipt = document.createElement('aside'); receipt.id = 'android-file-receipt'; receipt.hidden = true;
  const dismiss = document.createElement('button'); dismiss.type = 'button'; dismiss.textContent = 'Dismiss';
  dismiss.onclick = () => { receipt.hidden = true; };
  receipt.append(status, dismiss); document.body.append(receipt);
  document.getElementById('install-app-status').textContent = 'Android test app · installed package. Model included; no browser installation needed.';
  document.getElementById('install-app').hidden = true;
  document.getElementById('clear-cache').textContent = 'Release model from memory';
  document.querySelector('#failure > p').textContent = 'The included local model could not run. Try preparing it again, or use the clearly labeled keyword guide below. The keyword guide does not use AI. No network connection or model download is needed in this App.';
  const note = message => { status.textContent = message; receipt.hidden = false; };
  let saving = false;
  let port = null;
  const journalPending = new Map();
  window.__pftPersistJournal = (raw, expected) => new Promise((resolve, reject) => {
    if (!port) { reject(new Error('Device notebook support is not ready. Keep this draft and try again.')); return; }
    const id = crypto.randomUUID();
    const timer = setTimeout(() => { journalPending.delete(id); reject(new Error('Notebook saving was not confirmed. A stored copy may exist; keep this draft and reopen the notebook before retrying.')); }, 30000);
    journalPending.set(id, {resolve, reject, timer});
    port.postMessage(JSON.stringify({type:'journal',id,raw,expected}));
  });
  window.addEventListener('message', event => {
    if (event.data !== 'pft-native-port' || !event.ports[0]) return;
    // Java's exact targetOrigin scopes delivery to the trusted local page.
    // Its native sender origin is not a same-origin browser window.
    window.__pftNativeHandshake = {origin: event.origin, ports: event.ports.length};
    port = event.ports[0];
    port.onmessage = event => {
      try {
        const {id,state} = JSON.parse(event.data);
        if (state.startsWith('journal-')) {
          const pending = journalPending.get(id);
          if (pending) {
            clearTimeout(pending.timer); journalPending.delete(id);
            if (state === 'journal-saved') pending.resolve();
            else pending.reject(new Error('Device notebook write was not confirmed. Your draft was kept; reopen the notebook before retrying.'));
          }
          return;
        }
        saving = false;
        note(state === 'saved' ? 'File saved to your chosen destination.' : state === 'written-unverified' ? 'File save could not be verified. A partial or complete copy may exist. Check your chosen destination before repeating export; your notebook stays here.' : state === 'interrupted' ? 'A file action was interrupted. A partial or complete export may exist; check your chosen destination before trying again. Your notebook stays here. Choose an import file again if needed.' : state === 'busy' ? 'A system file action is already pending. Finish or cancel it first.' : state === 'cancelled' ? 'Save cancelled. No export bytes were written; your notebook stays here.' : state === 'print-failed' ? 'Print preview could not open. Save the reviewed JSON or card text instead.' : 'The file could not be saved. Your notebook stays here; try again.');
      } catch {}
    };
    port.start();
    window.__pftNativeSend = value => port.postMessage(JSON.stringify(value));
    window.dispatchEvent(new Event("pft-native-connected"));
  });
  window.print = () => {
    if (!port) { note('Print preview is unavailable. Save the reviewed JSON or card text instead.'); return; }
    note('Opening system print preview. Choose a printer or Save as PDF there.');
    port.postMessage(JSON.stringify({type:'print',id:crypto.randomUUID()}));
  };
  const originalClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (!this.download || !this.href.startsWith('blob:')) return originalClick.call(this);
    if (!port) { note('System file support is not ready. Nothing was requested; try again.'); return; }
    if (saving) { note('A system save is already pending. Finish or cancel that chooser first.'); return; }
    saving = true;
    const name = this.download;
    note('Choose a destination. The file is not saved until you confirm.');
    fetch(this.href).then(response => response.arrayBuffer()).then(bytes => {
      if (bytes.byteLength > 2 * 1024 * 1024) throw new Error('File too large');
      const array = new Uint8Array(bytes); let binary = '';
      for (let offset = 0; offset < array.length; offset += 8192) binary += String.fromCharCode(...array.subarray(offset, offset + 8192));
      port.postMessage(JSON.stringify({type:'save',id:crypto.randomUUID(),name,base64:btoa(binary)}));
    }).catch(() => { saving = false; note('The file could not be prepared. Nothing was saved; your notebook stays here.'); });
  };
})();
