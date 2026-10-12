// One print surface for explicit card/pack requests and the browser print command.
// Screen content (including notebook dialogs) never becomes the print payload.
let requested: HTMLElement[] | null = null;
export class PrintNotReadyError extends Error {}

export function printLine(parent: HTMLElement, tag: string, value: string) {
  const element = document.createElement(tag);
  element.textContent = value;
  parent.append(element);
  return element;
}

export function clearPrintSheet() {
  requested = null;
  document.getElementById("print-pack-sheet")?.remove();
}

function render(pages: HTMLElement[]) {
  let sheet = document.getElementById("print-pack-sheet");
  if (!sheet) {
    sheet = document.createElement("section");
    sheet.id = "print-pack-sheet";
    sheet.setAttribute("aria-hidden", "true");
    document.body.append(sheet);
  }
  sheet.replaceChildren(...pages);
}

export function setupPrintSheet(current: () => HTMLElement[]) {
  window.addEventListener("beforeprint", () => render(requested ?? current()));
  window.addEventListener("afterprint", clearPrintSheet);
}

export function requestPrint(pages: HTMLElement[]) {
  // A not-yet-loaded document can defer beforeprint until after print() returns,
  // losing the explicit pack/card request. Ask for a retry instead of queuing it.
  if (document.readyState !== "complete") {
    clearPrintSheet();
    throw new PrintNotReadyError("The page is still loading.");
  }
  requested = pages;
  render(pages);
  try {
    window.print();
  } catch (error) {
    clearPrintSheet();
    throw error;
  } finally {
    // Some browsers silently ignore print(). A later browser print command must
    // rebuild from the live card/conditions rather than reuse this request.
    requested = null;
  }
}
