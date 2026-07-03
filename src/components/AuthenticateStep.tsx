'use client'

import { useState, useEffect, useRef } from 'react'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import { registerCredential, authenticate } from '@/lib/webauthn-prf'
import { deriveKeyFromPRF, encryptData, decryptData } from '@/lib/crypto'
import { saveVault, saveWebAuthn, getVault, getWebAuthn } from '@/lib/vault-db'

export interface Tokens {
  clickup?: string
  github?: string
}

export interface TokenErrors {
  clickup?: string
  github?: string
}

interface AuthenticateStepProps {
  onTokensChange: (tokens: Tokens) => void
  tokens: Tokens
  onNext: () => void
}

async function validateClickUp(apiKey: string): Promise<void> {
  const res = await fetch('https://api.clickup.com/api/v2/user', {
    headers: { Authorization: apiKey },
  })
  if (!res.ok) throw new Error('Invalid ClickUp token')
}

async function validateGitHub(pat: string): Promise<void> {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${pat}` },
  })
  if (!res.ok) throw new Error('Invalid GitHub token')
}

async function saveWithBiometric(tokens: Tokens): Promise<void> {
  const { credentialId, prfSalt, prfOutput } = await registerCredential('fmg-vault')
  const key = await deriveKeyFromPRF(prfOutput)
  const encrypted = await encryptData(key, JSON.stringify(tokens))
  await saveVault({ data: encrypted })
  await saveWebAuthn({ credentialId, prfSalt })
}

async function saveWithCredentialManager(tokens: Tokens): Promise<void> {
  if (!('PasswordCredential' in window)) return

  if (tokens.clickup) {
    const cred = await navigator.credentials.create({
      password: {
        iconURL: '',
        id: 'fmg-tools-clickup',
        name: 'ClickUp API Token',
        password: tokens.clickup,
      }
    } as unknown as CredentialCreationOptions)
    if (cred) await navigator.credentials.store(cred)
  }

  if (tokens.github) {
    const cred = await navigator.credentials.create({
      password: {
        iconURL: '',
        id: 'fmg-tools-github',
        name: 'GitHub PAT',
        password: tokens.github,
      }
    } as unknown as CredentialCreationOptions)
    if (cred) await navigator.credentials.store(cred)
  }
}

export default function AuthenticateStep({ onTokensChange, tokens, onNext }: AuthenticateStepProps) {
  const [clickup, setClickup] = useState('')
  const [github, setGithub] = useState('')
  const [loading, setLoading] = useState(false)
  const [tokenErrors, setTokenErrors] = useState<TokenErrors>({})
  const [rememberMe, setRememberMe] = useState(false)

  const onTokensChangeRef = useRef(onTokensChange)
  onTokensChangeRef.current = onTokensChange

  // Notify parent of token changes
  useEffect(() => {
    onTokensChangeRef.current({
      clickup: clickup || undefined,
      github: github || undefined,
    })
  }, [clickup, github])

  // Auto-fill tokens from biometric vault on mount
  useEffect(() => {
    async function loadFromVault() {
      try {
        const webauthn = await getWebAuthn()
        const vault = await getVault()
        if (!webauthn || !vault) return

        const prfOutput = await authenticate(webauthn.credentialId, webauthn.prfSalt)
        const key = await deriveKeyFromPRF(prfOutput)
        const decrypted = await decryptData(key, vault.data.iv, vault.data.ciphertext)
        const saved: Tokens = JSON.parse(decrypted)

        if (saved.clickup) setClickup(saved.clickup)
        if (saved.github) setGithub(saved.github)
      } catch {
        // Biometric failed or no saved vault – user enters tokens manually
      }
    }
    loadFromVault()
  }, [])

  const hasTokens = !!(tokens.clickup || tokens.github)

  const handleAuthenticate = async () => {
    setLoading(true)
    setTokenErrors({})

    try {
      const errors: TokenErrors = {}

      if (tokens.clickup) {
        try { await validateClickUp(tokens.clickup) } catch { errors.clickup = 'Invalid ClickUp token' }
      }
      if (tokens.github) {
        try { await validateGitHub(tokens.github) } catch { errors.github = 'Invalid GitHub token' }
      }

      if (errors.clickup || errors.github) {
        setTokenErrors(errors)
      } else {
        if (rememberMe) {
          try {
            await saveWithBiometric(tokens)
          } catch {
            try {
              await saveWithCredentialManager(tokens)
            } catch {
              // Credential saving failed silently – continue anyway
            }
          }
        }
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
          {/* ClickUp Token */}
          <form onSubmit={(e) => e.preventDefault()} autoComplete="on">
            <TextField
              name="clickup"
              type="password"
              label="ClickUp API Token"
              value={clickup}
              onChange={(e) => setClickup(e.target.value)}
              error={!!tokenErrors?.clickup}
              helperText={tokenErrors?.clickup || (
                <a
                  href="https://app.clickup.com/8438589/settings/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700"
                >
                  Get your ClickUp API Token →
                </a>
              )}
              fullWidth
              size="small"
            />
          </form>

          {/* GitHub PAT */}
          <form onSubmit={(e) => e.preventDefault()} autoComplete="on">
            <TextField
              name="github"
              type="password"
              label="GitHub Personal Access Token"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              error={!!tokenErrors?.github}
              helperText={tokenErrors?.github || (
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700"
                >
                  Get your GitHub Personal Access Token →
                </a>
              )}
              fullWidth
              size="small"
            />
          </form>

          {/* ── Remember me ── */}
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
            }
            label="Remember me"
          />
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <Button
          variant="contained"
          disabled={!hasTokens || loading}
          onClick={handleAuthenticate}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : undefined}
        >
          {loading ? 'Authenticating…' : 'Authenticate'}
        </Button>
      </div>
    </div>
  )
}
