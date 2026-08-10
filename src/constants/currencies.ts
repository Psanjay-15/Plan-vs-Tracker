export interface CountryCurrency {
  code: string;
  name: string;
  currency: string;
  currencyName: string;
  locale: string;
}

export const COUNTRY_CURRENCIES: CountryCurrency[] = [
  {
    code: "US",
    name: "United States",
    currency: "USD",
    currencyName: "US Dollar",
    locale: "en-US",
  },
  {
    code: "IN",
    name: "India",
    currency: "INR",
    currencyName: "Indian Rupee",
    locale: "en-IN",
  },
  {
    code: "GB",
    name: "United Kingdom",
    currency: "GBP",
    currencyName: "British Pound",
    locale: "en-GB",
  },
  {
    code: "EU",
    name: "Eurozone",
    currency: "EUR",
    currencyName: "Euro",
    locale: "de-DE",
  },
  {
    code: "CA",
    name: "Canada",
    currency: "CAD",
    currencyName: "Canadian Dollar",
    locale: "en-CA",
  },
  {
    code: "AU",
    name: "Australia",
    currency: "AUD",
    currencyName: "Australian Dollar",
    locale: "en-AU",
  },
  {
    code: "JP",
    name: "Japan",
    currency: "JPY",
    currencyName: "Japanese Yen",
    locale: "ja-JP",
  },
  {
    code: "SG",
    name: "Singapore",
    currency: "SGD",
    currencyName: "Singapore Dollar",
    locale: "en-SG",
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    currency: "AED",
    currencyName: "UAE Dirham",
    locale: "en-AE",
  },
  {
    code: "CH",
    name: "Switzerland",
    currency: "CHF",
    currencyName: "Swiss Franc",
    locale: "de-CH",
  },
];

export const DEFAULT_COUNTRY_CODE = "US";

export const getCountryCurrency = (countryCode?: string | null) =>
  COUNTRY_CURRENCIES.find((country) => country.code === countryCode) ??
  COUNTRY_CURRENCIES.find((country) => country.code === DEFAULT_COUNTRY_CODE)!;
