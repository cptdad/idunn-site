// Verifierar ett Cloudflare Turnstile-token serverside.
// Om ingen secret är satt (ännu ej konfigurerat) tillåts anropet – så att
// flödet fungerar innan Turnstile-nycklarna lagts in.
export async function verifyTurnstile(
  token: string,
  secret: string,
  ip?: string
): Promise<boolean> {
  if (!secret) return true; // ej konfigurerat än
  if (!token) return false;

  const form = new URLSearchParams();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: form }
    );
    const data: any = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}
