import type { GroupedListItems, Settings } from "./types";

// True Story API Configuration
const TRUE_STORY_BASE_URL = "https://true-story.net/api/v1";

export interface WhatsAppApiResponse {
  success: boolean;
  message: string;
  response?: string;
}

export function generateWhatsAppMessage(groupedItems: GroupedListItems[]): string {
  if (groupedItems.length === 0) {
    return "רשימת הקניות ריקה 🛒";
  }

  let message = "🛒 *רשימת קניות*\n";
  message += "━━━━━━━━━━━━━━━\n\n";

  for (const group of groupedItems) {
    message += `*${group.category.name}*\n`;
    
    for (const item of group.items) {
      const qty = item.qty > 1 ? ` × ${item.qty}` : "";
      const note = item.note ? ` (${item.note})` : "";
      const purchased = item.purchased ? "✅ " : "⬜ ";
      message += `${purchased}${item.product.name}${qty}${note}\n`;
    }
    
    message += "\n";
  }

  const totalItems = groupedItems.reduce((sum, g) => sum + g.items.length, 0);
  message += `━━━━━━━━━━━━━━━\n`;
  message += `סה״כ: ${totalItems} פריטים`;

  return message;
}

/**
 * Convert phone number to WhatsApp JID format
 * @param phone Phone number (e.g., "0501234567" or "+972501234567")
 * @returns JID format (e.g., "972501234567@s.whatsapp.net")
 */
export function phoneToJid(phone: string): string {
  // Remove all non-digit characters
  let cleanNumber = phone.replace(/\D/g, "");
  
  // Convert Israeli format (05X) to international (9725X)
  if (cleanNumber.startsWith("0")) {
    cleanNumber = "972" + cleanNumber.slice(1);
  }
  
  // Add Israel country code if not present
  if (!cleanNumber.startsWith("972")) {
    cleanNumber = "972" + cleanNumber;
  }
  
  return `${cleanNumber}@s.whatsapp.net`;
}

/**
 * Send WhatsApp message via True Story API
 */
export async function sendWhatsAppViaApi(
  message: string,
  phoneNumber: string,
  settings: Settings
): Promise<WhatsAppApiResponse> {
  const { whatsappApiToken, whatsappInstanceId } = settings;
  
  if (!whatsappApiToken || !whatsappInstanceId) {
    return {
      success: false,
      message: "הגדרות API לא מוגדרות. הגדר token ו-instance_id בהגדרות.",
    };
  }
  
  const jid = phoneToJid(phoneNumber);
  const encodedMessage = encodeURIComponent(message);
  
  const url = `${TRUE_STORY_BASE_URL}/send-text?token=${whatsappApiToken}&instance_id=${whatsappInstanceId}&jid=${jid}&msg=${encodedMessage}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message || (data.success ? "ההודעה נשלחה!" : "שגיאה בשליחה"),
      response: data.response,
    };
  } catch (error) {
    console.error("WhatsApp API Error:", error);
    return {
      success: false,
      message: "שגיאת רשת. בדוק את החיבור לאינטרנט.",
    };
  }
}

/**
 * Send shopping list via True Story WhatsApp API
 */
export async function sendListViaApi(
  groupedItems: GroupedListItems[],
  phoneNumber: string,
  settings: Settings
): Promise<WhatsAppApiResponse> {
  const message = generateWhatsAppMessage(groupedItems);
  return sendWhatsAppViaApi(message, phoneNumber, settings);
}

/**
 * Check if WhatsApp API is configured
 */
export function isWhatsAppApiConfigured(settings: Settings): boolean {
  return !!(settings.whatsappApiToken && settings.whatsappInstanceId);
}

// Legacy functions for direct WhatsApp links (fallback)

export function getWhatsAppLink(message: string, phoneNumber?: string): string {
  const encodedMessage = encodeURIComponent(message);
  
  // Check if mobile or desktop
  const isMobile = typeof window !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (phoneNumber) {
    // Direct message to specific number
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    return isMobile
      ? `whatsapp://send?phone=${cleanNumber}&text=${encodedMessage}`
      : `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
  }
  
  // Open WhatsApp to choose recipient
  return isMobile
    ? `whatsapp://send?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;
}

export function shareToWhatsApp(groupedItems: GroupedListItems[], phoneNumber?: string): void {
  const message = generateWhatsAppMessage(groupedItems);
  const link = getWhatsAppLink(message, phoneNumber);
  
  if (typeof window !== "undefined") {
    window.open(link, "_blank");
  }
}

