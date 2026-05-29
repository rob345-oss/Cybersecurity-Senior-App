import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-brand-primary py-12 px-4 text-slate-300 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2 text-white">
              <Shield className="h-5 w-5" aria-hidden />
              <h3 className="text-lg font-bold">Titanium Guardian</h3>
            </div>
            <p className="text-sm">Your digital guardian. AI-powered protection for older adults.</p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-white">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#product" className="transition-colors hover:text-white">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="transition-colors hover:text-white">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="transition-colors hover:text-white">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-white">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#faq" className="transition-colors hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-white">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-white">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-white">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="transition-colors hover:text-white">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-white">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-white">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-700 pt-8 text-center text-sm">
          <p>&copy; {currentYear} Titanium Guardian. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
