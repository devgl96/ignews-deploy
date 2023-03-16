/* eslint-disable import/no-anonymous-default-export */
import { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "stream";
import Stripe from "stripe";

import { stripe } from "../../services/stripe";
import { saveSubscription } from "./_lib/manageSubscription";

// Converter a readable em string
async function buffer(readable: Readable) {
  const chunks = [];

  // Aguardar os chunk
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

// exportar uma config
export const config = {
  api: {
    bodyParser: false, // desabilitar o padrão da requisição
  },
};

// Quais os eventos serão observados
const relevantEvents = new Set([
  "checkout.session.completed",
  // "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // console.log("Event Received");
  if (req.method === "POST") {
    // Ler a requisição utilizando o readable
    const buf = await buffer(req);

    // Get no campo que envia para validação
    const secret: any = req.headers["stripe-signature"];

    // Evento realizado da forma que o Stripe aconselha
    let event: Stripe.Event;

    try {
      // Se o evento for construído, então,
      // está validada que a aplicação está com a chave de acesso correta ("If" de outra forma)
      event = stripe.webhooks.constructEvent(
        buf,
        secret,
        String(process.env.STRIPE_WEBHOOK_SECRET)
      );
    } catch (err: any) {
      return res.status(400).send(`Webhook error: ${err?.message}`);
    }

    const { type } = event;

    if (relevantEvents.has(type)) {
      // Fazer algo
      // console.log("Event Received: ", event);
      try {
        switch (type) {
          case "customer.subscription.updated":
          case "customer.subscription.deleted":
            const subscription = event.data.object as Stripe.Subscription;

            await saveSubscription(
              subscription.id,
              subscription.customer.toString()
              // type === "customer.subscription.created",
            );

            break;
          case "customer.subscription.created":
          case "checkout.session.completed":
            const checkoutSession = event.data
              .object as Stripe.Checkout.Session;

            await saveSubscription(
              String(checkoutSession?.subscription),
              String(checkoutSession.customer),
              true
            );

            break;
          default:
            throw new Error("Unhandled event");
        }
      } catch (err) {
        // sentry, bugsnag
        return res.json({ error: "Webhook handler failed." });
      }
    }

    res.json({ received: true });
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method not allowed");
  }
};
