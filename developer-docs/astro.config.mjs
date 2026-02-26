import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://developer.bedrockchat.com',
  integrations: [
    starlight({
      title: 'Bedrock Chat Developer Docs',
      description:
        'Build bots and integrations for Bedrock Chat. API reference, guides, and platform documentation.',
      logo: {
        src: './src/assets/bedrock-logo.svg',
        replacesTitle: false,
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/bedrockchat',
        },
      ],
      sidebar: [
        {
          label: 'Start Here',
          items: [
            { label: 'What is a Bot?', slug: 'getting-started/what-is-a-bot' },
            { label: 'What You Need', slug: 'getting-started/what-you-need' },
            {
              label: 'Becoming a Developer',
              slug: 'getting-started/becoming-a-developer',
            },
            {
              label: 'How Bots Work',
              slug: 'getting-started/how-bots-work',
            },
            {
              label: 'Your First Bot',
              slug: 'getting-started/your-first-bot',
            },
          ],
        },
        {
          label: 'Building Your Bot',
          items: [
            {
              label: 'Choosing a Platform',
              slug: 'building-your-bot/choosing-a-platform',
            },
            {
              label: 'Setting Up Your Workspace',
              slug: 'building-your-bot/setting-up-your-workspace',
            },
            {
              label: 'Writing Your Bot Code',
              slug: 'building-your-bot/writing-your-bot-code',
            },
            {
              label: 'Making Your Bot Respond',
              slug: 'building-your-bot/making-your-bot-respond',
            },
            {
              label: 'Adding Commands',
              slug: 'building-your-bot/adding-commands',
            },
            {
              label: 'Testing Your Bot',
              slug: 'building-your-bot/testing-your-bot',
            },
          ],
        },
        {
          label: 'Webhooks',
          items: [
            {
              label: 'What is a Webhook?',
              slug: 'webhooks/what-is-a-webhook',
            },
            {
              label: 'Setting Up Webhooks',
              slug: 'webhooks/setting-up-webhooks',
            },
            { label: 'Webhook Events', slug: 'webhooks/webhook-events' },
            { label: 'Webhook Examples', slug: 'webhooks/webhook-examples' },
          ],
        },
        {
          label: 'Publishing Your Bot',
          items: [
            {
              label: 'Our Requirements',
              slug: 'publishing/our-requirements',
            },
            {
              label: 'Submitting for Review',
              slug: 'publishing/submitting-for-review',
            },
            {
              label: 'The Review Process',
              slug: 'publishing/the-review-process',
            },
            { label: 'After Approval', slug: 'publishing/after-approval' },
          ],
        },
        {
          label: 'Privacy & Rules',
          items: [
            {
              label: 'Our Privacy Promise',
              slug: 'privacy-and-rules/our-privacy-promise',
            },
            {
              label: 'What Your Bot Can Access',
              slug: 'privacy-and-rules/what-your-bot-can-access',
            },
            {
              label: 'What Your Bot Cannot Do',
              slug: 'privacy-and-rules/what-your-bot-cannot-do',
            },
            {
              label: 'Protecting Young Users',
              slug: 'privacy-and-rules/protecting-young-users',
            },
            {
              label: 'Data Handling Rules',
              slug: 'privacy-and-rules/data-handling-rules',
            },
          ],
        },
        {
          label: 'API Reference',
          items: [
            { label: 'Overview', slug: 'api-reference/overview' },
            { label: 'Messages', slug: 'api-reference/messages' },
            { label: 'Channels', slug: 'api-reference/channels' },
            { label: 'Servers', slug: 'api-reference/servers' },
            { label: 'Users', slug: 'api-reference/users' },
            { label: 'Events', slug: 'api-reference/events' },
          ],
        },
        {
          label: 'Step-by-Step Guides',
          items: [
            { label: 'Welcome Bot', slug: 'guides/welcome-bot' },
            { label: 'Reminder Bot', slug: 'guides/reminder-bot' },
            { label: 'Trivia Bot', slug: 'guides/trivia-bot' },
            { label: 'Moderation Bot', slug: 'guides/moderation-bot' },
            {
              label: 'Event Scheduler',
              slug: 'guides/event-scheduler-bot',
            },
          ],
        },
        {
          label: 'Recommended Tools',
          items: [
            {
              label: 'Where to Write Code',
              slug: 'recommended-tools/where-to-write-code',
            },
            {
              label: 'Free Hosting Options',
              slug: 'recommended-tools/free-hosting-options',
            },
            {
              label: 'Helpful Resources',
              slug: 'recommended-tools/helpful-resources',
            },
          ],
        },
        {
          label: 'Troubleshooting',
          items: [
            {
              label: 'Common Problems',
              slug: 'troubleshooting/common-problems',
            },
            {
              label: 'Error Messages',
              slug: 'troubleshooting/error-messages',
            },
            { label: 'Getting Help', slug: 'troubleshooting/getting-help' },
          ],
        },
        { label: 'Glossary', slug: 'glossary' },
      ],
      customCss: ['./src/styles/custom.css'],
      head: [],
      editLink: {
        baseUrl:
          'https://github.com/bedrockchat/bedrockchat/edit/main/developer-docs/',
      },
      lastUpdated: true,
      pagination: true,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
    }),
  ],
});
