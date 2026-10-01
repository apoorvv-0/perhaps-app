/**
 * MessageCentral SMS OTP Provider
 *
 * Implements the SmsProvider interface using the MessageCentral API.
 * Swap to a different provider by implementing the same interface.
 *
 * DLT-registered sender ID and template ID are required for delivery in India.
 */

import axios from "axios";

// ─────────────────────────────────────────────
// Provider Interface (swappable)
// ─────────────────────────────────────────────

export interface SmsProvider {
  sendOtp(phoneNumber: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// ─────────────────────────────────────────────
// MessageCentral Implementation
// ─────────────────────────────────────────────

const MC_BASE_URL = "https://cpaas.messagecentral.com";

interface McAuthResponse {
  token: string;
}

interface McSendOtpResponse {
  responseCode: number;
  message: string;
  data?: {
    verificationId: string;
  };
}

async function getMcAuthToken(): Promise<string> {
  const customerId = process.env.MESSAGECENTRAL_CUSTOMER_ID;
  const password = process.env.MESSAGECENTRAL_PASSWORD;

  if (!customerId || !password) {
    throw new Error("MessageCentral credentials not configured");
  }

  // MessageCentral requires base64-encoded password
  const encodedPassword = Buffer.from(password).toString("base64");

  const response = await axios.get<McAuthResponse>(
    `${MC_BASE_URL}/auth/v1/authentication/token`,
    {
      params: {
        customerId,
        key: encodedPassword,
        scope: "NEW",
        country: process.env.MESSAGECENTRAL_COUNTRY_CODE ?? "91",
        email: "noreply@medmutuals.app",
      },
      timeout: 10000,
    }
  );

  return response.data.token;
}

export class MessageCentralProvider implements SmsProvider {
  async sendOtp(
    phoneNumber: string,
    otp: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const token = await getMcAuthToken();
      const senderId = process.env.MESSAGECENTRAL_SENDER_ID ?? "ROVIRA";
      const dltTemplateId = process.env.MESSAGECENTRAL_DLT_TEMPLATE_ID;

      const response = await axios.post<McSendOtpResponse>(
        `${MC_BASE_URL}/verification/v3/send`,
        null,
        {
          params: {
            countryCode: process.env.MESSAGECENTRAL_COUNTRY_CODE ?? "91",
            flowType: "SMS",
            mobileNumber: phoneNumber.replace(/^\+91/, ""), // strip country code if present
            senderId,
            type: "SMS",
            message: `Your Perhaps verification code is ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES ?? 10} minutes. Do not share this code.`,
            dltTemplateId,
          },
          headers: {
            authToken: token,
          },
          timeout: 10000,
        }
      );

      if (response.data.responseCode === 200) {
        return {
          success: true,
          messageId: response.data.data?.verificationId,
        };
      }

      return {
        success: false,
        error: response.data.message,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "SMS send failed";
      console.error("[MessageCentral] sendOtp error:", message);
      return { success: false, error: message };
    }
  }
}

// ─────────────────────────────────────────────
// Mock Provider (for local dev without real keys)
// ─────────────────────────────────────────────

export class MockSmsProvider implements SmsProvider {
  async sendOtp(
    phoneNumber: string,
    otp: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log(
      `[MockSMS] OTP for ${phoneNumber}: ${otp} (not actually sent)`
    );
    return { success: true, messageId: `mock-${Date.now()}` };
  }
}

// ─────────────────────────────────────────────
// Exported singleton — swap here to change provider
// ─────────────────────────────────────────────

export const smsProvider: SmsProvider =
  process.env.NODE_ENV === "production"
    ? new MessageCentralProvider()
    : new MockSmsProvider();
