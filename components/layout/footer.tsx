import { getMenu } from 'lib/shopify';

const { COMPANY_NAME, SITE_NAME } = process.env;

export default async function Footer() {
  const currentYear = new Date().getFullYear();  // Get the current year
  const menu = await getMenu('next-js-frontend-footer-menu');
  const copyrightName = COMPANY_NAME || SITE_NAME || '';

  return (
    <footer className="bg-black text-white py-4 mt-6">
      <div className="border-t border-neutral-700 py-6">
        <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 justify-center"> {/* 4 Columns Layout */}
            
            {/* Column 1: Core Services */}
            <div>
              <h2 className="text-3xl font-semibold mb-6">Core Services</h2>
              <ul className="space-y-4">
                <li>
                  <a href="https://www.ignitiv.com/services/innovation/" className="text-white hover:text-blue-600">Innovation</a>
                </li>
                <li>
                  <a href="https://www.ignitiv.com/services/strategy/" className="text-white hover:text-blue-600">Strategy</a>
                </li>
                <li>
                  <a href="https://www.ignitiv.com/services/implementation/" className="text-white hover:text-blue-600">Implementation</a>
                </li>
                <li>
                  <a href="https://www.ignitiv.com/services/managed-services/" className="text-white hover:text-blue-600">Managed Services</a>
                </li>
                <li>
                  <a href="https://www.ignitiv.com/services/products/" className="text-white hover:text-blue-600">Products</a>
                </li>
              </ul>
            </div>

            {/* Column 2: Marketplace Integration */}
            <div>
              <h2 className="text-3xl font-semibold mb-6">Marketplace Integration</h2>
              <p className="text-sm leading-relaxed">
                Molten is a SaaS solution designed to scale seamlessly with your business, providing a highly flexible and robust platform for marketplace integration. With multi-channel integration capabilities, Molten connects you to leading marketplaces like Amazon, Meta, TikTok, TargetPlus, Walmart, Academy Sports, and more, all accessible through a single, unified view.
              </p>
            </div>

            {/* Column 3: Partners */}
            <div className="text-center">
              <h2 className="text-3xl font-semibold mb-6">Partners</h2>
              <ul className="space-y-4">
                <li>
                  <a href="https://www.ignitiv.com/partners/ecommerce/kibo/" className="text-white hover:text-blue-600">Kibo</a>
                </li>
                <li>
                  <a href="https://www.ignitiv.com/#Oracle" className="text-white hover:text-blue-600">Oracle</a>
                </li>
                <li>
                  <a href="https://www.ignitiv.com/partners/ecommerce/shopify-development-services/" className="text-white hover:text-blue-600">Shopify</a>
                </li>
                <li>
                  <a href="https://www.ignitiv.com/partners/pim/#Akeneo" className="text-white hover:text-blue-600">Akeneo</a>
                </li>
                <li>
                  <a href="https://www.ignitiv.com/partners/ecommerce/magento-development-services/" className="text-white hover:text-blue-600">Magento</a>
                </li>
              </ul>
            </div>

            {/* Column 4: Contacts */}
            <div>
              <h2 className="text-3xl font-semibold mb-6">Contacts</h2>
              <p className="text-sm">
                <a href="mailto:info@ignitiv.com" className="text-white hover:text-blue-600">info@ignitiv.com</a>
              </p>
              <p className="text-sm">
                <a href="tel:+14088911910" className="text-white hover:text-blue-600">+1 408 891 1910</a>
              </p>
              <p className="text-sm">
                10080 N Wolfe Rd SW3 200, Cupertino, CA 95014
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Footer Bottom: Privacy Policy and Sitemap */}
      <div className="border-t border-neutral-700 py-4">
        <div className="mx-auto max-w-7xl px-4 flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <p className="text-sm text-center md:text-left">
            &copy; {currentYear} {copyrightName}
            {copyrightName.length && !copyrightName.endsWith('.') ? '.' : ''} All Rights Reserved
          </p>

          {/* Right Part: Privacy Policy and Sitemap */}
          <div className="flex space-x-6">
            <a
              href="https://www.ignitiv.com/privacy-policy/"
              className="text-white hover:text-blue-600 dark:hover:text-blue-400"
            >
              Privacy Policy
            </a>
            <a
              href="https://www.ignitiv.com/sitemap/"
              className="text-white hover:text-blue-600 dark:hover:text-blue-400"
            >
              Sitemap
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
