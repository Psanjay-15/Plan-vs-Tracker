export const CHART_COLORS = {
  plan: "#8f3b20",
  actual: "#d66a3a",
  under: "#4d7c57",
  over: "#bd4035",
  grid: "#e7ddd2",
  axis: "#a09489",
  text: "#746a62",
  tooltipBorder: "#d7c9bb",
  tooltipBg: "#fffdf9",
  palette: [
    "#d66a3a",
    "#8f3b20",
    "#4d7c57",
    "#a66716",
    "#bd4035",
    "#5a7d8c",
    "#c4875a",
    "#6b5b4d",
  ],
} as const;

export const toMajorUnits = (minorUnits: number) =>
  Number((minorUnits / 100).toFixed(2));

export const formatMonthLabel = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
};
