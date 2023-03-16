import { query as q } from "faunadb";

import { fauna } from "../../../services/fauna";
import { stripe } from "../../../services/stripe";

export async function saveSubscription(
  subscriptionId: string,
  customerId: string,
  createAction = false
) {
  // Buscar o usuário no banco do FaunaDB com o ID {stripe_customerId}
  // Especificando apenas qual o dado que se quer retornar
  const userRef = await fauna.query(
    q.Select(
      "ref",
      q.Get(q.Match(q.Index("user_by_stripe_customer_id"), customerId))
    )
  );

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const subscriptionData = {
    id: subscription.id,
    userId: userRef,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id,
  };

  // Salvar os dados da subscription do usuário no FaunaDB
  if (createAction) {
    await fauna.query(
      q.Create(q.Collection("subscriptions"), { data: subscriptionData })
    );
  } else {
    await fauna.query(
      q.Replace(
        // Update: Atualizar uma das informações ou Replace: Substituir uma subscription por completo
        q.Select(
          "ref",
          q.Get(q.Match(q.Index("subscription_by_id"), subscription.id))
        ),
        { data: subscriptionData }
      )
    );
  }
}
