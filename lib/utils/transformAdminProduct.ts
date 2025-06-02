import { Money, ShopifyAdminProduct, ShopifyProduct } from 'lib/shopify/types';

export function transformAdminProductToShopifyProduct(
  adminProduct: ShopifyAdminProduct
): ShopifyProduct {
  const variants = adminProduct.variants.edges.map(edge => edge.node);

  const getMoney = (amount: string, currencyCode: string): Money => ({
    amount: parseFloat(amount).toFixed(2),
    currencyCode,
  });

  const currencyCode =
    variants[0]?.contextualPricing?.price?.currencyCode ?? 'USD';

  const prices = variants.map(v => parseFloat(v.price || '0'));

  return {
    id: adminProduct.id,
    handle: adminProduct.handle,
    availableForSale: variants.some(v => v.availableForSale),
    title: adminProduct.title,
    description: adminProduct.description,
    descriptionHtml: adminProduct.descriptionHtml,
    options: adminProduct.options,
    priceRange: {
      maxVariantPrice: getMoney(
        Math.max(...prices).toString(),
        currencyCode
      ),
      minVariantPrice: getMoney(
        Math.min(...prices).toString(),
        currencyCode
      ),
    },
    variants: {
      edges: variants.map(variant => ({
        node: {
          id: variant.id,
          title: variant.title,
          availableForSale: variant.availableForSale,
          selectedOptions: variant.selectedOptions,
          price: {
            amount: variant.contextualPricing.price.amount,
            currencyCode: variant.contextualPricing.price.currencyCode,
          },
        },
      })),
    },
    featuredImage: {
      url: adminProduct.featuredMedia.preview.image.url,
      altText: adminProduct.featuredMedia.preview.image.altText,
      width: 800,
      height: 800,
    },
    images: {
      edges: adminProduct.media.edges.map(media => ({
        node: {
          url: media.node.preview.image.url,
          altText: media.node.preview.image.altText,
          width: 800,
          height: 800,
        },
      })),
    },
    seo: adminProduct.seo,
    tags: adminProduct.tags,
    updatedAt: adminProduct.updatedAt,
  };
}
