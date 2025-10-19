import React, { useState, useEffect } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { getApplicationAddress } from 'algosdk'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useSnackbar } from 'notistack'
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import {
  Calendar,
  Ticket,
  Coins,
  Users,
  Clock,
  RefreshCw,
  ExternalLink,
  Plus,
  AlertCircle,
  Search,
  Smartphone
} from "lucide-react"

// Smart ASA Event interface
interface SmartASAEvent {
  asaId: number
  appId: number
  appAddress: string
  eventName: string
  unitName: string
  assetName: string
  totalSupply: number
  circulatingSupply: number
  defaultFrozen: boolean
  manager: string
  createdAt?: number
}

interface MyEventsProps {
  onCreateEvent?: () => void
}

const MyEvents: React.FC<MyEventsProps> = ({ onCreateEvent }) => {
  const { activeAddress } = useWallet()
  const [events, setEvents] = useState<SmartASAEvent[]>([])
  const [filtered, setFiltered] = useState<SmartASAEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const { enqueueSnackbar } = useSnackbar()

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })

  const fetchMyEvents = async () => {
    if (!activeAddress) {
      setError('Please connect your wallet first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get all applications created by the user
      const accountInfo = await algorand.account.getInformation(activeAddress)
      const createdApps = accountInfo.createdApps || []
      const createdAssets = accountInfo.createdAssets || []

      console.log('Debug - Created Apps:', createdApps)
      console.log('Debug - Created Assets:', createdAssets)

      const smartASAEvents: SmartASAEvent[] = []

      // For each created app, check if it has Smart ASA data
      for (const app of createdApps) {
        try {
          // Calculate the app address from the app ID
          const appAddress = getApplicationAddress(Number(app.id))
          const appAddressStr = appAddress.toString()

          console.log(`Debug - Processing App ${app.id}, Address: ${appAddressStr}`)

          // Look for assets that might be Smart ASAs
          // We'll check all assets and see if they have characteristics of Smart ASAs
          const potentialSmartASAs = createdAssets.filter(asset => {
            console.log(`Debug - Checking Asset ${asset.index}:`, {
              name: asset.params.name,
              manager: asset.params.manager,
              reserve: asset.params.reserve,
              freeze: asset.params.freeze,
              clawback: asset.params.clawback,
              total: asset.params.total,
              decimals: asset.params.decimals
            })

            // Check if this asset has characteristics of a Smart ASA
            // We can identify Smart ASAs by checking if all controlling addresses are the same (user address)
            // This indicates the asset was created through our Smart ASA contract
            const isSmartASA = asset.params.manager === activeAddress &&
                   asset.params.reserve === activeAddress &&
                   asset.params.freeze === activeAddress &&
                   asset.params.clawback === activeAddress

            console.log(`Debug - Asset ${asset.index} is Smart ASA:`, isSmartASA)
            return isSmartASA
          })

          // If no Smart ASAs found with the strict criteria, let's also check for assets
          // that might be created by our smart contract but with different address patterns
          if (potentialSmartASAs.length === 0) {
            console.log('Debug - No Smart ASAs found with strict criteria, checking for app-created assets')

            // Look for assets that might be created by this specific app
            // We'll check if the asset was created around the same time as the app
            const appCreatedAssets = createdAssets.filter(asset => {
              // Check if asset has typical ticket characteristics
              const hasTicketCharacteristics =
                (asset.params.unitName === 'TICKET' || asset.params.name?.includes('Event') || asset.params.name?.includes('Ticket')) &&
                asset.params.decimals === 0 && // Tickets are indivisible
                asset.params.total > 0

              console.log(`Debug - Asset ${asset.index} has ticket characteristics:`, hasTicketCharacteristics, {
                unitName: asset.params.unitName,
                name: asset.params.name,
                decimals: asset.params.decimals,
                total: asset.params.total
              })

              return hasTicketCharacteristics
            })

            console.log(`Debug - Found ${appCreatedAssets.length} potential app-created assets`)
            potentialSmartASAs.push(...appCreatedAssets)
          }

          console.log(`Debug - Found ${potentialSmartASAs.length} potential Smart ASAs for app ${app.id}`)

          // For each potential Smart ASA, create an event entry
          for (const asset of potentialSmartASAs) {
            const smartASAEvent: SmartASAEvent = {
              asaId: Number(asset.index),
              appId: Number(app.id),
              appAddress: appAddressStr,
              eventName: asset.params.name || 'Unnamed Smart ASA Event',
              unitName: asset.params.unitName || 'TICKET',
              assetName: asset.params.name || 'Smart ASA Ticket',
              totalSupply: Number(asset.params.total),
              circulatingSupply: 0, // Would need to calculate this
              defaultFrozen: asset.params.defaultFrozen || false,
              manager: asset.params.manager || '',
              createdAt: undefined // Would need to get from transaction history
            }

            console.log('Debug - Created Smart ASA Event:', smartASAEvent)
            smartASAEvents.push(smartASAEvent)
          }
        } catch (appErr) {
          console.warn(`Error processing app ${app.id}:`, appErr)
          // Continue with other apps
        }
      }

      // If no Smart ASAs found, let's show all created assets as a fallback for debugging
      if (smartASAEvents.length === 0 && createdAssets.length > 0) {
        console.log('Debug - No Smart ASAs found, showing all created assets for debugging')

        // Create events from all created assets for debugging
        for (const asset of createdAssets) {
          // Try to find a matching app for this asset
          let matchingAppId = 0
          let matchingAppAddress = 'Unknown'

          // Look for apps that might be related to this asset
          for (const app of createdApps) {
            const appAddress = getApplicationAddress(Number(app.id))
            // If the asset manager matches the app address or user address, it might be related
            if (asset.params.manager === appAddress.toString() || asset.params.manager === activeAddress) {
              matchingAppId = Number(app.id)
              matchingAppAddress = appAddress.toString()
              break
            }
          }

          const fallbackEvent: SmartASAEvent = {
            asaId: Number(asset.index),
            appId: matchingAppId,
            appAddress: matchingAppAddress,
            eventName: asset.params.name || 'Unnamed Asset',
            unitName: asset.params.unitName || 'ASSET',
            assetName: asset.params.name || 'Asset',
            totalSupply: Number(asset.params.total),
            circulatingSupply: 0,
            defaultFrozen: asset.params.defaultFrozen || false,
            manager: asset.params.manager || '',
            createdAt: undefined
          }

          console.log('Debug - Fallback Event:', fallbackEvent)
          smartASAEvents.push(fallbackEvent)
        }
      }

      setEvents(smartASAEvents)
      setFiltered(smartASAEvents)

      if (smartASAEvents.length > 0) {
        enqueueSnackbar(`${smartASAEvents.length} events loaded successfully`, { variant: "success" })
      } else {
        enqueueSnackbar("No events found. Create your first event!", { variant: "info" })
      }
    } catch (err) {
      console.error('Error fetching Smart ASA events:', err)
      setError('Failed to fetch Smart ASA events. Please try again.')
      enqueueSnackbar("Error fetching events: Check your network or wallet connection", { variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeAddress) fetchMyEvents()
  }, [activeAddress])

  useEffect(() => {
    setFiltered(
      events.filter(e =>
        e.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.unitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.assetName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [searchTerm, events])

  const formatDate = (timestamp?: number) =>
    timestamp ? new Date(timestamp * 1000).toLocaleDateString() : 'Unknown'

  if (!activeAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-center">
        <div>
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to view your events</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Smart ASA Events</h1>
            <p className="text-gray-600">Manage your Smart ASA-based ticketing events</p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search events..."
                className="pl-8 w-48 md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              onClick={fetchMyEvents}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              className="flex items-center gap-2"
              onClick={onCreateEvent}
            >
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6 text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse h-64 bg-white/50" />
            ))}
          </div>
        )}

        {/* No Events */}
        {!loading && filtered.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Smartphone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Smart ASA Events Found</h3>
              <p className="text-gray-600 mb-6">Create your first Smart ASA-based event!</p>
              <Button onClick={onCreateEvent} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Smart ASA Event
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Events Grid */}
        {!loading && filtered.length > 0 && (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map(event => (
              <motion.div
                key={`${event.appId}-${event.asaId}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="hover:shadow-lg transition-shadow bg-white">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{event.eventName}</CardTitle>
                        <CardDescription className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">{event.unitName}</Badge>
                          <Badge variant="outline" className="text-xs">Smart ASA</Badge>
                          <span className="text-xs text-gray-500">ASA #{event.asaId}</span>
                          <span className="text-xs text-gray-500">App #{event.appId}</span>
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <a
                          href={`https://explorer.perawallet.app/asset/${event.asaId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View ASA"
                        >
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                        <a
                          href={`https://explorer.perawallet.app/application/${event.appId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View App"
                        >
                          <Button variant="ghost" size="sm">
                            <Smartphone className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                        <div className="text-sm font-semibold text-blue-900">
                          {event.totalSupply.toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-700">Total Supply</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <Coins className="h-5 w-5 text-green-600 mx-auto mb-1" />
                        <div className="text-sm font-semibold text-green-900">
                          {event.circulatingSupply.toLocaleString()}
                        </div>
                        <div className="text-xs text-green-700">Circulating</div>
                      </div>
                    </div>

                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <Ticket className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                      <div className="text-sm font-semibold text-purple-900">{event.assetName}</div>
                      <div className="text-xs text-purple-700">Asset Name</div>
                    </div>

                    <Separator />

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Created: <span className="font-medium">{formatDate(event.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Frozen: <span className="font-medium">{event.defaultFrozen ? 'Yes' : 'No'}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">View Details</Button>
                      <Button variant="outline" size="sm" className="flex-1">Manage</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-600">
            Showing {filtered.length} Smart ASA event{filtered.length !== 1 && 's'}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyEvents
