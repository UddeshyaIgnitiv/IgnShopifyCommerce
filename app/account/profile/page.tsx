// app/profile/page.tsx

import RoleBasedUI from 'components/RoleBasedUI';

export default function ProfilePage() {
  return (
    <div>
        <h1>Order Review</h1>
        <p>Review your cart before submitting.</p>

        {/* Passing customerId as a prop to RoleBasedUI */}
        <RoleBasedUI />
    </div>
  );
}
