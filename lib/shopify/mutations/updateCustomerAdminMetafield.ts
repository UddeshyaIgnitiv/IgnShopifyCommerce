export const UPDATE_CUSTOMER_ADMIN_METAFIELD_MUTATION = `
  mutation updateCustomerAdminMetafield($customerId: ID!, $value: String!) {
    customerUpdate(input: {
      id: $customerId,
      metafields: [
        {
          namespace: "custom"
          key: "is_customer_admin"
          type: "boolean"
          value: $value
        }
      ]
    }) {
      customer {
        id
        metafield(namespace: "custom", key: "is_customer_admin") {
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;
