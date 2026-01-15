// LemonSqueezy Configuration
export const LEMONSQUEEZY_CONFIG = {
  storeId: '266923',
  productId: '756942',
  variants: {
    monthly: '1191351',
    annual: '1191365',
  },
} as const

/**
 * Generate LemonSqueezy checkout URL
 * @param variant - 'monthly' or 'annual'
 * @param userEmail - User's email to prefill
 * @param userId - Supabase user ID to track in webhook
 */
export function getCheckoutUrl(
  variant: 'monthly' | 'annual',
  userEmail?: string,
  userId?: string
): string {
  const variantId = LEMONSQUEEZY_CONFIG.variants[variant]
  const baseUrl = `https://medusa-ai.lemonsqueezy.com/checkout/buy/${variantId}`

  const params = new URLSearchParams()

  // Prefill email if provided
  if (userEmail) {
    params.append('checkout[email]', userEmail)
  }

  // Pass user ID as custom data for webhook
  if (userId) {
    params.append('checkout[custom][user_id]', userId)
  }

  // Disable logo for cleaner checkout
  params.append('logo', '0')

  // Enable dark mode
  params.append('dark', '1')

  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

/**
 * Get customer portal URL for managing subscription
 */
export function getCustomerPortalUrl(): string {
  return 'https://medusa-ai.lemonsqueezy.com/billing'
}

/**
 * Open URL in default browser
 */
async function openUrl(url: string): Promise<void> {
  // Open in new tab/window
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Open checkout in default browser
 */
export async function openCheckout(
  variant: 'monthly' | 'annual',
  userEmail?: string,
  userId?: string
): Promise<void> {
  const url = getCheckoutUrl(variant, userEmail, userId)
  await openUrl(url)
}

/**
 * Open customer portal in default browser
 */
export async function openCustomerPortal(): Promise<void> {
  const url = getCustomerPortalUrl()
  await openUrl(url)
}
