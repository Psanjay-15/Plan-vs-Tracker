import { useMemo } from "react";
import {
  DEFAULT_COUNTRY_CODE,
  getCountryCurrency,
} from "../constants/currencies";
import { useAuth } from "./useAuth";

const toMajorUnits = (minorUnits: number) => minorUnits / 100;

export const useCurrency = () => {
  const { user } = useAuth();
  const country = getCountryCurrency(user?.countryCode ?? DEFAULT_COUNTRY_CODE);

  return useMemo(() => {
    const formatAmount = (minorUnits: number) =>
      new Intl.NumberFormat(country.locale, {
        style: "currency",
        currency: country.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(toMajorUnits(minorUnits));

    const formatSignedAmount = (minorUnits: number) => {
      if (minorUnits === 0) return formatAmount(0);
      return `${minorUnits > 0 ? "+" : "−"}${formatAmount(Math.abs(minorUnits))}`;
    };

    return {
      countryCode: country.code,
      countryName: country.name,
      currency: country.currency,
      currencyName: country.currencyName,
      locale: country.locale,
      formatAmount,
      formatSignedAmount,
    };
  }, [country.code, country.currency, country.currencyName, country.locale, country.name]);
};
