import React, { useState, useEffect } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  Ticket,
  Coins,
  Users,
  Clock,
  RefreshCw,
  ExternalLink,
  Plus,
  AlertCircle
} from "lucide-react"

// Event interface based on ASA metadata
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
  metadataHash?: string
  note?: string
  createdAt?: number
}

interface MyEventsProps {
  onCreateEvent?: () => void
}

const MyEvents: React.FC<MyEventsProps> = ({ onCreateEvent }) => {
  const { activeAddress } = useWallet()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      // Get all assets created by the current user (where they are the manager)
      const accountInfo = await algorand.account.getInformation(activeAddress)

      // Filter assets where the user is the manager (organizer)
      const managedAssets = accountInfo.createdAssets?.filter(asset =>
        asset.params.manager === activeAddress
      ) || []

      // Transform to Event objects
      const eventList: Event[] = managedAssets.map(asset => ({
        id: asset.index,
        name: asset.params.name || 'Unnamed Event',
        unitName: asset.params.unitName || 'TICKET',
        totalSupply: asset.params.total,
        decimals: asset.params.decimals,
        manager: asset.params.manager,
        reserve: asset.params.reserve,
        freeze: asset.params.freeze,
        clawback: asset.params.clawback,
        url: asset.params.url,
        metadataHash: asset.params.metadataHash,
        note: asset.params.note,
        createdAt: asset.createdAtRound
      }))

      setEvents(eventList)
    } catch (err) {
      console.error('Error fetching events:', err)
      setError('Failed to fetch events. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeAddress) {
      fetchMyEvents()
    }
  }, [activeAddress])

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown'
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const formatPrice = (price: number, decimals: number) => {
    return (price / Math.pow(10, decimals)).toFixed(decimals)
  }

  if (!activeAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600">Please connect your wallet to view your events</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Events</h1>
              <p className="text-gray-600">Manage your ASA-based ticketing events</p>
            </div>
            <div className="flex gap-3">
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
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your events...</p>
          </div>
        )}

        {/* Events Grid */}
        {!loading && !error && (
          <>
            {events.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Events Found</h3>
                  <p className="text-gray-600 mb-6">
                    You haven't created any events yet. Create your first ASA-based event!
                  </p>
                  <Button
                    className="flex items-center gap-2"
                    onClick={onCreateEvent}
                  >
                    <Plus className="h-4 w-4" />
                    Create Your First Event
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{event.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {event.unitName}
                            </Badge>
                            <span className="text-xs text-gray-500">ASA #{event.id}</span>
                          </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Event Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                          <div className="text-sm font-semibold text-blue-900">
                            {event.totalSupply.toLocaleString()}
                          </div>
                          <div className="text-xs text-blue-700">Total Tickets</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <Coins className="h-5 w-5 text-green-600 mx-auto mb-1" />
                          <div className="text-sm font-semibold text-green-900">
                            {event.decimals}
                          </div>
                          <div className="text-xs text-green-700">Decimals</div>
                        </div>
                      </div>

                      <Separator />

                      {/* Event Details */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Created:</span>
                          <span className="font-medium">{formatDate(event.createdAt)}</span>
                        </div>
                        {event.note && (
                          <div className="flex items-start gap-2">
                            <Ticket className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <span className="text-gray-600">Note:</span>
                              <div className="text-xs text-gray-500 mt-1 break-all">
                                {event.note}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          Manage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer Info */}
        {events.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Showing {events.length} event{events.length !== 1 ? 's' : ''} where you are the organizer
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyEvents
