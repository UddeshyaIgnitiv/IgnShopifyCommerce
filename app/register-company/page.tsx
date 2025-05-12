'use client';

import { useState } from 'react';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Submitting...');

    try {
      const res = await fetch('/api/register/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      const companyData = result?.company;

      if (!res.ok || !companyData) {
        const message = result?.message || 'Unknown error during company creation.';
        setStatus(`❌ Company creation failed: ${message}`);
        return;
      } else {
        setStatus(`✅ Company "${companyData.name}" created!`);
      }

      const companyId = companyData.id;
      //console.log("companyId", companyId);

      const contactRes = await fetch('/api/register/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, companyId }),
      });

      //console.log("contactRes", contactRes);

      const contactResult = await contactRes.json();

      //console.log("contactResult", contactResult);
      const customerData = contactResult?.contact?.customer;

      //console.log("customerData", customerData);

      const customerErrors = contactResult?.error || customerData?.userErrors;

      if (!contactRes.ok || !customerData || (customerErrors && customerErrors.length > 0)) {
        const message =
          (Array.isArray(customerErrors) ? customerErrors[0]?.message : customerErrors) ||
          'Unknown error during customer creation.';
        setStatus(`❌ Contact/customer creation failed: ${message}`);
        return;
      } else {
        setStatus((prev) => `${prev}\n✅ Contact "${customerData.firstName}" created!`);
      }

      const customerId = customerData.id;

      const inviteRes = await fetch('/api/register/email-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });

      const inviteResult = await inviteRes.json();
      const inviteErrors = inviteResult?.error || inviteResult?.data?.customerSendAccountInviteEmail?.userErrors;

      if (!inviteRes.ok || inviteErrors?.length > 0) {
        const message =
          (Array.isArray(inviteErrors) ? inviteErrors[0]?.message : inviteErrors) ||
          'Unknown error while sending invite.';
        setStatus((prev) => `${prev}\n❌ Invite failed: ${message}`);
        return;
      } else {
        setStatus((prev) => `${prev}\n✅ Invite sent successfully!`);
      }

    } catch (error: unknown) {
      console.error('Client-side error:', error);
      if (error instanceof Error) {
        setStatus(`❌ Error: ${error.message}`);
      } else {
        setStatus('❌ An unexpected error occurred');
      }
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
            { name: 'province', placeholder: 'Province' },
            { name: 'zip', placeholder: 'Postal/ZIP Code' },
            { name: 'country', placeholder: 'Country' },
          ].map(({ name, placeholder, type = 'text' }) => (
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
