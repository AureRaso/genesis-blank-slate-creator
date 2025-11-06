/**
 * Whapi.cloud client for sending WhatsApp messages
 * Documentation: https://whapi.cloud/api
 */

export interface WhapiConfig {
  apiUrl: string;
  token: string;
}

export interface SendMessageParams {
  to: string; // Phone number in format: 34612345678@s.whatsapp.net or group ID
  body: string;
  typing_time?: number; // Simulate typing in seconds
}

export interface WhapiResponse {
  success: boolean;
  message?: string;
  error?: string;
  messageId?: string;
}

/**
 * Send a text message via Whapi.cloud
 */
export async function sendWhatsAppMessage(
  config: WhapiConfig,
  params: SendMessageParams
): Promise<WhapiResponse> {
  try {
    const response = await fetch(`${config.apiUrl}/messages/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`
      },
      body: JSON.stringify({
        to: params.to,
        body: params.body,
        typing_time: params.typing_time || 0
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();

    return {
      success: true,
      message: 'Message sent successfully',
      messageId: data.id || data.messageId
    };
  } catch (error) {
    console.error('Whapi send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send message to a WhatsApp group
 */
export async function sendGroupMessage(
  config: WhapiConfig,
  groupId: string,
  message: string
): Promise<WhapiResponse> {
  return sendWhatsAppMessage(config, {
    to: groupId,
    body: message,
    typing_time: 2 // Simulate 2 seconds of typing
  });
}

/**
 * Format phone number for Whapi
 * Input: +34 612 345 678 or 612345678
 * Output: 34612345678@s.whatsapp.net
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // If it doesn't end with @s.whatsapp.net, add it
  if (!phone.includes('@')) {
    return `${digits}@s.whatsapp.net`;
  }

  return phone;
}

/**
 * Validate Whapi configuration
 */
export function validateWhapiConfig(config: Partial<WhapiConfig>): config is WhapiConfig {
  if (!config.apiUrl || !config.token) {
    return false;
  }

  if (!config.apiUrl.startsWith('http')) {
    return false;
  }

  return true;
}

/**
 * Test Whapi connection
 */
export async function testWhapiConnection(config: WhapiConfig): Promise<boolean> {
  try {
    const response = await fetch(`${config.apiUrl}/settings/info`, {
      headers: {
        'Authorization': `Bearer ${config.token}`
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Whapi connection test failed:', error);
    return false;
  }
}
