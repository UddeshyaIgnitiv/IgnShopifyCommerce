export async function POST(req: Request) {
    const { email, otp } = await req.json()

    const response = await fetch(process.env.SHOPIFY_STOREFRONT_API_URL!, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
        },
        body: JSON.stringify({
            query: `
          mutation completeCustomerAuthentication($email: String!, $otp: String!) {
            completeCustomerAuthentication(email: $email, otp: $otp) {
              customerAccessToken {
                accessToken
                expiresAt
              }
              customerUserErrors { message }
            }
          }
        `,
            variables: { email, otp },
        }),
    })

    const result = await response.json()
    const error = result?.data?.completeCustomerAuthentication?.customerUserErrors?.[0]?.message
    const token = result?.data?.completeCustomerAuthentication?.customerAccessToken?.accessToken

    if (error || !token) {
        return Response.json({ message: error || 'Invalid OTP' }, { status: 400 })
    }

    return Response.json({ accessToken: token })
}
