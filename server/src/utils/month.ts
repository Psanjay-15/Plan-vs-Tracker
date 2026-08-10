const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const isValidMonth = (value: unknown): value is string =>
  typeof value === "string" && MONTH_PATTERN.test(value);

export const formatMonth = (month: string) => {
  const [year, monthNumber] = month.split("-");
  return `${MONTH_NAMES[Number(monthNumber) - 1]} ${year}`;
};
