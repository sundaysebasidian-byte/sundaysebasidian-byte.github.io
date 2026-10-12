import {
  rawRescueFile,
  RawRescueError,
  type RescueProblem,
} from "./raw-rescue.ts";

const problems: Record<RescueProblem, string> = {
  "read-failed":
    "Storage could not be read. Nothing exported; try again later. / 暂时无法读取存储，未导出，请稍后重试。",
  "not-found":
    "No stored notebook was found. Nothing exported. / 未找到已存笔记，未导出。",
  "too-large":
    "Rescue file exceeds 2 MiB. Nothing was shortened or exported; original data stays here. / 救援文件超过 2 MiB，未截断或导出，原数据仍保留。",
  changed:
    "Stored data changed. Cancel and prepare a fresh copy; nothing exported. / 存储数据已变化，请取消后重新准备，未导出。",
  "download-failed":
    "Download could not start. Original data stays here; retry or cancel. / 无法开始下载，原数据仍保留，可重试或取消。",
};
export function rawRescueUI(context: {
  readable: () => boolean;
  readRaw: () => string;
}) {
  const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
    document.getElementById(id) as T;
  const panel = $("raw-rescue-panel"),
    book = $<HTMLDialogElement>("notebook"),
    dialog = $<HTMLDialogElement>("raw-rescue-dialog");
  const prepare = $<HTMLButtonElement>("prepare-raw-rescue"),
    confirm = $<HTMLButtonElement>("download-raw-rescue");
  let staged: ReturnType<typeof rawRescueFile> | null = null;
  const say = (message: string) => {
    $("raw-rescue-status").textContent = message;
  };
  const problem = (error: unknown) =>
    problems[
      error instanceof RawRescueError ? error.problem : "download-failed"
    ];
  function sync() {
    panel.hidden = context.readable();
  }
  $("notebook-open").addEventListener("click", sync);
  sync();
  prepare.onclick = () => {
    sync();
    if (context.readable() || dialog.open || staged) return;
    try {
      staged = rawRescueFile(context.readRaw(), new Date().toISOString());
      $("raw-rescue-file-name").textContent =
        `${staged.filename} · ${staged.bytes.toLocaleString()} bytes`;
      $("raw-rescue-error").textContent = "";
      confirm.disabled = false;
      book.close();
      dialog.showModal();
      $("cancel-raw-rescue").focus();
    } catch (error) {
      staged = null;
      say(problem(error));
    }
  };
  function cancel() {
    say(
      "Rescue cancelled. Original data stays here. / 已取消救援，原数据仍保留。",
    );
    dialog.close();
  }
  $("cancel-raw-rescue").onclick = cancel;
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    cancel();
  });
  dialog.addEventListener("close", () => {
    staged = null;
    confirm.disabled = true;
    if (!book.open) book.showModal();
    prepare.focus();
  });
  confirm.onclick = () => {
    if (!staged || confirm.disabled || !dialog.open) return;
    confirm.disabled = true;
    let url: string | null = null,
      link: HTMLAnchorElement | null = null;
    try {
      if (context.readRaw() !== staged.raw) {
        staged = null;
        throw new RawRescueError("changed");
      }
      url = URL.createObjectURL(
        new Blob([staged.text], { type: "text/plain;charset=utf-8" }),
      );
      link = document.createElement("a");
      link.href = url;
      link.download = staged.filename;
      document.body.append(link);
      link.click();
      staged = null; // Repeated clicks cannot issue another request.
      say(
        "Download requested, not confirmed saved. Check your browser/system save result. Original data is unchanged. / 已请求下载，尚未确认保存；请检查浏览器或系统结果，原数据未变。",
      );
      dialog.close();
    } catch (error) {
      $("raw-rescue-error").textContent = problem(error);
      confirm.disabled = !staged;
    } finally {
      link?.remove();
      if (url) {
        const discard = url;
        setTimeout(() => URL.revokeObjectURL(discard), 1000);
      }
    }
  };
}
