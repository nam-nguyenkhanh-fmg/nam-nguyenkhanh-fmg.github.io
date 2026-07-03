'use client'

import { useState } from 'react'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

export enum TokenId {
  ClickUp = 'clickup',
  GitHub = 'github',
}

export interface Token {
  id: TokenId
  name: string
  link: { url: string; text: string }
  value: string
  success: boolean
  error?: string
  data?: unknown
  authenticate: (value: string) => Promise<unknown>
}

function createTokens(): Token[] {
  return [
    {
      id: TokenId.ClickUp,
      name: 'ClickUp API Token',
      link: { url: 'https://app.clickup.com/8438589/settings/apps', text: 'Get your ClickUp API Token →' },
      value: '',
      success: false,
      authenticate: async (value) => {
        const res = await fetch('https://api.clickup.com/api/v2/user', { headers: { Authorization: value } })
        if (!res.ok) throw new Error('Invalid ClickUp token')
        const json = await res.json()
        return json.user
      },
    },
    {
      id: TokenId.GitHub,
      name: 'GitHub Personal Access Token',
      link: { url: 'https://github.com/settings/tokens', text: 'Get your GitHub Personal Access Token →' },
      value: '',
      success: false,
      authenticate: async (value) => {
        const res = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${value}` } })
        if (!res.ok) throw new Error('Invalid GitHub token')
      },
    },
  ]
}

interface AuthenticateStepProps {
  onTokensChange: (tokens: Token[]) => void
  tokens: Token[]
  onNext: () => void
}

export { createTokens }

export default function AuthenticateStep({ onTokensChange, tokens, onNext }: AuthenticateStepProps) {
  const [loading, setLoading] = useState(false)

  const updateToken = (id: string, value: string) => {
    onTokensChange(tokens.map(t => t.id === id ? { ...t, value, success: false, error: undefined } : t))
  }

  const hasTokens = tokens.some(t => t.value)

  const handleAuthenticate = async () => {
    setLoading(true)

    try {
      const results = await Promise.all(
        tokens.map(async (token) => {
          if (!token.value) return { ...token, success: false, error: undefined }
          try {
            const data = await token.authenticate(token.value)
            return { ...token, success: true, error: undefined, data }
          } catch {
            return { ...token, success: false, error: `Invalid ${token.name}` }
          }
        })
      )

      onTokensChange(results)

      if (results.every(t => !t.value || t.success)) {
        onNext()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="max-w-md mx-auto bg-gray-50 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-primary-900 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Tokens
          </h3>
        </div>

        <div className="space-y-4">
          {tokens.map((token) => (
            <form key={token.id} onSubmit={(e) => e.preventDefault()} autoComplete="on">
              <TextField
                name={token.id}
                type="password"
                label={token.name}
                value={token.value}
                onChange={(e) => updateToken(token.id, e.target.value)}
                error={!!token.error}
                helperText={token.error || (
                  <a
                    href={token.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {token.link.text}
                  </a>
                )}
                fullWidth
                size="small"
              />
            </form>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <Button
          variant="contained"
          disabled={!hasTokens}
          onClick={handleAuthenticate}
          loading={loading}
        >
          Authenticate
        </Button>
      </div>
    </div>
  )
}
