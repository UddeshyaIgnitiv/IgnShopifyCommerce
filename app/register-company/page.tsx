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
    role: 'buyer',
  });

  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [regions, setRegions] = useState<{ name: string; shortCode?: string }[]>([]);
  const [countries, setCountries] = useState<{ name: string; code: string }[]>([]);

  useEffect(() => {
    setCountries(getAllCountries());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));

    if (name === 'country') {
      const countryRegions = getRegionsByCountryCode(value);
      setRegions(countryRegions);
      setFormData((prev) => ({ ...prev, province: '' }));
    }
  };

  const validateFields = () => {
    const requiredFields = [
      'name',
      'externalId',
      'email',
      'firstName',
      'lastName',
      'phone',
      'locationName',
      'address1',
      'city',
      'province',
      'zip',
      'country',
      'role',
    ];

    const newErrors: Record<string, string> = {};
    requiredFields.forEach((field) => {
      if (!formData[field as keyof typeof formData]?.trim()) {
        newErrors[field] = 'This field is required.';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    if (!validateFields()) return;

    let companyId = null;
    let customerId = null;

    try {
      const { phone, ...companyData } = formData;
      setStatus('🚀 Validating company creation...');

      // Step 1: Create company
      const res = await fetch('/api/register/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData),
      });

      const result = await res.json();
      const company = result?.company;

      if (!res.ok || !company) {
        const msg = result?.error?.[0]?.message || result?.message || 'Unknown error during company creation.';
        setStatus((prev) => `${prev}\n❌ Company creation failed: ${msg}`);
        return;
      }

      companyId = company.id;
      setStatus((prev) => `${prev}\n✅ Company "${company.name}" created!`);

      // Step 2: Create customer and assign role
      const contactRes = await fetch('/api/register/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, companyId: company.id }),
      });

      const contactResult = await contactRes.json();
      const customer = contactResult?.contact?.customer;
      const contactErrors = contactResult?.error || customer?.userErrors;

      if (!contactRes.ok || !customer || (Array.isArray(contactErrors) && contactErrors.length > 0)) {
        const msg = Array.isArray(contactErrors)
          ? contactErrors[0]?.message
          : contactErrors || 'Unknown error during contact creation.';
        setStatus((prev) => `${prev}\n❌ Customer creation failed: ${msg}`);

        await fetch(`/api/delete/company/${companyId}`, { method: 'DELETE' });
        return;
      }

      customerId = customer.id;
      setStatus((prev) => `${prev}\n✅ Customer "${customer.firstName}" created and assigned to company!`);
      setStatus((prev) => `${prev}\n✅ Role "${formData.role}" assigned to the customer!`);

      // Step 3: Send email invite
      const inviteRes = await fetch('/api/register/email-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });

      const inviteResult = await inviteRes.json();
      const inviteErrors = inviteResult?.error || inviteResult?.data?.customerSendAccountInviteEmail?.userErrors;

      if (!inviteRes.ok || (Array.isArray(inviteErrors) && inviteErrors.length > 0)) {
        const msg = Array.isArray(inviteErrors)
          ? inviteErrors[0]?.message
          : inviteErrors || 'Unknown error while sending invite.';
        setStatus((prev) => `${prev}\n❌ Invite failed: ${msg}`);

        await fetch(`/api/delete/customer/${customerId}`, { method: 'DELETE' });
        await fetch(`/api/delete/company/${companyId}`, { method: 'DELETE' });
        return;
      }

      setStatus((prev) => `${prev}\n✅ Invite sent successfully!`);
    } catch (error: unknown) {
      console.error('Client-side error:', error);
      setStatus((prev) => `${prev}\n❌ Unexpected error: ${(error as Error).message || 'Something went wrong'}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Register Your Company</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[ 
            { name: 'firstName', placeholder: 'First Name' },
            { name: 'lastName', placeholder: 'Last Name' },
            { name: 'email', placeholder: 'Email', type: 'email' },
            { name: 'phone', placeholder: 'Phone Number' },
            { name: 'name', placeholder: 'Company Name' },
            { name: 'externalId', placeholder: 'External ID' },
            { name: 'locationName', placeholder: 'Location Name' },
            { name: 'address1', placeholder: 'Address Line 1' },
            { name: 'city', placeholder: 'City' },
            { name: 'zip', placeholder: 'Postal/ZIP Code' },
          ].map(({ name, placeholder, type = 'text' }) => (
            <div key={name} className="flex flex-col">
              <input
                type={type}
                name={name}
                placeholder={placeholder}
                value={formData[name as keyof typeof formData]}
                onChange={handleChange}
                className={`border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                  errors?.[name] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors?.[name] && <span className="text-red-500 text-xs mt-1">{errors[name]}</span>}
            </div>
          ))}

          {/* Role Dropdown */}
          <div className="flex flex-col">
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                errors?.role ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            >
              <option value="buyer">Buyer</option>
              <option value="approver">Approver</option>
              <option value="admin">Admin</option>
            </select>
            {errors?.role && <span className="text-red-500 text-xs mt-1">{errors.role}</span>}
          </div>

          {/* Country Dropdown */}
          <div className="flex flex-col">
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              className={`border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                errors?.country ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            >
              <option value="">Select Country</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors?.country && <span className="text-red-500 text-xs mt-1">{errors.country}</span>}
          </div>

          {/* Province/State Dropdown */}
          <div className="flex flex-col">
            <select
              name="province"
              value={formData.province}
              onChange={handleChange}
              className={`border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                errors?.province ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            >
              <option value="">Select Province/State</option>
              {regions.map((r) => (
                <option key={r.name} value={r.shortCode || r.name}>
                  {r.name}
                </option>
              ))}
            </select>
            {errors?.province && <span className="text-red-500 text-xs mt-1">{errors.province}</span>}
          </div>

          {/* Submit Button */}
          <div className="col-span-1 sm:col-span-2 text-center mt-6">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg w-full sm:w-auto font-semibold hover:bg-blue-700 transition duration-200"
            >
              Register Company
            </button>
          </div>
        </form>

          {status && (
            <pre className="mt-4 text-sm text-left bg-gray-100 p-4 rounded border text-gray-800 whitespace-pre-wrap">
              {status}
            </pre>
          )}
        {/* <div className="mt-4 text-center">
          <pre>{status}</pre>
        </div> */}
      </div>
    </div>
  );
}
