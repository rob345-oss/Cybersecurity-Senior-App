import type { Lesson } from '../types'

export const techSupportScamsLesson: Lesson = {
  id: 'tech-support-scams',
  slug: 'how-to-spot-tech-support-scams',
  title: 'How to Spot Tech Support Scams',
  summary:
    'Learn how to recognize when someone pretends to be from a trusted company to scare you into clicking, paying, or giving remote access.',
  estimatedMinutes: 10,
  difficulty: 'beginner',
  relatedModules: ['callguard', 'inboxguard'],
  relatedSignals: ['tech_support', 'remote_access_request', 'urgency', 'gift_cards'],
  sections: [
    {
      type: 'intro',
      title: 'Goal of This Lesson',
      body: 'Today we are going to learn how to recognize a common scam called a tech support scam. A tech support scam happens when a scammer pretends to be from a real company, such as Microsoft, Apple, Amazon, your bank, your internet company, or another trusted organization. They may call, email, text, or show a pop-up on your computer claiming that something is wrong with your device or account. Their real goal is not to help you. Their goal is to scare you into clicking a link, giving them remote access to your device, sharing personal information, or paying money.',
    },
    {
      type: 'quotes',
      title: 'What a Tech Support Scam Might Sound Like',
      intro: 'A scammer may say things like:',
      quotes: [
        'Your computer has a virus.',
        'Your account has been hacked.',
        'Someone is trying to steal your information.',
        'We found a serious problem with your device.',
        'You must act now or your account will be closed.',
        'We can fix the problem for a small fee.',
      ],
    },
    {
      type: 'warning_sign',
      number: 1,
      title: 'Is There Urgency?',
      body: 'Scammers often try to make you panic. Real companies usually do not pressure you this way. If someone is rushing you, that is a warning sign.',
      examples: [
        'You must act immediately.',
        'This is your final warning.',
        'Your account will be locked.',
        'Your computer is infected right now.',
      ],
    },
    {
      type: 'warning_sign',
      number: 2,
      title: 'Did They Contact You First?',
      body: 'Be careful if someone calls, emails, or texts you out of nowhere claiming there is a problem with your computer, phone, bank account, or online account. Real organizations usually do not randomly contact you to troubleshoot your technology. For example, Microsoft or Apple will not suddenly call you and say your computer has a virus.',
    },
    {
      type: 'warning_sign',
      number: 3,
      title: 'Are They Asking You to Click a Link?',
      body: 'Scammers may send links that look official. These links can lead to fake websites that steal your information or install harmful software. Do not click links from unexpected messages. Instead, go directly to the company\'s official website by typing the address yourself or using an app you already trust.',
    },
    {
      type: 'warning_sign',
      number: 4,
      title: 'Are They Asking for Payment?',
      body: 'A scammer may ask you to pay for "tech support" using gift cards, wire transfers, cryptocurrency, payment apps, credit cards, or bank transfers. Gift cards and cryptocurrency are especially suspicious. Real companies do not ask for payment through gift cards.',
    },
    {
      type: 'warning_sign',
      number: 5,
      title: 'Are They Asking for Remote Access?',
      body: 'Some scammers ask you to download a program so they can "fix" your computer. This can allow them to see your screen, control your device, steal passwords, or access bank accounts. Never give remote access to someone who contacted you unexpectedly.',
    },
    {
      type: 'rule',
      title: 'Simple Rule to Remember',
      body: 'Stop. Don\'t click. Don\'t pay. Don\'t give control. If someone says there is an emergency with your computer or account, pause before doing anything.',
    },
    {
      type: 'steps',
      title: 'What You Should Do Instead',
      steps: [
        'Do not click any links.',
        'Do not call the number shown in the message or pop-up.',
        'Do not give personal information.',
        'Do not give remote access to your device.',
        'Do not pay anyone.',
        'Contact a trusted family member, friend, or the company directly using a phone number or website you know is real.',
      ],
    },
    {
      type: 'scenario',
      title: 'Example Situation',
      prompt:
        'You are using your computer and a pop-up appears that says: "Warning! Your computer has been infected. Call this number immediately for Microsoft support."',
      question: 'What should you do?',
      answer:
        'Do not call the number. Do not click anything. Close the window if you can. If you are unsure, turn off the computer and ask someone you trust for help.',
    },
    {
      type: 'practice',
      title: 'Practice Question',
      question:
        'A person calls and says they are from Apple. They say your iCloud account has been hacked and they need your password to fix it. Is this safe or suspicious?',
      correctAnswer: 'suspicious',
      explanation:
        'Suspicious. A real company will not call unexpectedly and ask for your password.',
    },
    {
      type: 'takeaway',
      title: 'Final Takeaway',
      body: 'Tech support scammers want you to feel scared and rushed. Their message may look or sound official, but the warning signs are usually the same: urgency, unexpected contact, links, payment requests, or requests for remote access. When in doubt, stop and ask someone you trust before taking action.',
    },
  ],
}
