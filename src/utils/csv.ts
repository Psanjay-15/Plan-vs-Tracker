const normalizeHeader = (value: string) =>
  value.replace(/^\uFEFF/, "").trim().toLowerCase();

export const parseCsv = (input: string): string[][] => {
  const rows: string[][] = [];
  let currentField = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  const pushField = () => {
    currentRow.push(currentField);
    currentField = "";
  };

  const pushRow = () => {
    const isEmptyRow =
      currentRow.length === 0 ||
      (currentRow.length === 1 && currentRow[0].trim() === "");

    if (!isEmptyRow) {
      rows.push(currentRow);
    }

    currentRow = [];
  };

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        currentField += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      pushField();
      continue;
    }

    if (char === "\n") {
      pushField();
      pushRow();
      continue;
    }

    if (char === "\r") {
      pushField();
      pushRow();
      if (next === "\n") index += 1;
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    pushField();
    pushRow();
  }

  return rows;
};

export const stringifyCsv = (rows: Array<Array<string | number | null | undefined>>) =>
  rows
    .map((row) =>
      row
        .map((value) => {
          const text = value == null ? "" : String(value);
          if (/[",\r\n]/.test(text)) {
            return `"${text.replace(/"/g, '""')}"`;
          }
          return text;
        })
        .join(","),
    )
    .join("\n");

export const mapCsvHeaders = (headerRow: string[]) => {
  const indexes: Record<string, number> = {};

  headerRow.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    if (normalized) indexes[normalized] = index;
  });

  return indexes;
};
