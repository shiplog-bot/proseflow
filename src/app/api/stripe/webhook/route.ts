import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.text();
  let event: any;
  try { event = JSON.parse(body); }
  catch (err) { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  // Stripe webhook handling — expand when Stripe is configured
  console.log("Stripe webhook:", event.type);
  return NextResponse.json({ received: true });
}
