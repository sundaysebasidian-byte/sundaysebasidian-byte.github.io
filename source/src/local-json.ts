// Blob.text() repairs malformed UTF-8 with replacement characters. JSON imports
// must preserve the user's bytes or reject the file before staging any data.
export async function readLocalJSON(file: Blob): Promise<string> {
  const bytes = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw Error(
      "This JSON file contains invalid UTF-8. Choose an intact backup or card pack. Nothing was changed.",
    );
  }
}
