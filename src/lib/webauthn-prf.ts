export function isWebAuthnAvailable(): boolean {
  return (
    typeof window !== 'undefined' && !!window.PublicKeyCredential
  );
}

export async function registerCredential(username: string): Promise<{
  credentialId: ArrayBuffer;
  prfSalt: Uint8Array;
  prfOutput: ArrayBuffer;
}> {
  const prfSalt = crypto.getRandomValues(new Uint8Array(32));

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: 'FMG Tools', id: window.location.hostname },
      user: {
        id: crypto.getRandomValues(new Uint8Array(16)),
        name: username,
        displayName: username,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      extensions: {
        prf: { eval: { first: prfSalt as BufferSource } },
      },
    },
  })) as PublicKeyCredential;

  const prfResults = (
    credential.getClientExtensionResults() as Record<string, unknown> & {
      prf?: { results?: { first?: ArrayBuffer } };
    }
  ).prf;

  if (!prfResults?.results?.first) {
    throw new Error(
      'Your device does not support biometric vault unlock (WebAuthn PRF). Tokens will not be saved.',
    );
  }

  return {
    credentialId: credential.rawId,
    prfSalt,
    prfOutput: prfResults.results.first,
  };
}

export async function authenticate(
  credentialId: ArrayBuffer,
  prfSalt: Uint8Array,
): Promise<ArrayBuffer> {
  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{ type: 'public-key', id: credentialId }],
      userVerification: 'required',
      extensions: {
        prf: { eval: { first: prfSalt as BufferSource } },
      },
    },
  })) as PublicKeyCredential;

  const prfResults = (
    assertion.getClientExtensionResults() as Record<string, unknown> & {
      prf?: { results?: { first?: ArrayBuffer } };
    }
  ).prf;

  if (!prfResults?.results?.first) {
    throw new Error('Biometric authentication failed');
  }

  return prfResults.results.first;
}
