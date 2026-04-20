export const EMAIL_RE = /\S+@\S+\.\S+/;

export function isValidEmail(email) {
  return EMAIL_RE.test(String(email).trim());
}

export async function sendForgotPasswordEmail(email) {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const json = await res.json().catch(() => null);

  return {
    ok: res.ok,
    error: json?.error || (!res.ok ? "Unable to send reset email." : ""),
    data: json,
  };
}
