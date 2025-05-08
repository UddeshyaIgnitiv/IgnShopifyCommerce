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

  //console.log("formData", formData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Submitting...');

    try {
      // 1. Create Company
      const res = await fetch('/api/register/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      //console.log("Company Create Response:", result);

      const companyData = result?.company;
      //console.log("companyData:", companyData);

      if (!res.ok || !result.company) {
        const message = result?.message || 'Unknown error during company creation.';
        setStatus(`❌ Errordata: ${message}`);
        return;
      } else {
        setStatus(`✅ Company "${companyData.name}" created!`);
      }

      const companyId = companyData.id;

      // 2. Create Customer
      const customerInput = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        companyId: companyId,  // Include companyId here
      };

      const customerRes = await fetch('/api/register/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, companyId }),
      });

      const customerResult = await customerRes.json();
      //console.log("Customer Create Response:", customerResult);

      const customerData = customerResult?.customer;
      //console.log("customerInfo:", customerData);
      const customerErrors = customerResult?.error || customerData?.userErrors;

      if (!customerRes.ok || !customerData || (customerErrors && customerErrors.length > 0)) {
        const message = customerErrors?.[0]?.message || 'Unknown error during customer creation.';
        setStatus(`❌ Errord: ${message}`);
        return;
      } else {
        setStatus((prev) => `${prev}\n✅ Customer "${customerData.firstName}" created!`);
      }

      const customerId = customerData.id;

      //console.log("customerId", customerId);

      // 3. Send Invite
      const inviteRes = await fetch('/api/register/email-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });

      const inviteResult = await inviteRes.json();
      //console.log("Invite Email Response:", inviteResult);

      const inviteData = inviteResult?.data?.customerSendAccountInviteEmail;
      const inviteErrors = inviteResult?.error || inviteData?.userErrors;

      if (!inviteRes.ok || (inviteErrors && inviteErrors.length > 0)) {
        const message = inviteErrors?.[0]?.message || 'Unknown error while sending invite.';
        setStatus(`❌ Errorp: ${message}`);
        return;
      } else {
        setStatus((prev) => `${prev}\n✅ Invite sent successfully!`);
      }

    } catch (error: unknown) {
      console.error('Client-side error:', error);
      if (error instanceof Error) {
        setStatus(`❌ Errorc: ${error.message}`);
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
          <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="text" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="text" name="name" placeholder="Company Name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="text" name="externalId" placeholder="External ID" value={formData.externalId} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="text" name="locationName" placeholder="Location Name" value={formData.locationName} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="text" name="address1" placeholder="Address Line 1" value={formData.address1} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="text" name="province" placeholder="Province" value={formData.province} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="text" name="zip" placeholder="Postal/ZIP Code" value={formData.zip} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="text" name="country" placeholder="Country" value={formData.country} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />

          <div className="col-span-2 text-center">
            <button type="submit" className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition mx-auto">
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
