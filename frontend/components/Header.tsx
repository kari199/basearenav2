'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <>
      <header className="sticky top-0 z-50 glass border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <svg width="40" height="40" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="256" cy="256" r="256" fill="#E8DABD"/>
                <path d="M256 120L280 230L256 256L232 230L256 120Z" fill="#000000"/>
                <path d="M392 256L282 280L256 256L282 232L392 256Z" fill="#000000"/>
                <path d="M256 392L232 282L256 256L280 282L256 392Z" fill="#000000"/>
                <path d="M120 256L230 232L256 256L230 280L120 256Z" fill="#000000"/>
              </svg>
              <span className="text-2xl font-bold font-mono" style={{ color: '#E8DABD' }}>
                nofAster
              </span>
            </Link>

            <nav className="hidden md:flex space-x-8">
              {[
                { name: 'Live', path: '/' },
                { name: 'Leaderboard', path: '/leaderboard' },
                { name: 'Models', path: '/models' },
                { name: 'About', path: '/about' },
              ].map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-black'
                      : 'hover:text-white'
                  }`}
                  style={isActive(item.path) ? { backgroundColor: '#E8DABD' } : {}}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400">Live</span>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
