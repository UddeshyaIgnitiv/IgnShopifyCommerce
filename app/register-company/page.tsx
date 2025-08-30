'use client';

import IgnIcon from 'components/icons/ignIcon';
import { getAllCountries, getRegionsByCountryCode } from 'lib/utils/countryRegion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function formatPhoneToE164(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, ''); // "1234567890"
  return `+1${digitsOnly}`;
}

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

  // useEffect(() => {
  //   setCountries(getAllCountries());
  // }, []);

  useEffect(() => {
    const all = getAllCountries();
    const usOnly = all.filter((c) => c.code === 'US');
    setCountries(usOnly);

    // Set US as default selected
    setFormData((prev) => ({ ...prev, country: 'US' }));
    setRegions(getRegionsByCountryCode('US'));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let updatedValue = value;

    if (['firstName', 'lastName'].includes(name)) {
      // Remove numbers
      updatedValue = value.replace(/[0-9]/g, '');

      // remove any special characters except letters, hyphens, and spaces
      updatedValue = updatedValue.replace(/[^A-Za-z\s\-]/g, '');

      // Capitalize the first letter of each word
      updatedValue = updatedValue.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    }

    if (name === 'phone') {
      // Remove non-digits
      const digitsOnly = value.replace(/\D/g, '');

      // Format as 3-3-4 (e.g. 123-456-7890)
      if (digitsOnly.length <= 3) {
        updatedValue = digitsOnly;
      } else if (digitsOnly.length <= 6) {
        updatedValue = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
      } else if (digitsOnly.length <= 10) {
        updatedValue = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
      } else {
        updatedValue = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
      }
    }
    if (name === 'email') {
      updatedValue = value.replace(/\s/g, '');
    }

    if (typeof updatedValue === 'string') {
      updatedValue = updatedValue.trimStart(); // Or `.trim()` if you want to remove from both ends
    }

    setFormData((prev) => ({ ...prev, [name]: updatedValue }));
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

    // ✅ Phone number format validation (3-3-4)
    if (formData.phone && !/^\d{3}-\d{3}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be in 3-3-4 format (e.g. 123-456-7890).';
    }

    // ✅ Email format validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // ✅ First and last name validation
    if (formData.firstName && !/^[A-Za-z\s\-]+$/.test(formData.firstName)) {
      newErrors.firstName = 'First name can only contain letters, spaces, and hyphens.';
    }
    if (formData.lastName && !/^[A-Za-z\s\-]+$/.test(formData.lastName)) {
      newErrors.lastName = 'Last name can only contain letters, spaces, and hyphens.';
    }

    // ✅ US-specific address validation
    if (formData.country === 'US' || formData.country === 'USA') {
      // US ZIP code (5 or 9 digits with dash)
      if (!/^\d{5}(-\d{4})?$/.test(formData.zip)) {
        newErrors.zip = 'ZIP code must be in 5-digit or 5+4-digit format (e.g. 12345 or 12345-6789).';
      }

    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    if (!validateFields()) {
      setStatus('❌ Please fill in all required fields before submitting.');
      return;
    }

    let companyId = null;
    let customerId = null;

    try {
      const { phone, ...companyData } = formData;
      const phoneE164 = formatPhoneToE164(phone);
      setStatus('🚀 Validating company creation...');

      const existingUser = await fetch('/api/register/check-customer',{
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      const existingUserData = await existingUser.json();

      const existingUserDataViaPhone = await fetch('/api/register/check-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneE164 }),
      });
      const existingUserDataViaPhoneData = await existingUserDataViaPhone.json();

      if(existingUserData?.existingCustomer === true && existingUserDataViaPhoneData?.existingCustomer === true){
        setStatus('❌ A customer with this email and phone number already exists. Please log in or use different credentials.');
        return;
      }else if (existingUserData?.existingCustomer === true) {
        setStatus(
          "❌ A customer with this email already exists. Please log in or use different email address."
        );
        return;
      }else if (existingUserDataViaPhoneData?.existingCustomer === true) {
        setStatus('❌ A customer with this phone number already exists. Please log in or use a different phone number.');
        return;
      }

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
        body: JSON.stringify({ ...formData, phone: phoneE164, companyId: company.id }),
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
        {/* Status output */}
        {status && (
          <pre className="mt-6 text-sm bg-gray-100 p-4 rounded border text-gray-800 whitespace-pre-wrap px-3 py-2 mb-6">
            {status}
          </pre>
        )}
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

      </div>
    </main>
  );
}
