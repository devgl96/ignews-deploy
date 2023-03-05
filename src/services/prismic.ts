import * as Prismic from "@prismicio/client";
import { IncomingMessage } from "http";

export function getPrismicClient(ref?: string | IncomingMessage) {
  const endpoint = Prismic.getRepositoryEndpoint("ignewsgl");

  const prismic = Prismic.createClient(endpoint, {
    ref,
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });

  return prismic;
}
