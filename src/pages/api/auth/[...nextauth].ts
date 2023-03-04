import { fauna } from "@/services/fauna";
import { query as q } from "faunadb";
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    GithubProvider({
      clientId: String(process.env.GITHUB_CLIENT_ID),
      clientSecret: String(process.env.GITHUB_CLIENT_SECRET),
      authorization: {
        params: {
          scope: "read:user",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session }: any) {
      try {
        const userActiveSubscription = await fauna.query(
          q.Get(
            q.Intersection([
              q.Match(
                q.Index("subscription_by_user_ref"),
                q.Select(
                  "ref",
                  q.Get(
                    q.Match(
                      q.Index("user_by_email"),
                      q.Casefold(session.user.email)
                    )
                  )
                )
              ),
              q.Match(q.Index("subscription_by_status"), "active"),
            ])
          )
        );

        return {
          ...session,
          activeSubscription: userActiveSubscription,
        };
      } catch {
        return {
          ...session,
          activeSubscription: null,
        };
      }
    },
    async signIn({ user }: any) {
      const { email } = user;

      // console.log("email: ", email);

      // return true;
      try {
        await fauna.query(
          q.If(
            q.Not(
              q.Exists(
                q.Match(
                  q.Index("user_by_email"),
                  q.Casefold(email) // Tudo lowercase
                )
              )
            ),
            // Verdadeiro - IF
            q.Create(q.Collection("users"), {
              data: { email },
            }),
            // Falso - ELSE
            q.Get(
              // select
              q.Match(
                q.Index("user_by_email"),
                q.Casefold(user.email) // Tudo lowercase
              )
            )
          )
        );

        return true;
      } catch (err) {
        console.error("error => ", err);
        return false;
      }
    },
  },
};

export default NextAuth(authOptions);
