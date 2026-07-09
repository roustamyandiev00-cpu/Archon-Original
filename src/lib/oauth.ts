/**
 * OAuth2-configuratie voor de providers die via de authorization-code-flow
 * koppelen. De client-ID/secret zijn per bedrijf ingesteld (in de
 * integratie-config); hier staat enkel de provider-specifieke endpoint-info.
 */
export type OAuthConfig = {
  authorizeUrl: string;
  tokenUrl: string;
  scope?: string;
  /** Extra query-parameters op de authorize-URL. */
  extraAuthParams?: Record<string, string>;
  /** Endpoint + parser om het gekoppelde account te tonen (verbindingstest). */
  identity?: {
    url: string;
    method?: "GET" | "POST";
    /** Haalt een leesbare accountnaam uit de JSON-respons. */
    accountName: (json: unknown) => string | null;
  };
};

export const OAUTH_CONFIGS: Record<string, OAuthConfig> = {
  "exact-online": {
    // Belgische Exact Online-omgeving.
    authorizeUrl: "https://start.exactonline.be/api/oauth2/auth",
    tokenUrl: "https://start.exactonline.be/api/oauth2/token",
    extraAuthParams: { force_login: "0" },
    identity: {
      url: "https://start.exactonline.be/api/v1/current/Me?$select=UserName,FullName,CurrentDivision",
      method: "GET",
      accountName: (json) => {
        const results = (json as { d?: { results?: unknown[] } })?.d?.results;
        const me = Array.isArray(results)
          ? (results[0] as Record<string, unknown> | undefined)
          : undefined;
        if (!me) return null;
        const name = (me.FullName as string) || (me.UserName as string) || null;
        const div = me.CurrentDivision != null ? ` (divisie ${me.CurrentDivision})` : "";
        return name ? `${name}${div}` : null;
      },
    },
  },
  teamleader: {
    authorizeUrl: "https://focus.teamleader.eu/oauth2/authorize",
    tokenUrl: "https://focus.teamleader.eu/oauth2/access_token",
    identity: {
      url: "https://api.focus.teamleader.eu/users.me",
      method: "POST",
      accountName: (json) => {
        const d = (json as { data?: Record<string, unknown> })?.data;
        if (!d) return null;
        const first = (d.first_name as string) ?? "";
        const last = (d.last_name as string) ?? "";
        const full = `${first} ${last}`.trim();
        const email = (d.email as string) ?? "";
        return full || email || null;
      },
    },
  },
};

export function hasOAuth(provider: string): boolean {
  return provider in OAUTH_CONFIGS;
}

export function oauthConfig(provider: string): OAuthConfig | undefined {
  return OAUTH_CONFIGS[provider];
}

/** Bouwt de redirect-URI voor een provider op basis van de app-origin. */
export function oauthRedirectUri(origin: string, provider: string): string {
  return `${origin}/dashboard/integraties/${provider}/callback`;
}

export type OAuthTokens = {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  obtained_at: string; // ISO
};

/** Wisselt een authorization code in voor tokens (form-encoded). */
export async function exchangeCodeForTokens(
  provider: string,
  params: {
    code: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  },
): Promise<{ ok: true; tokens: OAuthTokens } | { ok: false; error: string }> {
  const cfg = oauthConfig(provider);
  if (!cfg) return { ok: false, error: "Onbekende OAuth-provider." };

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    client_secret: params.clientSecret,
  });

  try {
    const res = await fetch(cfg.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || !json.access_token) {
      const detail =
        (json.error_description as string) ||
        (json.error as string) ||
        `HTTP ${res.status}`;
      return { ok: false, error: `Token-uitwisseling mislukt: ${detail}` };
    }
    return {
      ok: true,
      tokens: {
        access_token: String(json.access_token),
        refresh_token: json.refresh_token
          ? String(json.refresh_token)
          : undefined,
        token_type: json.token_type ? String(json.token_type) : undefined,
        expires_in:
          typeof json.expires_in === "number"
            ? json.expires_in
            : Number(json.expires_in) || undefined,
        obtained_at: new Date().toISOString(),
      },
    };
  } catch (e) {
    return {
      ok: false,
      error: `Kon token-endpoint niet bereiken: ${
        e instanceof Error ? e.message : String(e)
      }`,
    };
  }
}

/** True als het access token (bijna) verlopen is (marge van 60 s). */
export function isTokenExpired(tokens: OAuthTokens): boolean {
  if (!tokens.expires_in) return false;
  const obtained = Date.parse(tokens.obtained_at);
  if (Number.isNaN(obtained)) return true;
  return Date.now() >= obtained + (tokens.expires_in - 60) * 1000;
}

/** Vernieuwt tokens via de refresh_token-grant. */
export async function refreshTokens(
  provider: string,
  params: { refreshToken: string; clientId: string; clientSecret: string },
): Promise<{ ok: true; tokens: OAuthTokens } | { ok: false; error: string }> {
  const cfg = oauthConfig(provider);
  if (!cfg) return { ok: false, error: "Onbekende OAuth-provider." };

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: params.refreshToken,
    client_id: params.clientId,
    client_secret: params.clientSecret,
  });

  try {
    const res = await fetch(cfg.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || !json.access_token) {
      const detail =
        (json.error_description as string) ||
        (json.error as string) ||
        `HTTP ${res.status}`;
      return { ok: false, error: `Token vernieuwen mislukt: ${detail}` };
    }
    return {
      ok: true,
      tokens: {
        access_token: String(json.access_token),
        // Sommige providers geven een nieuw refresh token terug; anders hergebruiken.
        refresh_token: json.refresh_token
          ? String(json.refresh_token)
          : params.refreshToken,
        token_type: json.token_type ? String(json.token_type) : undefined,
        expires_in:
          typeof json.expires_in === "number"
            ? json.expires_in
            : Number(json.expires_in) || undefined,
        obtained_at: new Date().toISOString(),
      },
    };
  } catch (e) {
    return {
      ok: false,
      error: `Kon token-endpoint niet bereiken: ${
        e instanceof Error ? e.message : String(e)
      }`,
    };
  }
}

/** Roept het identity-endpoint aan en geeft de accountnaam terug. */
export async function fetchAccountName(
  provider: string,
  accessToken: string,
): Promise<{ ok: true; account: string | null } | { ok: false; error: string }> {
  const cfg = oauthConfig(provider);
  if (!cfg?.identity) {
    return { ok: false, error: "Geen verbindingstest beschikbaar voor deze provider." };
  }
  try {
    const res = await fetch(cfg.identity.url, {
      method: cfg.identity.method ?? "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      return { ok: false, error: `Provider gaf HTTP ${res.status} terug.` };
    }
    const json = await res.json().catch(() => ({}));
    return { ok: true, account: cfg.identity.accountName(json) };
  } catch (e) {
    return {
      ok: false,
      error: `Kon provider niet bereiken: ${
        e instanceof Error ? e.message : String(e)
      }`,
    };
  }
}
