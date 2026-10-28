import type { IncomeAssessment, IncomeDimension, IncomeEvidenceSource, IncomeOpportunityEvidence, MoneyPathAssessment } from '../types/incomeEvidence';
import { MONEY_PATH_STEPS } from '../types/incomeEvidence';
import { INCOME_DIMENSIONS } from '../mock/incomeEvidence';

export const INCOME_REVIEWED_AT = '2026-10-20T01:52:44Z';
export const INCOME_SNAPSHOT_NOTICE =
  'Static research snapshot · source facts, analyst hypotheses and missing evidence are separate. No billing or revenue backend is connected.';

// Only already-public records are included. Private source review and customer
// records must never be copied into this public repository or client bundle.
export const INCOME_EVIDENCE_SOURCES: IncomeEvidenceSource[] = [
  {
    id: 'wave1', title: 'Original Wave 1 portfolio report',
    url: 'https://github.com/nymrel/nymrel-swarm-studio/issues/21', mode: 'historical-report',
    retrievedAt: INCOME_REVIEWED_AT, effectiveAt: null, reviewAfter: '2026-10-18T00:00:00Z',
    revision: 'Issue body updated 2026-10-19T15:51:32Z; individual portfolio states undated',
    limitation: 'Historical self-report. Re-reading the issue does not reverify deployment, revenue, blockers or customer use.',
  },
  {
    id: 'services', title: 'Published service menu', url: 'https://nymrel.com/services', mode: 'public-document',
    retrievedAt: INCOME_REVIEWED_AT, effectiveAt: null, reviewAfter: '2026-10-27T01:52:44Z',
    revision: 'Retrieved page; search retrieval reported a two-day-old crawl',
    limitation: 'Documents advertised scope and a brief route. No buyer, capacity, paid order or outcome was observed.',
  },
  {
    id: 'shop', title: 'Published shop and monitoring offers', url: 'https://nymrel.com/shop', mode: 'public-document',
    retrievedAt: INCOME_REVIEWED_AT, effectiveAt: null, reviewAfter: '2026-10-27T01:52:44Z',
    revision: 'Retrieved page; search retrieval reported a three-day-old crawl',
    limitation: 'Offer text and purchase links only. Checkout mode, completed payment, entitlements and fulfillment were not tested.',
  },
  {
    id: 'audit', title: 'Published Agent-Ready audit process', url: 'https://nymrel.com/agent-ready', mode: 'public-document',
    retrievedAt: INCOME_REVIEWED_AT, effectiveAt: null, reviewAfter: '2026-10-27T01:52:44Z',
    revision: 'Retrieved page; search retrieval reported a three-day-old crawl',
    limitation: 'A published manual delivery promise, not proof of a scanner worker, completed report or paying customer.',
  },
  {
    id: 'terms', title: 'Published service fulfillment and cancellation terms', url: 'https://nymrel.com/terms', mode: 'public-document',
    retrievedAt: INCOME_REVIEWED_AT, effectiveAt: '2026-10-08T00:00:00Z', reviewAfter: '2026-10-27T01:52:44Z',
    revision: 'Page states updated October 8, 2026; retrieved crawl three days old',
    limitation: 'Terms document obligations. They do not prove payment processing, cancellation behavior or successful delivery.',
  },
  {
    id: 'record', title: 'Dated public proof directory', url: 'https://nymrel.com/record', mode: 'public-document',
    retrievedAt: INCOME_REVIEWED_AT, effectiveAt: '2026-10-07T00:00:00Z', reviewAfter: '2026-10-14T00:00:00Z',
    revision: 'Directory dated October 7, 2026; retrieved crawl reported last week',
    limitation: 'Directory reports URL/host/title checks only. It expressly does not establish ownership, maturity, availability or outcomes.',
  },
  {
    id: 'dad', title: 'DraftADynasty public homepage', url: 'https://draftadynasty.com/', mode: 'public-document',
    retrievedAt: INCOME_REVIEWED_AT, effectiveAt: null, reviewAfter: '2026-10-27T01:52:44Z',
    revision: 'Retrieved page; search retrieval reported a same-day crawl',
    limitation: 'Public navigation and content surface only. No league import, forecast freshness, premium entitlement or native purchase was tested.',
  },
  {
    id: 'lead-queue', title: 'Existing marketplace qualification queue',
    url: 'https://github.com/nymrel/nymrel-swarm-studio/issues/19', mode: 'historical-report',
    retrievedAt: INCOME_REVIEWED_AT, effectiveAt: '2026-09-25T07:19:32Z', reviewAfter: '2026-09-26T07:19:32Z',
    revision: 'Issue updated September 25, 2026',
    limitation: 'Old listing summaries. Availability, buyer identity, budget, studio eligibility and acquisition costs must be rechecked.',
  },
  {
    id: 'checkout-history', title: 'October 6 historical checkout reconciliation',
    url: 'https://github.com/nymrel/nymrel-swarm-studio/issues/21#issuecomment-6031763999', mode: 'historical-report',
    retrievedAt: INCOME_REVIEWED_AT, effectiveAt: '2026-10-06T00:00:00Z', reviewAfter: '2026-10-07T00:00:00Z',
    revision: 'Public comment 6031763999; provider-read report dated October 6',
    limitation: 'Historical report of a narrow set of Payment Links, not a new provider read or a complete account-wide revenue ledger.',
  },
  {
    id: 'monitor-pilot', title: 'Existing Website Change Monitor validation plan',
    url: 'https://github.com/nymrel/nymrel-swarm-studio/issues/21#issuecomment-6030486183', mode: 'historical-report',
    retrievedAt: INCOME_REVIEWED_AT, effectiveAt: null, reviewAfter: '2026-10-18T00:00:00Z',
    revision: 'Public comment 6030486183; explicitly proposed and not launched',
    limitation: 'Hypothesis and acceptance threshold only; it explicitly leaves demand, costs, margin and renewals unmeasured.',
  },
];

