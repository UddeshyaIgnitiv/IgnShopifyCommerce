'use client';

import { getAllCountries, getRegionsByCountryCode } from 'lib/utils/countryRegion';
import { useEffect, useState } from 'react';

export default function RegisterCompanyPage() {
  const [formData, setFormData] = useState({
    name: '',
    externalId: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    locationName: '',
    address1: '',
    city: '',
    province: '',
    zip: '',
    country: '',
  });

  const [status, setStatus] = useState('');
  const [regions, setRegions] = useState<{ name: string; shortCode?: string }[]>([]);
  const [countries, setCountries] = useState<{ name: string; code: string }[]>([]);

  useEffect(() => {
    setCountries(getAllCountries());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'country') {
      const countryRegions = getRegionsByCountryCode(value);
      setRegions(countryRegions);
      setFormData((prev) => ({ ...prev, province: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Submitting...');

    try {
      // ✅ Step 2: Create Company (no phone sent)
      const { phone, ...companyData } = formData; // Exclude raw phone from this request
      const res = await fetch('/api/register/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData),
      });

      const result = await res.json();
      const company = result?.company;

      if (!res.ok || !company) {
        const msg = result?.message || 'Unknown error during company creation.';
        setStatus(`❌ Company creation failed: ${msg}`);
        return;
      }

      setStatus(`✅ Company "${company.name}" created!`);

      // ✅ Step 3: Register customer/contact
      const contactRes = await fetch('/api/register/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          companyId: company.id,
        }),
      });

      const contactResult = await contactRes.json();
      const customer = contactResult?.contact?.customer;
      const contactErrors = contactResult?.error || customer?.userErrors;

      if (!contactRes.ok || !customer || (Array.isArray(contactErrors) && contactErrors.length > 0)) {
        const msg = Array.isArray(contactErrors)
          ? contactErrors[0]?.message
          : contactErrors || 'Unknown error during contact creation.';
        setStatus(`❌ Contact/customer creation failed: ${msg}`);
        return;
      }

      setStatus((prev) => `${prev}\n✅ Contact "${customer.firstName}" created!`);

      // ✅ Step 4: Send invite
      const inviteRes = await fetch('/api/register/email-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customer.id }),
      });

      const inviteResult = await inviteRes.json();
      const inviteErrors = inviteResult?.error || inviteResult?.data?.customerSendAccountInviteEmail?.userErrors;

      if (!inviteRes.ok || (Array.isArray(inviteErrors) && inviteErrors.length > 0)) {
        const msg = Array.isArray(inviteErrors)
          ? inviteErrors[0]?.message
          : inviteErrors || 'Unknown error while sending invite.';
        setStatus((prev) => `${prev}\n❌ Invite failed: ${msg}`);
      } else {
        setStatus((prev) => `${prev}\n✅ Invite sent successfully!`);
      }
    } catch (error: unknown) {
      console.error('Client-side error:', error);
      setStatus(`❌ Error: ${(error as Error).message || 'Unexpected error'}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Register Your Company</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[{ name: 'firstName', placeholder: 'First Name' },
            { name: 'lastName', placeholder: 'Last Name' },
            { name: 'email', placeholder: 'Email', type: 'email' },
            { name: 'phone', placeholder: 'Phone Number' },
            { name: 'name', placeholder: 'Company Name' },
            { name: 'externalId', placeholder: 'External ID' },
            { name: 'locationName', placeholder: 'Location Name' },
            { name: 'address1', placeholder: 'Address Line 1' },
            { name: 'city', placeholder: 'City' },
            { name: 'zip', placeholder: 'Postal/ZIP Code' }].map(({ name, placeholder, type = 'text' }) => (
            <input
              key={name}
              type={type}
              name={name}
              placeholder={placeholder}
              value={(formData as any)[name]}
              onChange={handleChange}
              required
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ))}

          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Country</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            name="province"
            value={formData.province}
            onChange={handleChange}
            required
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Province/State</option>
            {regions.map((r) => (
              <option key={r.name} value={r.shortCode || r.name}>
                {r.name}
              </option>
            ))}
          </select>

          <div className="col-span-1 sm:col-span-2 text-center mt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition"
            >
              Register Company
            </button>
          </div>
        </form>

        {status && (
          <pre className="mt-4 text-sm text-center text-gray-700 whitespace-pre-wrap">{status}</pre>
        )}
      </div>
    </div>
  );
}
