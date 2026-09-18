/**
 * Social Gravity — M21: Content Risk Categories & Lexicons
 * High-precision linguistic definitions, regex patterns, and indicator weights
 * for the 5 Content Safety Pillars:
 * 1. Hate: Hostile targeting, hate speech, protected identity attacks
 * 2. Explicit: Sexually explicit content, pornography, NSFW solicitation
 * 3. Terrorism: Violent extremism, terrorist propaganda, radicalization
 * 4. Violence: Violent threats, physical harm incitement, weapons/lethal acts
 * 5. Harassment: Targeted abuse, doxxing, intimidation, cyberbullying
 */

export interface PatternRule {
  pattern: RegExp;
  weight: number;
  reason: string;
}

export const HATE_RULES: PatternRule[] = [
  {
    pattern: /\b(subhuman|vermin|cockroach\w*|parasites?|filthy|degenerates?)\s+(race|people|immigrants?|minorities|jews|muslims|blacks|refugees)\b/i,
    weight: 0.90,
    reason: 'dehumanizing rhetoric targeting protected groups',
  },
  {
    pattern: /\b(hate speech|kill all (men|women|whites|blacks|jews|muslims|gays|trans)|white genocide|ethnic cleansing)\b/i,
    weight: 0.95,
    reason: 'genocidal rhetoric or hate-motivated incitement',
  },
  {
    pattern: /\b(faggot\w*|nigger\w*|kike\w*|chink\w*|spic\w*|tranny\w*|gook\w*)\b/i,
    weight: 0.95,
    reason: 'explicit targeted racial, religious, or sexual slur',
  },
  {
    pattern: /\b(go back to your country|send them back|invaders raping|inferior race|genetic trash)\b/i,
    weight: 0.85,
    reason: 'xenophobic and racial hostility rhetoric',
  },
  {
    pattern: /\b(homophobic|transphobic|antisemitic|islamophobic)\s+(attack|propaganda|manifesto)\b/i,
    weight: 0.80,
    reason: 'targeted hate propaganda indicator',
  },
];

export const EXPLICIT_RULES: PatternRule[] = [
  {
    pattern: /\b(porn\w*|xxx|hentai|nsfw\w*|erotic\w*|gangbang|hardcore|blowjob\w*|cunnilingus|dildo\w*|fleshlight\w*|camgirl\w*|onlyfans leak|masturbat\w*)\b/i,
    weight: 0.85,
    reason: 'explicit sexual terminology',
  },
  {
    pattern: /\b(naked|nude\w*|breasts|penis|vagina|clitoris|boobs|genital\w*|intercourse|sex tape|sex video|hookup leak)\b/i,
    weight: 0.80,
    reason: 'explicit anatomical or adult video leak reference',
  },
  {
    pattern: /\b(escort service|adult cam|webcam model|live sex|strip show|cumshot|creampie)\b/i,
    weight: 0.90,
    reason: 'adult service / solicitation indicator',
  },
  {
    pattern: /\b(pornhub|xvideos|redtube|xnxx|chaturbate|onlyfans\.com\/[a-z0-9_]+)\b/i,
    weight: 0.95,
    reason: 'known adult pornography domain reference',
  },
];

export const TERRORISM_RULES: PatternRule[] = [
  {
    pattern: /\b(al-qaeda|isis|daesh|isil|boko haram|al-shabaab|taliban propaganda|jihad\w*(\s+(network|cell|group))?|hamas brigade|hezbollah militia)\b/i,
    weight: 0.85,
    reason: 'designated violent extremist entity reference',
  },
  {
    pattern: /\b(martyrdom(\s+(operation\w*|strike\w*|attack\w*|mission\w*))?|suicide bomb\w*|ied attack|car bomb detonation|death to infidels|pledge allegiance to caliphate|beheading video)\b/i,
    weight: 0.95,
    reason: 'extremist attack glorification or martyrdom incitement',
  },
  {
    pattern: /(#?holy\s*war\w*|\bjoin the caliphate\b|\brecruitment cell\b|\btake up arms for the cause\b|\bexecute prisoners\b|\btarget civilians\b)/i,
    weight: 0.85,
    reason: 'violent extremist recruitment or mobilization call',
  },
  {
    pattern: /\b(terrorist manifesto|bomb(-|\s+)?(making\s+|detonation\s+)?(manual|sequence|device|attack)?|anarchist cookbook explosive|poison water supply|mass casualty event guidance|lone wolf attack protocol)\b/i,
    weight: 0.95,
    reason: 'terrorist operational guide / manifesto distribution',
  },
  {
    pattern: /\b(white supremacist vanguard|race war now|siege culture|accelerationist cell|day of the rope|ethnostate violently)\b/i,
    weight: 0.90,
    reason: 'violent ideological extremism / accelerationist propaganda',
  },
];

export const VIOLENCE_RULES: PatternRule[] = [
  {
    pattern: /\b(i will kill you|i('ll| will) murder|slit (your|their) throat|shoot (up|them)|put a bullet in|blow (your|their) head off)\b/i,
    weight: 0.95,
    reason: 'direct lethal threat of physical violence',
  },
  {
    pattern: /\b(mass shooting|school shooting|open fire on civilians|stabbing spree|lynch\w*|massacre\w*)\b/i,
    weight: 0.90,
    reason: 'mass casualty violence / weapons attack incitement',
  },
  {
    pattern: /\b(beat (him|her|them) to death|break (your|their) bones|decapitat\w*|tortur\w* video|blood bath)\b/i,
    weight: 0.85,
    reason: 'graphic physical harm and torture descriptions',
  },
  {
    pattern: /\b(burn down their house|plant explosives|detonate a bomb|armed assault)\b/i,
    weight: 0.90,
    reason: 'arson / explosive physical attack threats',
  },
];

export const HARASSMENT_RULES: PatternRule[] = [
  {
    pattern: /\b(doxxed|doxxing|here is (his|her|their) home address|phone number leaked|swat (them|him|her)|swatting)\b/i,
    weight: 0.95,
    reason: 'malicious doxxing and physical swatting harassment',
  },
  {
    pattern: /\b(kill yourself|kys|go die in a ditch|nobody would miss you|end your life)\b/i,
    weight: 0.95,
    reason: 'severe targeted cyberbullying and self-harm incitement',
  },
  {
    pattern: /\b(spam (his|her|their) inbox|mass report this account|hound (them|him|her)|make their life hell)\b/i,
    weight: 0.85,
    reason: 'coordinated brigade and harassment campaign',
  },
  {
    pattern: /\b(stalk\w* (them|her|him)|follow (them|her|him) home|we know where you sleep)\b/i,
    weight: 0.90,
    reason: 'stalking and targeted intimidation threat',
  },
];
