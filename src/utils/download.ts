export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadTextFile = (
  content: string,
  filename: string,
  mimeType = "text/csv;charset=utf-8",
) => {
  downloadBlob(new Blob([content], { type: mimeType }), filename);
};
