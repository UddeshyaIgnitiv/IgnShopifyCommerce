export async function POST(req: Request) {
    const { email } = await req.json()

    const response = await fetch(process.env.SHOPIFY_STOREFRONT_API_URL!, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
        },
        body: JSON.stringify({
            query: `
          mutation startCustomerLogin($email: String!) {
            startCustomerLogin(email: $email) {
              customerUserErrors { message }
            }
          }
        `,
            variables: { email },
        }),
    })

    const result = await response.json()
    const error = result?.data?.startCustomerLogin?.customerUserErrors?.[0]?.message

    if (error) {
        return Response.json({ message: error }, { status: 400 })
    }

    return Response.json({ success: true })
}
