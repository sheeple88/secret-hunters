
import { COMBAT_SECRETS } from './combat';
import { WORLD_SECRETS } from './world';
import { INTERACTION_SECRETS } from './interaction';
import { TOWN_SECRETS } from '../town/townSecrets';
import { generateProceduralSecrets } from '../../systems/secrets/secretGenerator';
import { Secret } from '../../types';

// Generate secrets once on load
const PROCEDURAL_SECRETS = generateProceduralSecrets();

export const ALL_SECRETS: Secret[] = [
    ...COMBAT_SECRETS,
    ...WORLD_SECRETS,
    ...INTERACTION_SECRETS,
    ...TOWN_SECRETS,
    ...PROCEDURAL_SECRETS
];
