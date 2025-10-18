import React from 'react'
import WalletConnect from './WalletConnect'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Coins } from 'lucide-react'

const CHAINS = [
  { id: "mainnet", name: "Algorand MainNet" },
  { id: "testnet", name: "Algorand TestNet" },
]

interface NavBarProps {
  activeTab: 'create' | 'my-events'
  onTabChange: (tab: 'create' | 'my-events') => void
  network: string
  onNetworkChange: (network: string) => void
}

const NavBar: React.FC<NavBarProps> = ({ activeTab, onTabChange, network, onNetworkChange }) => {
  return (
    <nav className="bg-gradient-to-b from-blue-100 via-purple-50 to-transparent shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-white/60 border border-white/40 grid place-items-center shadow">
                <Coins className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-wide">Algorand Ticketing</h1>
                <div className="text-xs text-muted-foreground">Programmable tickets</div>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <button
                onClick={() => onTabChange('create')}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                  activeTab === 'create'
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Create Event
              </button>
              <button
                onClick={() => onTabChange('my-events')}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                  activeTab === 'my-events'
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                My Events
              </button>
              <button
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                My Tickets
              </button>
            </div>
          </div>

          {/* Network Selector and Wallet Connect */}
          <div className="flex items-center gap-3">
            <Select value={network} onValueChange={onNetworkChange}>
              <SelectTrigger className="w-40 bg-white/50 border-white/30">
                <SelectValue placeholder="Network" />
              </SelectTrigger>
              <SelectContent>
                {CHAINS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <WalletConnect />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="sm:hidden border-t border-gray-200">
          <div className="flex space-x-1 py-2">
            <button
              onClick={() => onTabChange('create')}
              className={`flex-1 text-center py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'create'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Create Event
            </button>
            <button
              onClick={() => onTabChange('my-events')}
              className={`flex-1 text-center py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'my-events'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              My Events
            </button>
            <button
              className="flex-1 text-center py-2 px-3 text-sm font-medium rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            >
              My Tickets
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default NavBar
