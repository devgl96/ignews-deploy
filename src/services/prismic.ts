import * as Prismic from "@prismicio/client";

export function getPrismicClient(ref?: any) {
  const endpoint = Prismic.getRepositoryEndpoint("ignewsgl");

  const prismic = Prismic.createClient(endpoint, {
    ref,
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });

  return prismic;
}
