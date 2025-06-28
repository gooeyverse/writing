import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Loader2, Database } from 'lucide-react'
import { testConnection } from '../lib/supabase'

export const ConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [message, setMessage] = useState('')

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    setStatus('checking')
    const result = await testConnection()
    setStatus(result.success ? 'connected' : 'error')
    setMessage(result.message)
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'border-blue-200 bg-blue-50'
      case 'connected':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
    }
  }

  return (
    <div className={`p-3 rounded-lg border ${getStatusColor()} flex items-center space-x-3`}>
      <Database className="w-5 h-5 text-gray-600" />
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-900">
            Supabase Connection
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-1">{message}</p>
      </div>
      {status === 'error' && (
        <button
          onClick={checkConnection}
          className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  )
}