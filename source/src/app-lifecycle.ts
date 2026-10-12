import { mountUpdateNotice } from "./update-notice.ts";
type InstallOffer = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function setupAppLifecycle(blockedReload: () => string | null) {
  const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
    document.getElementById(id) as T;
  const install = $<HTMLButtonElement>("install-app");
  const update = $<HTMLButtonElement>("apply-app-update");
  let offer: InstallOffer | null = null;
  let installEpoch = 0;
  let installPending = false;
  let appInstalled = matchMedia("(display-mode: standalone)").matches;
  let registration: ServiceWorkerRegistration | null = null;
  let requestedUpdate = false;
  let reloadPending = false;
  const offeredStatus =
    "Your browser offers home-screen installation. First AI use still needs its model download.";
  const renderInstall = () => {
    install.hidden = appInstalled || (!offer && !installPending);
    install.disabled = installPending && !appInstalled;
    install.textContent = installPending
      ? "Waiting for the browser…"
      : "Install on this device";
  };
  const installed = () => {
    appInstalled = true;
    installEpoch++;
    offer = null;
    renderInstall();
    $("install-app-status").textContent =
      "The browser reported this app installed. Your notebook remains on this origin.";
  };
  window.addEventListener("appinstalled", installed);
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    if (appInstalled) return;
    installEpoch++;
    offer = event as InstallOffer;
    renderInstall();
    $("install-app-status").textContent = installPending
      ? "Another installation offer arrived. Finish or dismiss the open browser prompt to continue."
      : offeredStatus;
  });
  install.onclick = async () => {
    const current = offer;
    if (!current || installPending || appInstalled) return;
    const epoch = installEpoch;
    offer = null;
    installPending = true;
    renderInstall();
    $("install-app-status").textContent =
      "Waiting for the browser’s installation choice. Your notebook stays on this origin.";
    try {
      await current.prompt();
      const choice = await current.userChoice;
      if (epoch !== installEpoch || appInstalled) return;
      $("install-app-status").textContent =
        choice.outcome === "accepted"
          ? "Installation accepted in the browser. Completion is controlled by the device."
          : "Installation dismissed. Your notebook and current page were kept.";
    } catch {
      if (epoch === installEpoch && !appInstalled)
        $("install-app-status").textContent =
          "The device could not open installation. You can keep using this page. Check installation help or wait for a new browser offer.";
    } finally {
      installPending = false;
      renderInstall();
      if (offer && !appInstalled)
        $("install-app-status").textContent = offeredStatus;
    }
  };
  const refreshUpdate = () => {
    update.hidden = !registration?.waiting && !reloadPending;
    if (registration?.waiting)
      $("app-update-status").textContent =
        "A new version is ready. Keep any unsaved text and close other app tabs before applying it.";
  };
  update.onclick = () => {
    const waiting = registration?.waiting;
    if ((!waiting && !reloadPending) || update.disabled) return;
    const reason = blockedReload();
    if (reason) {
      $("app-update-status").textContent = reason;
      return;
    }
    if (reloadPending) {
      location.reload();
      return;
    }
    requestedUpdate = true;
    update.disabled = true;
    $("app-update-status").textContent =
      "Checking for other app tabs before reloading this page…";
    waiting!.postMessage({ type: "PFT_ACTIVATE_UPDATE" });
  };
  navigator.serviceWorker?.addEventListener("message", (event) => {
    if (
      event.source !== registration?.waiting ||
      event.data?.type !== "PFT_UPDATE_BLOCKED"
    )
      return;
    requestedUpdate = false;
    update.disabled = false;
    $("app-update-status").textContent =
      "Close other app tabs or windows before updating. This page and your unsaved text were kept.";
  });
  navigator.serviceWorker?.addEventListener("controllerchange", () => {
    if (!requestedUpdate) return;
    const reason = blockedReload();
    if (!reason) {
      location.reload();
      return;
    }
    requestedUpdate = false;
    reloadPending = true;
    update.disabled = false;
    update.hidden = false;
    update.textContent = "Reload updated guide";
    $("app-update-status").textContent =
      "The new version activated while you were working. This page was kept. " +
      reason;
  });
  if (appInstalled)
    $("install-app-status").textContent =
      "Running in an app window. Your data stays on this origin; keep a JSON backup.";
  mountUpdateNotice({ blockedReload });
  return (next: ServiceWorkerRegistration) => {
    registration = next;
    refreshUpdate();
    registration.addEventListener("updatefound", () => {
      registration?.installing?.addEventListener("statechange", refreshUpdate);
    });
  };
}
