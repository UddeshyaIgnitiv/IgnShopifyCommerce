export const SEND_INVITE_MUTATION = `
    mutation customerSendAccountInviteEmail($customerId: ID!) {
        customerSendAccountInviteEmail(customerId: $customerId) {
          customer {
            id
            email
          }
          userErrors {
            field
            message
          }
        }
    }
    `;