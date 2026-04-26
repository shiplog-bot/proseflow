import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const githubLogin = (session as any).githubLogin;

  // Stripe checkout URL — will be filled once Stripe is configured
  const checkoutUrl = process.env.STRIPE_CHECKOUT_URL || 
    `https://buy.stripe.com/placeholder?client_reference_id=${githubLogin}`;

  return NextResponse.json({ url: checkoutUrl });
}
