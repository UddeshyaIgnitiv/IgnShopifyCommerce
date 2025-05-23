// lib/shopify/mutations/orders/updateCustomerDraftOrder.ts
const UPDATE_CUSTOMER_METAFIELD = `
  mutation updateCustomerMetafield($input: CustomerInput!) {
    customerUpdate(input: $input) {
      customer {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export default UPDATE_CUSTOMER_METAFIELD;
