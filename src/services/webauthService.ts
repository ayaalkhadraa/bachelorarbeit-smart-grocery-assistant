import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from '@simplewebauthn/browser'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

async function postJson<T>(url: string, body: unknown): Promise<T> {
  console.log('[WebAuthn] POST', url, body)

  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => ({}))

  console.log('[WebAuthn] response', url, {
    status: response.status,
    ok: response.ok,
    data,
  })

  if (!response.ok) {
    throw new Error(
      data.error || data.details || `Request failed: ${response.status}`,
    )
  }

  return data as T
}

export async function checkWebAuthnSupport(): Promise<{
  supported: boolean
  platformAvailable: boolean
}> {
  const supported = browserSupportsWebAuthn()
  let platformAvailable = false

  if (supported) {
    platformAvailable = await platformAuthenticatorIsAvailable()
  }

  return {
    supported,
    platformAvailable,
  }
}

export async function registerPasskey(
  email: string,
  name = '',
): Promise<{ verified: boolean }> {
  console.log('[WebAuthn] registerPasskey started', { email, name })

  type RegistrationOptionsJSON = Parameters<typeof startRegistration>[0]['optionsJSON']

  const optionsJSON = await postJson<RegistrationOptionsJSON>('/api/webauthn/register/options', {
    email,
    name,
  })

  console.log('[WebAuthn] registration options received', optionsJSON)

  let registrationResponse
  try {
    console.log('[WebAuthn] calling startRegistration with optionsJSON', {
      challenge: optionsJSON.challenge,
      rpId: optionsJSON.rp?.id,
      userName: optionsJSON.user?.name,
    })
    registrationResponse = await startRegistration({ optionsJSON })
    console.log('[WebAuthn] startRegistration resolved', registrationResponse)
  } catch (error) {
    console.error('[WebAuthn] startRegistration failed', error)
    throw error
  }

  try {
    console.log('[WebAuthn] calling register verify endpoint')
    const verificationResult = await postJson<{ verified: boolean }>(
      '/api/webauthn/register/verify',
      {
        email,
        response: registrationResponse,
      },
    )
    console.log('[WebAuthn] register verify response', verificationResult)
    return verificationResult
  } catch (error) {
    console.error('[WebAuthn] register verify failed', error)
    throw error
  }
}

export async function loginWithPasskey(
  email: string,
): Promise<{
  verified: boolean
  user?: {
    id: string
    email: string
    name: string
  }
}> {
  type AuthenticationOptionsJSON = Parameters<typeof startAuthentication>[0]['optionsJSON']

  const optionsJSON = await postJson<AuthenticationOptionsJSON>('/api/webauthn/login/options', {
    email,
  })

  const authenticationResponse = await startAuthentication({
    optionsJSON,
  })

  console.log('[WebAuthn] startAuthentication resolved', authenticationResponse)

  const verificationResult = await postJson<{
    verified: boolean
    user?: {
      id: string
      email: string
      name: string
    }
  }>('/api/webauthn/login/verify', {
    email,
    response: authenticationResponse,
  })

  return verificationResult
}