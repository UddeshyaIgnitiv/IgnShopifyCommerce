import { getAllCountries, getRegionsByCountryCode } from './countryRegion';

export function normalizeAddressForShopify(address: any) {
  const countries = getAllCountries();

  const matchedCountry = countries.find((c) =>
    [c.name.toLowerCase(), c.code.toLowerCase()].includes(address.country?.toLowerCase())
  );

  const countryCode = matchedCountry?.code || address.country;

  if (!matchedCountry) {
    console.warn(`⚠️ Unrecognized country: "${address.country}". Using as-is.`);
  }

  const regions = getRegionsByCountryCode(countryCode);

  const matchedRegion = regions.find((r) =>
    [r.name.toLowerCase(), r.shortCode?.toLowerCase()].includes(address.province?.toLowerCase())
  );

  const provinceCode = matchedRegion?.shortCode || address.province;

  if (!matchedRegion) {
    console.warn(`⚠️ Unrecognized province "${address.province}" in country "${countryCode}". Using as-is.`);
  }

  return {
    ...address,
    country: countryCode,
    province: provinceCode,
  };
}