const missingReasons: Record<IncomeDimension, string> = {
  demand: 'No current attributed buyer interview, qualified inquiry or paid conversion is established in this snapshot.',
  timeToFirstDollar: 'No measured delivery capacity, acquisition cycle or timed path to a paid order.',
  recurring: 'Renewal behavior and a commercially usable recurring offer have not been established.',
  reuse: 'Reusable code and its production acceptance have not been independently measured here.',
  distribution: 'An available channel is not measured qualified reach or customer acquisition.',
  margin: 'No reconciled price, delivery labor, provider fees, support cost or refund cohort.',
  fulfillment: 'No timed delivery, support workload or recovery rehearsal has been established.',
  proof: 'No independent current runtime or customer acceptance receipt is included.',
};

function assessments(overrides: Partial<Record<IncomeDimension, IncomeAssessment>> = {}) {
  return Object.fromEntries(INCOME_DIMENSIONS.map(({ key }) => [key, overrides[key] ?? {
    value: null, basis: 'unknown', confidence: 'unknown', explanation: missingReasons[key], sourceIds: [],
  }])) as IncomeOpportunityEvidence['scores'];
}

function estimate(value: number, explanation: string, ...sourceIds: string[]): IncomeAssessment {
  return { value, explanation, sourceIds, basis: 'analyst-estimate', confidence: 'low' };
}

function moneyPath(documented: Partial<Record<typeof MONEY_PATH_STEPS[number], string[]>> = {}) {
  return Object.fromEntries(MONEY_PATH_STEPS.map(step => [step, {
    state: documented[step] ? 'documented' : 'unknown', sourceIds: documented[step] ?? [],
    explanation: documented[step] ? 'Described by the cited public document; functional behavior unverified.' : 'No current functional receipt included.',
  }])) as Record<typeof MONEY_PATH_STEPS[number], MoneyPathAssessment>;
}

function historical(
  id: string, asset: string, incomeLanes: string[], report: string, blocker: string,
  nextAction: string, recurringHypothesis: string,
): IncomeOpportunityEvidence {
  return {
    id, asset, incomeLanes, lane: 'Evidence collection', confidence: 'low',
    buyerHypothesis: 'Proposed buyer and willingness to pay need current validation.',
    claims: [{ text: `Historical Wave 1 report: ${report}`, kind: 'documented-fact', sourceIds: ['wave1'] }],
    blocker: `Recheck the reported blocker: ${blocker}`, nextAction, recurringHypothesis,
    paidProof: 'An attributed paid order plus its accepted deliverable and reconciled recovery state; renewal proof is separate.',
    scores: assessments(), moneyPath: moneyPath(), priority: null,
  };
}

