'use client'

import Link from 'next/link'
import { useTranslation } from '../../i18n/LanguageProvider'
import { interpolate } from '../../i18n/get-dictionary'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const { dictionary: d } = useTranslation()

  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">{d.common.brand}</h3>
            <p className="text-sm">
              {d.footer.tagline}
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">{d.footer.product}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#product" className="hover:text-white transition-colors">
                  {d.footer.features}
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="hover:text-white transition-colors">
                  {d.footer.howItWorks}
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-white transition-colors">
                  {d.footer.pricing}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">{d.footer.support}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#faq" className="hover:text-white transition-colors">
                  {d.footer.faq}
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {d.footer.contact}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {d.footer.privacyPolicy}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">{d.footer.legal}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {d.footer.termsOfService}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {d.footer.privacyPolicy}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {d.footer.cookiePolicy}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-sm">
          <p>{interpolate(d.footer.copyright, { year: currentYear })}</p>
        </div>
      </div>
    </footer>
  )
}
