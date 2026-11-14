import { CuePrompt, EffectiveCue } from '../types';
import { SALES_CUES_FRAMEWORK } from '../data/mockData';

export const CUE_CATEGORIES = [
  'Discovery',
  'Communication',
  'Technical Evaluation',
  'Solution & Value',
  'Commercial',
  'Closing & Follow-up',
  'Custom'
];

const CATEGORY_BY_CUE: Record<number, string> = {
  1: 'Communication',
  2: 'Discovery',
  3: 'Discovery',
  4: 'Communication',
  5: 'Technical Evaluation',
  6: 'Solution & Value',
  7: 'Solution & Value',
  8: 'Commercial',
  9: 'Commercial',
  10: 'Communication',
  11: 'Closing & Follow-up',
  12: 'Closing & Follow-up'
};

/** The 12 sales cues SellMore ships as platform defaults. The super admin can add, edit and delete them. */
export const createDefaultPlatformCues = (): CuePrompt[] =>
  SALES_CUES_FRAMEWORK.map(cue => ({
    id: `platform-${cue.id}`,
    cueName: cue.name,
    category: CATEGORY_BY_CUE[cue.id] || 'Custom',
    description: cue.evaluationFocus,
    instructions: cue.evaluationFocus,
    enabled: true,
    updatedAt: '2026-11-01T00:00:00.000Z'
  }));

/**
 * The cues one business actually uses:
 *   - every platform default, unless the business replaced it with its own version
 *   - plus the business's custom cues
 * A company version whose platform default was later deleted is kept as a custom cue.
 */
export const getEffectiveCues = (platformCues: CuePrompt[], companyCues: CuePrompt[]): EffectiveCue[] => {
  const platformIds = new Set(platformCues.map(c => c.id));
  const overrides = new Map(
    companyCues.filter(c => c.overridesId && platformIds.has(c.overridesId)).map(c => [c.overridesId as string, c])
  );

  const fromPlatform: EffectiveCue[] = platformCues.map(platform => {
    const override = overrides.get(platform.id);
    return override
      ? { ...override, origin: 'customised', platformId: platform.id }
      : { ...platform, origin: 'default', platformId: platform.id };
  });

  const custom: EffectiveCue[] = companyCues
    .filter(c => !c.overridesId || !platformIds.has(c.overridesId))
    .map(c => ({ ...c, overridesId: undefined, origin: 'custom' as const }));

  return [...fromPlatform, ...custom];
};
