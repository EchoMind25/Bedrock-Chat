import type { Metadata } from "next";
import { headers } from "next/headers";
import { SwitchContent } from "./switch-content";
import { trackMigrationEvent } from "@/lib/services/migration-analytics";

export const metadata: Metadata = {
  title: "Switch from Discord to Bedrock Chat — Privacy-First Migration",
  description:
    "Move your Discord server to Bedrock Chat in minutes. Keep your channels, roles, and community. No government ID. No facial recognition. No data mining.",
  keywords: [
    "Discord alternative",
    "leave Discord",
    "Discord privacy concerns",
    "Discord ID verification alternative",
    "family safe Discord alternative",
    "Discord migration",
    "privacy chat app",
  ],
  openGraph: {
    title: "Switch from Discord to Bedrock Chat",
    description:
      "Privacy-first communication. Move your community in minutes.",
    url: "https://bedrockchat.com/switch",
    type: "website",
    images: [
      {
        url: "/og/switch.png",
        width: 1200,
        height: 630,
        alt: "Switch from Discord to Bedrock Chat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Switch from Discord to Bedrock Chat",
    description:
      "Privacy-first communication. Move your community in minutes.",
  },
  alternates: {
    canonical: "https://bedrockchat.com/switch",
  },
};

const faqItems = [
  {
    question: "Will I lose my messages?",
    answer:
      "Message history stays on Discord. Bedrock Chat imports your server structure \u2014 channels, roles, and categories \u2014 not message content. This is by design: we don\u2019t move private conversations without every participant\u2019s explicit consent.",
  },
  {
    question: "Can my whole server move at once?",
    answer:
      "Yes! Export your Discord server structure, import it into Bedrock Chat, then share an invite link with your community. Most servers complete the switch in under a week.",
  },
  {
    question: "How long does migration take?",
    answer:
      "The technical import takes about 5 minutes. The community transition depends on your server \u2014 most admins run both platforms in parallel for a week or two, then sunset Discord when everyone\u2019s settled.",
  },
  {
    question: "Is Bedrock really free?",
    answer:
      "Yes. Bedrock Chat is free and open source. We\u2019re sustained by optional premium features and community support \u2014 never by selling your data or serving ads.",
  },
  {
    question: "What about my Discord bots?",
    answer:
      "Discord bots won\u2019t transfer directly, but many popular bot functions are built into Bedrock natively. We\u2019re also building our own integration system for custom automation.",
  },
  {
    question: "Can I run both during transition?",
    answer:
      "Absolutely \u2014 we recommend it. Run Bedrock Chat alongside Discord, let your community explore at their own pace, and make the full switch when everyone\u2019s ready.",
  },
  {
    question: "What if I\u2019m under 18?",
    answer:
      "Bedrock Chat is built for families. Teens join through a Family Account with transparent parental monitoring \u2014 you always know what\u2019s being monitored. No hidden surveillance, ever.",
  },
  {
    question:
      "How is family monitoring different from Discord\u2019s surveillance?",
    answer:
      "Discord may scan messages and media with AI for content moderation without telling you what\u2019s flagged or why. Bedrock\u2019s family monitoring is transparent: teens see exactly what parents can see, monitoring levels are clearly displayed, and there\u2019s no hidden AI scanning.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to migrate from Discord to Bedrock Chat",
  description:
    "Move your Discord server to Bedrock Chat in three simple steps.",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Import Your Server Structure",
      text: "Export your Discord server data and import it into Bedrock Chat. Channels, roles, and categories are recreated automatically.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Invite Your Community",
      text: "Share a Bedrock Chat invite link with your Discord community. They sign up and join your new server.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Start Chatting",
      text: "Your community is home. Start chatting with the same crew on a platform that respects your privacy.",
    },
  ],
};

export default async function SwitchPage() {
  // Server-side aggregate analytics — no cookies, no PII
  const headerList = await headers();
  const referer = headerList.get("referer");
  trackMigrationEvent("switch_page_view", referer);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <SwitchContent faqItems={faqItems} />
    </>
  );
}
