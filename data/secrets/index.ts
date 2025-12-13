
import { COMBAT_SECRETS } from './combat';
import { WORLD_SECRETS } from './world';
import { INTERACTION_SECRETS } from './interaction';
import { Secret } from '../../types';

export const ALL_SECRETS: Secret[] = [
    ...COMBAT_SECRETS,
    ...WORLD_SECRETS,
    ...INTERACTION_SECRETS
];
