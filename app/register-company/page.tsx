'use client';

import IgnIcon from 'components/icons/ignIcon';
import { getAllCountries, getRegionsByCountryCode } from 'lib/utils/countryRegion';
import Link from 'next/link';
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
    country: ''
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
      'country'
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
      setStatus((prev) => `${prev}\n✅ Default role Admin assigned to the customer!`);

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
    <main className="flex flex-col items-center bg-gradient-to-br from-gray-100 to-white px-4 py-20">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl p-8 sm:p-10">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <IgnIcon className="h-[72px] w-[180px]" />
        </div>

        {/* Headline */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800">Register Your Company</h2>
          <p className="text-base text-gray-500 mt-1">
            Register your business to access exclusive pricing and services.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Input fields */}
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
            <div key={name}>
              <input
                type={type}
                name={name}
                placeholder={placeholder}
                value={formData[name as keyof typeof formData]}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                  errors?.[name] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors?.[name] && <span className="text-red-500 text-xs">{errors[name]}</span>}
            </div>
          ))}

          {/* Country */}
          <div>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                errors?.country ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            >
              <option value="">Select Country</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            {errors?.country && <span className="text-red-500 text-xs">{errors.country}</span>}
          </div>

          {/* Province */}
          <div>
            <select
              name="province"
              value={formData.province}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                errors?.province ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            >
              <option value="">Select Province/State</option>
              {regions.map((r) => (
                <option key={r.name} value={r.shortCode || r.name}>{r.name}</option>
              ))}
            </select>
            {errors?.province && <span className="text-red-500 text-xs">{errors.province}</span>}
          </div>

          {/* Submit */}
          <div className="col-span-1 sm:col-span-2 mt-6 text-center">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg w-full sm:w-auto font-semibold hover:bg-blue-700 transition"
            >
              Register Company
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="flex items-center my-8">
          <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          <span className="mx-4 text-gray-500 text-sm font-medium">Already a customer?</span>
          <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        </div>

        {/* Login CTA */}
        <div className="text-center">
          <Link
            href="/login"
            className="text-blue-600 font-medium hover:underline transition"
          >
            Log in to your account
          </Link>
        </div>

        {/* Status output */}
        {status && (
          <pre className="mt-6 text-sm bg-gray-100 p-4 rounded border text-gray-800 whitespace-pre-wrap">
            {status}
          </pre>
        )}
      </div>
    </main>
  );
}
