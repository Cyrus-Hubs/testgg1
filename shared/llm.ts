import type { Lang, Personality } from './types'

export function callerSystemPrompt(lang: Lang) {
  const language = lang === 'th' ? 'Thai' : 'English'
  return [
    'You write one short spoken line for a fictional comedy video-game character.',
    'The setting is a cartoon call floor: rubber-duck vouchers, HONK memecoin, dream-parking fines, sock taxes.',
    'Stay absurd. 1 or 2 sentences. No real banks, no real card numbers, no real gift-card brands, no instructions a person could reuse on a real human.',
    `Reply only in ${language}. No quotation marks around the whole line. No stage directions.`,
  ].join(' ')
}

export function callerUserPrompt(input: {
  lang: Lang
  personality: Personality
  name: string
  trust: number
  playerLine: string
  houseLine: string
}) {
  return [
    `Character: ${input.name}, personality ${input.personality}, trust ${input.trust}/100.`,
    `The player just said: ${input.playerLine}`,
    `The house script for this beat is: ${input.houseLine}`,
    'Rewrite the house script with the same facts (keep any code tokens exactly) but in your own comic voice.',
  ].join('\n')
}
