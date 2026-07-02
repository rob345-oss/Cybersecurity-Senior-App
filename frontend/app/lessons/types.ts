export type LessonDifficulty = 'beginner' | 'intermediate' | 'advanced'

export type RelatedModule = 'callguard' | 'moneyguard' | 'inboxguard' | 'identitywatch'

export interface LessonIntroSection {
  type: 'intro'
  title: string
  body: string
}

export interface LessonQuotesSection {
  type: 'quotes'
  title: string
  intro?: string
  quotes: string[]
}

export interface LessonWarningSignSection {
  type: 'warning_sign'
  number: number
  title: string
  body: string
  examples?: string[]
}

export interface LessonRuleSection {
  type: 'rule'
  title: string
  body: string
}

export interface LessonStepsSection {
  type: 'steps'
  title: string
  steps: string[]
}

export interface LessonScenarioSection {
  type: 'scenario'
  title: string
  prompt: string
  question: string
  answer: string
}

export interface LessonPracticeSection {
  type: 'practice'
  title: string
  question: string
  correctAnswer: 'safe' | 'suspicious'
  explanation: string
}

export interface LessonTakeawaySection {
  type: 'takeaway'
  title: string
  body: string
}

export type LessonSection =
  | LessonIntroSection
  | LessonQuotesSection
  | LessonWarningSignSection
  | LessonRuleSection
  | LessonStepsSection
  | LessonScenarioSection
  | LessonPracticeSection
  | LessonTakeawaySection

export interface Lesson {
  id: string
  slug: string
  title: string
  summary: string
  estimatedMinutes: number
  difficulty: LessonDifficulty
  relatedModules: RelatedModule[]
  relatedSignals: string[]
  sections: LessonSection[]
}
