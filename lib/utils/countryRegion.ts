import { allCountries } from 'country-region-data';

type Region = {
  name: string;
  shortCode?: string;
};

type Country = {
  name: string;
  code: string;
};

/**
 * Get all countries in the form of { name, code }
 */
export const getAllCountries = (): Country[] => {
  return allCountries.map(([countryName, countryShortCode]) => ({
    name: countryName,
    code: countryShortCode,
  }));
};

/**
 * Get all regions (states/provinces) for a given country short code
 */
export const getRegionsByCountryCode = (countryCode: string): Region[] => {
  const countryTuple = allCountries.find(([_name, code]) => code === countryCode);

  if (!countryTuple || !Array.isArray(countryTuple[2])) return [];

  return countryTuple[2].map(([regionName, regionShortCode]) => ({
    name: regionName,
    shortCode: regionShortCode,
  }));
};
