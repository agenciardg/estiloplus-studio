// Stripe Webhook Handlers - estiloplus.studio
import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { supabase } from './supabase';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string, uuid: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature, uuid);
  }

  static async handleCheckoutCompleted(session: any) {
    const stripe = await getUncachableStripeClient();
    
    const userId = session.metadata?.userId;
    const credits = parseInt(session.metadata?.credits || '0', 10);
    const packageId = session.metadata?.packageId;

    if (!userId || !credits) {
      console.error('Missing userId or credits in checkout session metadata');
      return;
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userId);
      return;
    }

    const newCredits = (user.credits || 0) + credits;
    
    await supabase
      .from('users')
      .update({ credits: newCredits })
      .eq('id', userId);

    await supabase.from('credit_purchases').insert({
      user_id: userId,
      credits,
      amount_paid: session.amount_total || 0,
      stripe_payment_intent_id: session.payment_intent || session.id,
    });

    console.log(`Added ${credits} credits to user ${userId}. New total: ${newCredits}`);
  }
}
