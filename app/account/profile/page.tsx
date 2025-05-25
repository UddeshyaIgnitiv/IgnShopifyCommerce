// app/profile/page.tsx

import RoleBasedUI from 'components/RoleBasedUI';

export default function ProfilePage() {
  return (
      <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto mt-6 relative">
        <h1>Order Review</h1>
        <p>Review your cart before submitting.</p>


        {/* Passing customerId as a prop to RoleBasedUI */}
        <RoleBasedUI />
    </div>
  );
}
