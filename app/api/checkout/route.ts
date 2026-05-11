import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    // 1. Le raccourci : on vérifie d'abord s'il y a une vraie clé Stripe.
    // Si la clé n'existe pas, on renvoie notre lien de test AVANT que Stripe ne plante.
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ url: "https://stripe.com/docs/testing" });
    }

    // 2. Si on a bien une clé, on a le droit d'initialiser Stripe ici
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
    });

    const body = await req.json();
    const { plan } = body;

    let priceId = "";
    if (plan === "pro") priceId = "price_12345_PRO_MOCKUP";
    if (plan === "agence") priceId = "price_67890_AGENCE_MOCKUP";

    // On s'assure d'avoir une URL de base valide pour le retour
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${baseUrl}/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/tarifs`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    // Si Stripe rencontre une erreur (ex: mauvais Price ID), on renvoie l'erreur en JSON proprement
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}