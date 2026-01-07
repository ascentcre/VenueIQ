'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  GitBranch, 
  BarChart3, 
  Users, 
  Settings,
  Calendar,
  MessageSquare,
  TrendingUp,
  LogOut
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const menuItems = [
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/pipeline', label: 'Pipeline', icon: GitBranch },
  { href: '/performance', label: 'Performance', icon: TrendingUp },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/lola', label: 'Lola', icon: MessageSquare },
];

const settingsItem = { href: '/settings', label: 'Settings', icon: Settings };

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ 
      callbackUrl: '/auth/signin',
      redirect: true 
    });
  };

  return (
    <div className="w-64 bg-brown-800 min-h-screen flex flex-col">
      <div className="p-6 border-b border-brown-700">
        <h1 className="text-2xl font-bold text-teal-400">VenueIQ</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'text-brown-200 hover:bg-brown-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-brown-700 space-y-3">
        {(() => {
          const Icon = settingsItem.icon;
          const isActive = pathname === settingsItem.href || pathname?.startsWith(settingsItem.href + '/');
          return (
            <Link
              key={settingsItem.href}
              href={settingsItem.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative z-10 ${
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'text-brown-200 hover:bg-brown-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{settingsItem.label}</span>
            </Link>
          );
        })()}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-brown-200 hover:bg-brown-700 hover:text-white w-full text-left"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}

