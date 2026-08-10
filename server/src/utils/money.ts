export const majorToMinorUnits = (value: number) => Math.round(value * 100);

export const minorToMajorUnits = (minorUnits: number) =>
  Number((minorUnits / 100).toFixed(2));

export const parseMajorAmount = (raw: string) => {
  const normalized = raw.trim().replace(/,/g, "");

  if (!normalized || !/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const amount = majorToMinorUnits(Number(normalized));
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
};