export const INCOME_OPPORTUNITIES: IncomeOpportunityEvidence[] = [
  {
    ...historical('services', 'Nymrel Studio / services', ['AI/MCP implementation', 'automation rescue', 'web/mobile delivery'],
      'marketplace positioning and fixed-scope offers were prepared.', 'acquisition and offer qualification.',
      'Requalify one current lead in #19; agree a bounded outcome, exclusions, capacity, acceptance and payment path before proposing delivery.',
      'A successfully delivered sprint could lead to a separately scoped maintenance retainer.'),
    lane: 'Near-term validation', buyerHypothesis: 'A business with a stalled integration or repetitive workflow and authority to buy a bounded repair.',
    claims: [
      { text: 'The service menu advertises custom implementation and a brief-based scoping route.', kind: 'documented-fact', sourceIds: ['services'] },
      { text: 'The existing lead queue contains old listings; none is treated as a currently qualified buyer.', kind: 'documented-fact', sourceIds: ['lead-queue'] },
    ],
    blocker: 'Current qualified lead, capacity and written delivery scope are unverified.',
    scores: assessments({
      reuse: estimate(4, 'Existing service positioning and portfolio proof may shorten preparation; code reuse is unmeasured.', 'services', 'record'),
      proof: estimate(2, 'Published service scope and dated proof directory; no customer acceptance receipt.', 'services', 'record'),
    }),
    moneyPath: moneyPath({ discovery: ['services'], intake: ['services'] }),
    priority: { order: 1, reason: 'A scoped service can use existing capabilities without waiting for another SaaS platform; current buyer and capacity still need proof.' },
  },
  {
    ...historical('website-intelligence', 'Nymrel Website Intelligence', ['website diagnostic', 'bounded fixes', 'monitoring'],
      'catalog and purchase links existed.', 'payment-to-delivery proof.',
      'Rehearse one existing diagnostic SKU through test payment, signed event, saved order, intake, report delivery and refund/cancel recovery; measure labor before a paid pilot.',
      'Offer monitoring only after baseline delivery, capacity and renewal/cancel behavior are evidenced.'),
    lane: 'Near-term validation', buyerHypothesis: 'A site operator who needs an evidence-based repair order and can authorize the work.',
    claims: [
      { text: 'The shop advertises a $499 diagnostic and $99/$199/$399 monthly monitoring tiers.', kind: 'documented-fact', sourceIds: ['shop'] },
      { text: 'The separate $500 Agent-Ready audit describes human confirmation and an emailed report; it is not an automatic worker receipt.', kind: 'documented-fact', sourceIds: ['audit'] },
      { text: 'The service terms document delivery, refunds and subscription cancellation obligations.', kind: 'documented-fact', sourceIds: ['terms'] },
      { text: 'An October 6 public provider-read report found five expired, unpaid sessions across the three monitoring links. Buyer attribution and current payment state remain unknown.', kind: 'documented-fact', sourceIds: ['checkout-history'] },
    ],
    blocker: 'A published purchase route does not establish signed-event persistence, fulfillment or a paying customer. Keep the $499 diagnostic and $500 audit identities distinct.',
    scores: assessments({
      recurring: estimate(4, 'Monthly offers are documented; renewal quality and actual retention are unknown.', 'shop', 'terms'),
      reuse: estimate(4, 'Existing diagnostic and monitoring offers can be tested without another SKU.', 'shop', 'monitor-pilot'),
      proof: estimate(2, 'Offer and delivery promises are documented; no complete paid-delivery receipt.', 'audit', 'terms'),
    }),
    moneyPath: moneyPath({ discovery: ['shop'], pricing: ['shop'], checkout: ['shop'], intake: ['shop'], fulfillment: ['audit'], delivery: ['terms'], recovery: ['terms'] }),
    priority: { order: 2, reason: 'An existing diagnostic plus monitoring follow-on offers a bounded first-sale test and a recurring path; fulfillment remains the gate.' },
  },
  {
    ...historical('mcp-remote', 'Nymrel MCP Hub / Remote', ['hosted developer gateway', 'team plan', 'support'],
      'infrastructure existed and activation was evolving.', 'external activation and support packaging.',
      'Obtain fresh deployment and OAuth/permission receipts; test one external developer workflow and define metering, support and revocation boundaries.',
      'Hosted team/usage subscriptions are a hypothesis until activation, costs and paying developer demand are measured.'),
    lane: 'Recurring foundation',
  },
  {
    ...historical('publisher', 'Nymrel Publisher', ['publication history', 'content operations', 'read API'],
      'history infrastructure was provisioned, with runtime activation still outstanding.', 'deployment, health, observation continuity and separate delivery authorization.',
      'Recover the current deployed revision and persistent read-history canary before considering a limited read/operations pilot.',
      'Read-side history and operations could support a retainer; live publishing requires its existing separate gates.'),
    lane: 'Recurring foundation',
  },
  {
    ...historical('crawler-mesh', 'Crawler Mesh', ['hosted extraction API', 'MCP service', 'developer support'],
      'replacement code existed with release and consumer cutover pending.', 'canonical release, adoption and hosted canary.',
      'Locate the canonical package and current release receipt; verify a real consumer, authentication, rate limits, rights and unit costs before a metered pilot.',
      'Usage billing may scale; internal vendor-cost avoidance is not external revenue.'),
    lane: 'Recurring foundation',
  },
  {
    ...historical('draftadynasty', 'DraftADynasty', ['web premium', 'native subscriptions', 'research'],
      'web premium existed while native purchase activation needed provider proof.', 'current entitlement, data and provider acceptance.',
      'Choose one existing web tier; verify data freshness, checkout, entitlement, delivery and cancellation before a paid pilot. Keep native purchases in their provider lane.',
      'Premium renewals need recurring value, current forecasts and reconciled entitlements; store approval alone is insufficient.'),
    lane: 'Near-term validation', buyerHypothesis: 'A fantasy player who values current decision support enough to buy premium access.',
    claims: [{ text: 'The public homepage exposes football/fantasy navigation; premium access and current forecast quality were not exercised.', kind: 'documented-fact', sourceIds: ['dad'] }],
    blocker: 'Public content proves a discovery surface, not premium conversion, entitlement reliability or current data acceptance.',
    scores: assessments({ proof: estimate(2, 'A public product surface is retrievable, without paid-flow or data-quality acceptance.', 'dad') }),
    moneyPath: moneyPath({ discovery: ['dad'] }),
    priority: { order: 5, reason: 'Existing public distribution makes a narrowly verified web-tier test plausible; customer willingness and data quality remain open.' },
  },
  {
    ...historical('goviral', 'GoViral', ['creator software', 'assisted clip delivery', 'operator plan'],
      'a product was deployed; attribution and acquisition needed work.', 'external activation, attribution and demand.',
      'Verify one uploaded-video-to-accepted-clip workflow, rights, provider costs, paid entitlement and cancellation; qualify a buyer before adding an operator tier.',
      'Repeat content workflows could renew, but published pricing is not active subscription evidence.'),
    lane: 'Near-term validation', buyerHypothesis: 'A creator with reusable long-form footage and a recurring need for approved clips.',
    claims: [{ text: 'The shop lists a $19/month GoViral plan and an operator waitlist. The product host was not accessible to the retrieval tool.', kind: 'documented-fact', sourceIds: ['shop'] }],
    blocker: 'End-to-end activation, rendering costs and a paying creator are unverified; a failed retrieval does not prove the host is down.',
    scores: assessments({ recurring: estimate(3, 'Monthly pricing is advertised; successful renewal and usage are unknown.', 'shop') }),
    moneyPath: moneyPath({ discovery: ['shop'], pricing: ['shop'] }),
    priority: { order: 4, reason: 'An existing subscription offer and service-assisted wedge allow one bounded workflow test; costs and entitlement must be measured.' },
  },
  {
    ...historical('digital-products', 'InfoFactory / digital products', ['finished kits', 'workbooks', 'focused bundles'],
      'a broad catalog existed with webhook/account questions.', 'current product-to-delivery binding.',
      'Pick one existing kit matching a qualified buyer problem; rehearse its checkout, signed event, download/email access and recovery without creating another product.',
      'Repeat purchases or updates may follow; one-time kit sales must not be counted as MRR.'),
    lane: 'Near-term validation', buyerHypothesis: 'A business operator with a concrete implementation task that a finished kit can solve.',
    claims: [{ text: 'The shop presents multiple downloadable kits with prices and product-site purchase routes.', kind: 'documented-fact', sourceIds: ['shop'] }],
    blocker: 'The published catalog does not prove paid download delivery, account/webhook reconciliation or buyer demand.',
    scores: assessments({ reuse: estimate(4, 'Existing finished-kit offers reduce catalog preparation; the actual delivered contents still need acceptance.', 'shop'), proof: estimate(2, 'Published product listings, without verified purchase or delivery.', 'shop') }),
    moneyPath: moneyPath({ discovery: ['shop'], pricing: ['shop'], checkout: ['shop'] }),
    priority: { order: 3, reason: 'A single existing kit has bounded fulfillment to verify; focus on one buyer problem rather than expanding the catalog.' },
  },
  {
    ...historical('golf', 'MyCaddie / GolfFlow', ['golf planning', 'premium tools', 'subscription'],
      'deployment and paid catalog objects were reported.', 'entitlement/reactivation and canonical tier consolidation.',
      'Recheck the canonical golf tier, real round-planning experience and entitlement lifecycle; do not merge audiences or subscription counts across products.',
      'A recurring golf tier requires a recurring job and demonstrated entitlement reliability.'),
    claims: [{ text: 'The dated proof directory lists MyCaddie and GolfFlow as public products; those URL checks are historical.', kind: 'documented-fact', sourceIds: ['record'] }],
  },
  {
    ...historical('18holes', '18HolesToHome', ['relocation lead funnel', 'concierge'],
      'application records included tests and outreach was held.', 'persistence, lead qualification and outbound prerequisites.',
      'Recover fresh persistence proof; separate synthetic records from consented qualified prospects and verify the postal/outbound requirements before outreach.',
      'Concierge or lead-service fees remain hypothetical; applications are not buyers.'),
    claims: [{ text: 'The dated directory includes a golf-property lead site; it provides no conversion measurement.', kind: 'documented-fact', sourceIds: ['record'] }],
  },
  historical('fitness', 'FirstOneFitness', ['adaptive coaching', 'programs', 'mobile subscription'],
    'web deployment and product-quality work were reported.', 'release acceptance and a usable paid coaching scope.',
    'Verify the returning-user workout journey, delivery capacity and one paid coaching scope before evaluating subscriptions.',
    'Coaching could recur when the workout experience and human support burden are evidenced.'),
  {
    ...historical('swingers', 'SwingersClub', ['commerce', 'membership', 'engineering care'],
      'a service relationship was reported, alongside database and webhook concerns.', 'current reliability and payment reconciliation.',
      'Privately reconcile the service relationship and storefront payments, then verify database, webhook and order delivery health before expanding commerce.',
      'Protect a genuine service renewal separately from storefront membership or merchandise revenue.'),
    claims: [{ text: 'The dated directory lists an apparel storefront. The original registry separately reports a service relationship; no current amount or MRR is established here.', kind: 'documented-fact', sourceIds: ['record', 'wave1'] }],
  },
  historical('roblox', 'Roblox portfolio', ['game products', 'passes', 'creator assets'],
    'paid-product and fulfillment code was prepared.', 'fresh payment-integrity execution and fulfilled-offer acceptance.',
    'Find the current payment-integrity receipt and test idempotent fulfillment/recovery for one intended product before release.',
    'Pass or subscription economics need actual platform receipts and ongoing value.'),
  historical('builderwars', 'BuilderWars', ['sponsored events', 'paid evaluations', 'B2B benchmarks'],
    'active product work existed without established external paid proof.', 'complete exhibition, audience and reusable evaluation acceptance.',
    'Verify one reproducible public evaluation and ask a qualified B2B buyer to assess its usefulness before offering paid evaluations.',
    'Recurring evaluation contracts are a hypothesis, not a consequence of repository activity.'),
  historical('apparatus', 'Apparatus', ['B2B implementation', 'platform support'],
    'a deployed substrate and pending hardening were reported.', 'current runtime acceptance and a bounded commercial capability.',
    'Recheck runtime hardening and select one externally useful capability with a defined support boundary.',
    'Licensing or support can recur only after external capability and rights are proven.'),
  {
    ...historical('jalentrades', 'JalenTrades', ['education', 'research membership', 'cohort'],
      'paid catalog objects were reported.', 'current acquisition-to-access evidence.',
      'Verify one canonical offer through checkout, access, promised educational delivery and cancellation; keep trading performance distinct from product sales.',
      'Membership retention is unmeasured; trading returns are not subscription revenue.'),
    claims: [{ text: 'The dated directory lists a trading-education product; this is historical URL evidence, not paid membership proof.', kind: 'documented-fact', sourceIds: ['record'] }],
  },
];
