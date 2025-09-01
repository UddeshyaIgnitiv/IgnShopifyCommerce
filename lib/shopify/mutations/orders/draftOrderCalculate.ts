export const draftOrderCalculate = `
mutation draftOrderCalculate($input: DraftOrderInput!) {
  draftOrderCalculate(input: $input) {
    calculatedDraftOrder {
      subtotalPriceSet {
        presentmentMoney {
          amount
          currencyCode
        }
      }
      totalTaxSet {
        presentmentMoney {
          amount
          currencyCode
        }
      }
      totalShippingPriceSet {
        presentmentMoney {
          amount
          currencyCode
        }
      }
      totalPriceSet {
        presentmentMoney {
          amount
          currencyCode
        }
      }
      taxLines {
        title
        price
        rate
      }
    }
    userErrors {
      field
      message
    }
  }
}
`;