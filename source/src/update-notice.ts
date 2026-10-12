type InstalledBuild = {
  apkVersion: string;
  sourceCommit: string;
  guide: string;
  sourceDirty?: boolean;
};
export function mountUpdateNotice(
  options: {
    blockedReload?: () => string | null;
    installed?: InstalledBuild;
  } = {},
) {
  const update = document.getElementById(
    "apply-app-update",
  ) as HTMLButtonElement;
  const status = document.getElementById("app-update-status")!;
  if (!update || !status) return;
  let notice = document.getElementById("app-update-notice");
  if (notice && options.installed) {
    notice.dataset.installed = JSON.stringify(options.installed);
    notice.dispatchEvent(new Event("pft-installed-build"));
    return;
  }
  if (notice) return;
  const text = <T extends keyof HTMLElementTagNameMap>(
    tag: T,
    value: string,
  ) => {
    const element = document.createElement(tag);
    element.textContent = value;
    return element;
  };
  notice = document.createElement("section");
  notice.id = "app-update-notice";
  notice.setAttribute("aria-label", "Guide update / 指南更新");
  notice.hidden = true;
  if (options.installed)
    notice.dataset.installed = JSON.stringify(options.installed);
  const heading = text(
    "strong",
    "A guide update is available. / 有指南更新可用。",
  );
  const versions = text("p", "");
  versions.id = "app-update-versions";
  notice.append(heading, versions, status, update);
  document.querySelector("main")!.prepend(notice);
  const quick = text("button", "Update / 更新");
  quick.id = "review-guide-update";
  quick.type = "button";
  quick.className = "text-button";
  quick.hidden = true;
  quick.setAttribute(
    "aria-label",
    "Review available guide update / 查看指南更新",
  );
  const navigation = document.querySelector(".header-actions");
  navigation?.append(quick);
  const header = document.querySelector("header");
  if (header) header.style.flexWrap = "wrap";
  quick.onclick = () => {
    notice!.scrollIntoView({ block: "start", behavior: "instant" });
    update.click();
  };
  const info = document.getElementById("info")!;
  const versionInfo = text("p", "");
  versionInfo.id = "app-version-info";
  versionInfo.className = "muted";
  const fromInfo = text("button", "Review guide update / 查看指南更新");
  fromInfo.type = "button";
  fromInfo.className = "secondary";
  fromInfo.hidden = true;
  info.append(versionInfo, fromInfo);
  fromInfo.onclick = () => {
    (info as HTMLDialogElement).close();
    update.click();
  };
  const dialog = document.createElement("dialog");
  dialog.id = "app-update-confirm";
  dialog.setAttribute("aria-labelledby", "app-update-confirm-title");
  const title = text("h2", "Apply this guide update? / 应用指南更新？");
  title.id = "app-update-confirm-title";
  const detail = text(
    "p",
    "Updating reloads this page. Save your discovery draft and keep unfinished intent first. Saved notebook data stays here. / 更新会重新加载页面，请先保存笔记草稿并保留未提交的意图。已保存的笔记仍留在此处。",
  );
  const confirmationVersions = text("p", "");
  confirmationVersions.id = "app-update-confirm-versions";
  const cancel = text("button", "Keep current guide / 暂不更新");
  cancel.id = "cancel-app-update";
  cancel.type = "button";
  cancel.className = "secondary";
  const confirm = text("button", "Apply & reload / 应用并重载");
  confirm.id = "confirm-app-update";
  confirm.type = "button";
  confirm.className = "primary";
  dialog.append(title, detail, confirmationVersions, cancel, confirm);
  document.body.append(dialog);
  const style = document.createElement("style");
  style.textContent = `#app-update-notice{border:1px solid #84998b;border-radius:16px;padding:16px;margin:12px 0 20px;background:#f5f5e9;color:#244d3c}#app-update-notice[hidden]{display:none}#app-update-notice p,#app-version-info,#app-update-confirm p{overflow-wrap:anywhere;line-height:1.55}#app-update-notice button,#app-update-confirm button{min-height:44px;max-width:100%;white-space:normal}#app-update-confirm button{margin:6px 6px 0 0}#app-update-versions,#app-version-info{font-size:13px}#app-update-confirm{max-width:480px;width:calc(100% - 32px);box-sizing:border-box;max-height:calc(100dvh - 32px);overflow:auto}@media(max-width:420px){#app-update-confirm button{width:100%;margin-right:0}}`;
  document.head.append(style);
  style.textContent += "#review-guide-update{min-height:44px;font-size:12px}";
  let pendingGuide = "not reported",
    lastWaiting: ServiceWorker | null = null;
  let inspection = 0;
  const runningGuide =
    [...document.scripts]
      .map((s) => s.src.match(/\/assets\/index-([^/]+)\.js$/)?.[1])
      .find(Boolean) || "development";
  function render() {
    const installed: InstalledBuild | undefined = notice!.dataset.installed
      ? JSON.parse(notice!.dataset.installed)
      : undefined;
    const ready = !update.hidden;
    const mismatch = installed && installed.guide !== runningGuide;
    notice!.hidden = !ready && !mismatch;
    heading.textContent = ready
      ? "A guide update is ready. / 指南更新已就绪。"
      : "New app installed; preparing its guide update. / 新应用已安装，正在准备指南更新。";
    const line = `${installed ? `Installed app ${installed.apkVersion} (${installed.sourceCommit.slice(0, 7)}${installed.sourceDirty ? ", modified" : ""}) · Packaged guide ${installed.guide} · ` : ""}Running guide ${runningGuide}${ready ? ` · Waiting guide ${pendingGuide}` : ""}`;
    versions.textContent =
      versionInfo.textContent =
      confirmationVersions.textContent =
        line;
    fromInfo.hidden = !ready;
    quick.hidden = !ready;
    if (ready && update.textContent !== "Review guide update / 查看指南更新")
      update.textContent = "Review guide update / 查看指南更新";
  }
  async function inspectWaiting() {
    const request = ++inspection;
    const registration = await navigator.serviceWorker
      ?.getRegistration()
      .catch(() => undefined);
    if (request !== inspection) return;
    const waiting = registration?.waiting;
    if (!waiting || waiting === lastWaiting) return;
    lastWaiting = waiting;
    pendingGuide = "not reported";
    render();
    const channel = new MessageChannel();
    const timer = setTimeout(() => {
      channel.port1.close();
      channel.port2.close();
    }, 2000);
    channel.port1.onmessage = (event) => {
      if (waiting !== lastWaiting || registration?.waiting !== waiting) {
        clearTimeout(timer);
        channel.port1.close();
        channel.port2.close();
        return;
      }
      if (
        typeof event.data?.guide !== "string" ||
        !/^[A-Za-z0-9_-]{1,80}$/.test(event.data.guide)
      )
        return;
      pendingGuide = event.data.guide;
      clearTimeout(timer);
      channel.port1.close();
      channel.port2.close();
      render();
    };
    try {
      waiting.postMessage({ type: "PFT_GUIDE_INFO" }, [channel.port2]);
    } catch {
      clearTimeout(timer);
      channel.port1.close();
      channel.port2.close();
    }
  }
  const previous = update.onclick;
  update.onclick = (event) => {
    if (update.disabled || update.hidden || dialog.open) return;
    const reason = options.blockedReload?.();
    if (reason) {
      status.textContent = reason;
      render();
      return;
    }
    render();
    dialog.showModal();
    cancel.focus();
  };
  const close = () => {
    dialog.close();
    update.focus();
  };
  cancel.onclick = close;
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  confirm.onclick = (event) => {
    if (!dialog.open || confirm.disabled) return;
    const reason = options.blockedReload?.();
    close();
    if (reason) {
      status.textContent = reason;
      render();
      return;
    }
    previous?.call(update, event); // Existing guard and worker multi-client check stay authoritative.
  };
  new MutationObserver(() => {
    render();
    void inspectWaiting();
  }).observe(update, {
    attributes: true,
    attributeFilter: ["hidden", "disabled"],
  });
  new MutationObserver(() => {
    render();
    void inspectWaiting();
  }).observe(status, {
    childList: true,
    subtree: true,
  });
  notice.addEventListener("pft-installed-build", render);
  navigator.serviceWorker?.addEventListener("controllerchange", render);
  render();
  void inspectWaiting();
}
