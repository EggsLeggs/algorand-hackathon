import { useWallet, Wallet, WalletId } from '@txnlab/use-wallet-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet as WalletIcon, LogOut, Copy } from "lucide-react"
import { useState } from "react"

interface WalletConnectProps {
  className?: string
}

const WalletConnect = ({ className = "" }: WalletConnectProps) => {
  const { wallets, activeAddress } = useWallet()
  const [showWalletModal, setShowWalletModal] = useState(false)

  const isKmd = (wallet: Wallet) => wallet.id === WalletId.KMD

  const copyAddress = () => {
    if (activeAddress) {
      navigator.clipboard.writeText(activeAddress)
      // You could add a toast notification here
    }
  }

  const disconnect = async () => {
    if (wallets) {
      const activeWallet = wallets.find((w) => w.isActive)
      if (activeWallet) {
        await activeWallet.disconnect()
      } else {
        // Required for logout/cleanup of inactive providers
        localStorage.removeItem('@txnlab/use-wallet:v3')
        window.location.reload()
      }
    }
  }

  if (activeAddress) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 hover:text-green-800 hover:border-green-200">
          <WalletIcon className="h-3 w-3 mr-1" />
          Connected
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyAddress}
          className="text-xs"
        >
          <Copy className="h-3 w-3 mr-1" />
          {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={disconnect}
          className="text-xs text-red-600 hover:text-red-700"
        >
          <LogOut className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowWalletModal(true)}
        className={`${className}`}
      >
        <WalletIcon className="h-4 w-4 mr-2" />
        Connect Wallet
      </Button>

      {/* Wallet Selection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Select wallet provider</h3>

            <div className="space-y-2">
              {wallets?.map((wallet) => (
                <Button
                  key={`provider-${wallet.id}`}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    wallet.connect()
                    setShowWalletModal(false)
                  }}
                >
                  {!isKmd(wallet) && (
                    <img
                      alt={`wallet_icon_${wallet.id}`}
                      src={wallet.metadata.icon}
                      className="w-6 h-6 mr-3 object-contain"
                    />
                  )}
                  <span>{isKmd(wallet) ? 'LocalNet Wallet' : wallet.metadata.name}</span>
                </Button>
              ))}
            </div>

            <div className="flex justify-end mt-4">
              <Button
                variant="ghost"
                onClick={() => setShowWalletModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default WalletConnect
