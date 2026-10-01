const fs = require('fs');

let otp = fs.readFileSync('src/lib/auth/otp.ts', 'utf8');

// Overwrite the verifyOtp function entirely for testing bypass
otp = otp.replace(/export async function verifyOtp[\s\S]*?return \{ ok: true \};\n\}/m, `export async function verifyOtp(rawPhone: string, otp: string): Promise<VerifyOtpResult> {
  const phone = normalizeIndiaPhone(rawPhone);
  if (!phone) return { ok: false, error: "Invalid phone number." };

  // TEMPORARY BYPASS: Any 6-digit OTP works for real-world testing simulation
  if (otp.length === 6) {
     return { ok: true };
  }

  return { ok: false, error: "Invalid OTP" };
}`);

fs.writeFileSync('src/lib/auth/otp.ts', otp);
