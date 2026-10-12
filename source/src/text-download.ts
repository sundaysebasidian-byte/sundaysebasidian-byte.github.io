// A download request, not a claim that the user kept a file. The text is
// literal UTF-8 and never interpreted as a document, HTML or a script.
export function downloadText(
  filename: string,
  text: string,
  type = "text/plain;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  let link: HTMLAnchorElement | undefined;
  let requested = false;
  try {
    link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    requested = true;
  } finally {
    link?.remove();
    if (requested) setTimeout(() => URL.revokeObjectURL(url), 1000);
    else URL.revokeObjectURL(url);
  }
}
