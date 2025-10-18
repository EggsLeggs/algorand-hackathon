import React, { useState, useEffect } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
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
  Search
} from "lucide-react"

// Event interface
interface Event {
  id: number
  name: string
  unitName: string
  totalSupply: number
  decimals: number
  manager: string
  reserve: string
  freeze: string
  clawback: string
  url?: string
  metadataHash?: Uint8Array
  note?: string
  createdAt?: number
}

interface MyEventsProps {
  onCreateEvent?: () => void
}

const MyEvents: React.FC<MyEventsProps> = ({ onCreateEvent }) => {
  const { activeAddress } = useWallet()
  const [events, setEvents] = useState<Event[]>([])
  const [filtered, setFiltered] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const { enqueueSnackbar } = useSnackbar()

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig })

  const fetchMyEvents = async () => {
    if (!activeAddress) {
      setError('Please connect your wallet first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const accountInfo = await algorand.account.getInformation(activeAddress)
      const managedAssets = accountInfo.createdAssets?.filter(asset =>
        asset.params.manager === activeAddress
      ) || []

      const eventList: Event[] = managedAssets.map(asset => ({
        id: Number(asset.index),
        name: asset.params.name || 'Unnamed Event',
        unitName: asset.params.unitName || 'TICKET',
        totalSupply: Number(asset.params.total),
        decimals: asset.params.decimals,
        manager: asset.params.manager || '',
        reserve: asset.params.reserve || '',
        freeze: asset.params.freeze || '',
        clawback: asset.params.clawback || '',
        url: asset.params.url,
        metadataHash: asset.params.metadataHash,
        note: undefined, // Note property doesn't exist on AssetParams
        createdAt: undefined // createdAtRound property doesn't exist on Asset
      }))

      setEvents(eventList)
      setFiltered(eventList)
      enqueueSnackbar("Events loaded successfully", { variant: "success" })
    } catch (err) {
      console.error('Error fetching events:', err)
      setError('Failed to fetch events. Please try again.')
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
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.unitName.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
            <p className="text-gray-600">Manage your ASA-based ticketing events</p>
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
              <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Events Found</h3>
              <p className="text-gray-600 mb-6">Create your first ASA-based event!</p>
              <Button onClick={onCreateEvent} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Event
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
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="hover:shadow-lg transition-shadow bg-white">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{event.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{event.unitName}</Badge>
                          <span className="text-xs text-gray-500">ASA #{event.id}</span>
                        </CardDescription>
                      </div>
                      <a
                        href={`https://explorer.perawallet.app/asset/${event.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                        <div className="text-sm font-semibold text-blue-900">
                          {event.totalSupply.toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-700">Tickets</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <Coins className="h-5 w-5 text-green-600 mx-auto mb-1" />
                        <div className="text-sm font-semibold text-green-900">{event.decimals}</div>
                        <div className="text-xs text-green-700">Decimals</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      Created: <span className="font-medium">{formatDate(event.createdAt)}</span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">View</Button>
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
            Showing {filtered.length} event{filtered.length !== 1 && 's'}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyEvents
