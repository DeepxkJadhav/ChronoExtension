/**
 * CHRONO ADAPTER SDK: CAPABILITY MATRIX
 * 
 * Declares what dimensions and granularities of state a host application can expose.
 * Designed for graceful degradation: if an adapter cannot stream fine AST deltas,
 * CHRONO falls back cleanly to snapshot or coarse event recording without failing.
 */

export const AdapterTier = {
  TIER_0_BLACKBOX: 0,
  TIER_1_OBSERVER: 1,
  TIER_2_DELTA_RESTORE: 2,
  TIER_3_INTERACTIVE: 3,
} as const;

export type AdapterTier = typeof AdapterTier[keyof typeof AdapterTier];

export type StateDomain =
  | "text.buffer"
  | "workspace.files"
  | "terminal.pty"
  | "editor.selection"
  | "environment.variables"
  | "dom.tree"
  | "process.table"
  | "custom";

export interface DomainCapability {
  /** Can the adapter produce a full snapshot of this domain? */
  canSnapshot: boolean;

  /** Can the adapter restore/rehydrate the host to a target snapshot in this domain? */
  canRestore: boolean;

  /** Can the adapter emit real-time semantic deltas for this domain? */
  canStreamDeltas: boolean;

  /** Can the adapter generate inverse deltas for instant reverse playhead scrub? */
  canInvertDelta: boolean;

  /** Maximum recommended snapshot payload size in bytes */
  maxPayloadBytes?: number;

  /** Maximum event emission frequency (events per second) before client throttling */
  throttleFrequencyHz?: number;
}

export interface AdapterCapabilityProfile {
  /** High-level tier classification */
  tier: AdapterTier;

  /** Human-readable adapter title */
  name: string;

  /** Unique adapter identifier namespace (e.g., "chrono.adapter.vscode") */
  adapterId: string;

  /** Adapter version (SemVer) */
  version: string;

  /** Per-domain fine-grained capabilities */
  domains: Record<StateDomain, DomainCapability>;

  /** Whether the adapter provides built-in secret redaction */
  hasSecretSanitizer: boolean;
}

/**
 * Helper to construct a standard capability profile with safe defaults
 */
export function createCapabilityProfile(
  adapterId: string,
  name: string,
  version: string,
  tier: AdapterTier,
  customDomains: Partial<Record<StateDomain, Partial<DomainCapability>>> = {}
): AdapterCapabilityProfile {
  const defaultDomainCap: DomainCapability = {
    canSnapshot: tier >= AdapterTier.TIER_0_BLACKBOX,
    canRestore: tier >= AdapterTier.TIER_2_DELTA_RESTORE,
    canStreamDeltas: tier >= AdapterTier.TIER_2_DELTA_RESTORE,
    canInvertDelta: false,
    throttleFrequencyHz: 60,
  };

  const domains: Record<StateDomain, DomainCapability> = {
    "text.buffer": { ...defaultDomainCap, ...customDomains["text.buffer"] },
    "workspace.files": { ...defaultDomainCap, ...customDomains["workspace.files"] },
    "terminal.pty": { ...defaultDomainCap, ...customDomains["terminal.pty"] },
    "editor.selection": { ...defaultDomainCap, ...customDomains["editor.selection"] },
    "environment.variables": { ...defaultDomainCap, ...customDomains["environment.variables"] },
    "dom.tree": { ...defaultDomainCap, ...customDomains["dom.tree"] },
    "process.table": { ...defaultDomainCap, ...customDomains["process.table"] },
    "custom": { ...defaultDomainCap, ...customDomains["custom"] },
  };

  return {
    tier,
    name,
    adapterId,
    version,
    domains,
    hasSecretSanitizer: true,
  };
}

/**
 * Negotiates effective capabilities between client adapter and CHRONO daemon.
 */
export function negotiateCapabilities(
  adapterProfile: AdapterCapabilityProfile,
  daemonMaxSupportedTier: AdapterTier
): AdapterCapabilityProfile {
  const effectiveTier = Math.min(adapterProfile.tier, daemonMaxSupportedTier) as AdapterTier;
  return {
    ...adapterProfile,
    tier: effectiveTier,
  };
}

/**
 * Checks whether an adapter can perform a checkout/restore operation on a given domain.
 */
export function canRestoreDomain(
  profile: AdapterCapabilityProfile,
  domain: StateDomain
): boolean {
  if (profile.tier < AdapterTier.TIER_2_DELTA_RESTORE) {
    return false;
  }
  return profile.domains[domain]?.canRestore === true;
}
