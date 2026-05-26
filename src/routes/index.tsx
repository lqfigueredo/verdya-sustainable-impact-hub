import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Hero } from "@/components/landing/Hero";
import { WhatIs } from "@/components/landing/WhatIs";
import { Featured } from "@/components/landing/Featured";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Newsletter } from "@/components/landing/Newsletter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Verdya — The global hub for corporate ESG" },
      {
        name: "description",
        content:
          "Verdya is an international networking and education hub for corporate sustainability and ESG professionals.",
      },
      { property: "og:title", content: "Verdya — The global hub for corporate ESG" },
      {
        property: "og:description",
        content: "Education, networking and resources for ESG practitioners worldwide.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <Layout>
      <Hero />
      <WhatIs />
      <Featured />
      <HowItWorks />
      <Newsletter />
    </Layout>
  );
}
