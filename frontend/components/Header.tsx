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
              <img src="/logo.svg" alt="BaseArena" width="45" height="45" />
              <span className="text-2xl font-bold font-mono" style={{ color: '#0D28F0' }}>
                BaseArena
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
                  style={isActive(item.path) ? { backgroundColor: '#0D28F0' } : {}}
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
