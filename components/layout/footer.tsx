import { getMenu } from 'lib/shopify';

const { COMPANY_NAME, SITE_NAME } = process.env;

export default async function Footer() {
  const currentYear = new Date().getFullYear();  // Get the current year
  const menu = await getMenu('next-js-frontend-footer-menu');
  const copyrightName = COMPANY_NAME || SITE_NAME || '';

  return (
    <footer className="bg-black text-white py-4 mt-6">

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
