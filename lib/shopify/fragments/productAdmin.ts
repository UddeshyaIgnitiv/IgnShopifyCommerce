const productFragment = /* GraphQL */ `
  fragment product on Product {
    id
    handle
    title
    description
    descriptionHtml
    productType
    vendor
    status
    tags
    publishedAt
    createdAt
    updatedAt
    totalInventory
    isGiftCard
    hasOnlyDefaultVariant
    seo {
      title
      description
    }
    featuredMedia {
      alt
      preview {
        image {
          url
          altText
        }
      }
    }
    media(first: 5) {
      edges {
        node {
          mediaContentType
          alt
          preview {
            image {
              url
              altText
            }
          }
        }
      }
    }
    options {
      id
      name
      values
    }
    metafields(first: 5) {
      edges {
        node {
          namespace
          key
          value
          type
          description
        }
      }
    }
    variants(first: 5) {
      edges {
        node {
          id
          title
          sku
          barcode
          availableForSale
          price
          compareAtPrice
          selectedOptions {
            name
            value
          }
          image {
            url
            altText
          }
          inventoryItem {
            id
            measurement {
              weight {
                value
                unit
              }
            }
          }
        }
      }
    }
  }
`;

export default productFragment;
