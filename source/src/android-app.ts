export const isAndroidApp = () =>
  navigator.userAgent.includes("PocketFieldTripApp/0.3.0");

type Section = "explore" | "trip" | "notebook";
declare global {
  interface Window {
    PocketAndroid?: {
      navigate: (route: Section) => boolean;
      back: () => boolean;
      state: () => { section: Section; modal: boolean; theme: string };
    };
    __pftNativeSend?: (value: object) => void;
  }
}
export function mountAndroidApp() {
  if (!isAndroidApp()) return;
  document.documentElement.dataset.androidApp = "true";
  let section: Section = "explore";
  document.documentElement.dataset.appSection = section;
  const $ = (id: string) => document.getElementById(id)!;
  const emptyTrip = document.createElement("section");
  emptyTrip.id = "android-empty-trip";
  emptyTrip.innerHTML =
    '<p class="eyebrow">YOUR POCKET CARD</p><h2>A small trip awaits.</h2><p>Choose an authored card or match your words in Explore. Start keeps its identity here for your return.</p><button type="button" class="primary">Choose a card</button>';
  $("result").before(emptyTrip);
  emptyTrip.querySelector("button")!.onclick = () => navigate("explore");
  let beforeNotebook: Section = "explore";
  const state = () => {
    if (($("notebook") as HTMLDialogElement).open && section !== "notebook") {
      beforeNotebook = section;
      section = "notebook";
      document.documentElement.dataset.appSection = section;
    }
    return {
      section,
      modal: !!document.querySelector("dialog[open]:modal"),
      theme: document.documentElement.dataset.theme || "forest",
    };
  };
  const sync = () => window.__pftNativeSend?.({ type: "shell", ...state() });
  const topDialog = () =>
    Array.from(document.querySelectorAll<HTMLDialogElement>("dialog[open]"))
      .filter((d) => d.matches(":modal"))
      .at(-1);
  const closeTop = () => {
    const d = topDialog();
    if (!d) return false;
    if (d.dispatchEvent(new Event("cancel", { cancelable: true }))) d.close();
    return true;
  };
  const navigate = (route: Section) => {
    if (!["explore", "trip", "notebook"].includes(route)) return false;
    if (topDialog()) return false;
    const book = $("notebook") as HTMLDialogElement;
    if (book.open && route !== "notebook") book.close();
    if (route === "notebook" && section !== "notebook")
      beforeNotebook = section;
    section = route;
    document.documentElement.dataset.appSection = section;
    if (route === "notebook") $("notebook-open").click();
    else if (route === "trip") {
      const target = !$("active-trip").hidden
        ? $("active-trip")
        : !$("result").hidden
          ? $("result")
          : $("android-empty-trip");
      target.scrollIntoView({ block: "start", behavior: "instant" });
      const control = target.matches("button")
        ? target
        : target.querySelector<HTMLElement>("button:not(:disabled)");
      control?.focus({ preventScroll: true });
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
      $("sample-open").focus({ preventScroll: true });
    }
    sync();
    return true;
  };
  window.PocketAndroid = {
    navigate,
    state,
    back: () => {
      if (closeTop()) return true;
      const book = $("notebook") as HTMLDialogElement;
      if (book.open) {
        book.close();
        return true;
      }
      if (section !== "explore") return navigate("explore");
      return false;
    },
  };
  $("notebook").addEventListener("close", () => {
    if (section === "notebook") {
      section = beforeNotebook;
      document.documentElement.dataset.appSection = section;
      sync();
    }
  });
  $("notebook").addEventListener("cancel", (event) => {
    if (!topDialog()) {
      event.preventDefault();
      ($("notebook") as HTMLDialogElement).close();
    }
  });
  $("notebook-open").addEventListener("click", () => {
    if (section !== "notebook") beforeNotebook = section;
    section = "notebook";
    document.documentElement.dataset.appSection = section;
    sync();
  });
  window.addEventListener("pft-card-open", () => navigate("trip"));
  $("edit").onclick = () => {
    if (navigate("explore")) {
      $("planner").scrollIntoView({ block: "start", behavior: "instant" });
      $("intent").focus();
    }
  };
  const brand = document.querySelector<HTMLAnchorElement>(".brand")!;
  brand.onclick = (e) => {
    e.preventDefault();
    navigate("explore");
  };
  const privacy = document.querySelectorAll<HTMLElement>(
    "#info > p:not(.eyebrow)",
  );
  privacy[0].textContent =
    "Transformers.js runs Xenova/all-MiniLM-L6-v2 (Apache-2.0), the pinned open q8 model through WebAssembly on this device. The Android APK includes the model, runtime and authored cards. No network permission, account, location access or model download is needed. The current matcher processes English sentences.";
  privacy[1].textContent =
    "Your saved discoveries, kept trip and choices live in this app’s private device storage. An unfinished discovery has a separate local recovery copy, removed after verified Save or explicit Discard. Your intent is not stored. Clear personal records includes draft recovery; uninstalling or clearing Android app data removes these records. Make an explicit JSON backup first. Exports use a system chooser only when requested.";
  privacy[2].textContent =
    "Guide, runtime and model files are bundled in this Android test APK. Offline matching prepares those files locally; there is no service-worker installation or remote model download. Release model from memory keeps the package and your records. Android uninstall or app-data clearing removes private records; make a JSON backup before changing installation.";
  $("install-app-status").textContent =
    "Android test App content · model included. Installation is provided by the APK.";
  for (const help of document.querySelectorAll<HTMLElement>(
    ".app-access > details",
  ))
    help.hidden = true;
  const homeDraft = $("home-draft").querySelector("p");
  if (homeDraft)
    homeDraft.textContent =
      "One unsaved discovery · kept privately for App recovery.";
  $("save-discovery").textContent = "Save discovery on this device";
  document.querySelector(".editor-privacy summary")!.textContent =
    "Save adds this discovery to your notebook";
  document.querySelector(".editor-privacy p")!.textContent =
    "Unfinished writing has a separate private recovery copy when storage works. Save adds your discovery to the notebook; Discard removes its recovery copy. Android app-data clearing or uninstalling removes local records. Matching uses English; your discovery can use any language.";
  window.addEventListener("pft-native-lifecycle", (event) => {
    const paused = (event as CustomEvent).detail === "paused";
    document.documentElement.dataset.pageVisibility = paused
      ? "hidden"
      : "visible";
    if (paused) document.getAnimations().forEach((a) => a.cancel());
  });
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      sync();
    });
  }).observe(document.documentElement, {
    attributes: true,
    subtree: true,
    attributeFilter: ["open", "data-theme", "hidden"],
  });
  window.addEventListener("pft-native-connected", sync);
}
