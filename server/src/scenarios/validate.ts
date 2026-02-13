import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { z } from 'zod';

/* ============================================================
   YAML Schema Validator — CI-blocking
   Validates all scenario templates and role overlays
   ============================================================ */

// ---- Zod Schemas ----

const ConditionSchema = z.object({
    variable: z.string(),
    operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte', 'in_range']),
    threshold: z.union([z.number(), z.tuple([z.number(), z.number()])]),
});

const ActionSchema = z.object({
    actionId: z.string(),
    label: z.string(),
    description: z.string().optional(),
    visibleIf: z.array(ConditionSchema).optional(),
    locksOut: z.array(z.string()).optional(),
});

const StateDeltaSchema = z.object({
    variable: z.string(),
    delta: z.number(),
});

const EmotionalShiftSchema = z.object({
    to: z.enum(['calm', 'anxious', 'confident', 'deflated', 'numb']),
    ifCurrentIn: z.array(z.string()).optional(),
});

const EventDefSchema = z.object({
    eventType: z.enum(['interruption', 'opportunity', 'consequence', 'expiry']),
    delayTicks: z.number().int().nonnegative(),
    payload: z.record(z.unknown()),
});

const ConsequenceRuleSchema = z.object({
    actionId: z.string(),
    stateDeltas: z.array(StateDeltaSchema),
    emotionalShift: EmotionalShiftSchema.optional(),
    spawnedEvents: z.array(EventDefSchema).optional(),
    immediateFeedback: z.string(),
});

const FeedbackVariantSchema = z.object({
    key: z.string(),
    emotionalState: z.string(),
    narrativeText: z.string(),
    audioCue: z.string().optional(),
});

const ScenarioTemplateSchema = z.object({
    scenarioId: z.string(),
    contentVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    chapter: z.number().int().nonnegative(),
    title: z.string(),
    entryConditions: z.array(ConditionSchema).optional(),
    actions: z.array(ActionSchema).min(1),
    consequenceRules: z.array(ConsequenceRuleSchema).min(1),
    feedbackVariants: z.array(FeedbackVariantSchema).min(1),
    timeConstraint: z.number().optional(),
});

const RoleOverlaySchema = z.object({
    scenarioId: z.string(),
    contentVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    role: z.enum(['analyst', 'data_engineer', 'data_scientist', 'ai_ml']),
    overrides: z.object({
        actions: z.array(ActionSchema).optional(),
        consequenceRules: z.array(ConsequenceRuleSchema).optional(),
        narrativeSwaps: z.record(z.string()).optional(),
    }),
});

// ---- Validation ----

interface ValidationResult {
    file: string;
    docIndex: number;
    type: 'template' | 'overlay';
    valid: boolean;
    errors: string[];
}

function validate(): void {
    const scenariosDir = path.resolve(process.cwd(), 'content', 'scenarios');
    if (!fs.existsSync(scenariosDir)) {
        console.error(`ERROR: Scenarios directory not found: ${scenariosDir}`);
        process.exit(1);
    }

    const files = fs.readdirSync(scenariosDir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
    const results: ValidationResult[] = [];
    let hasErrors = false;

    for (const file of files) {
        const raw = fs.readFileSync(path.join(scenariosDir, file), 'utf-8');
        const docs = yaml.loadAll(raw) as Record<string, unknown>[];

        docs.forEach((doc, idx) => {
            if (!doc) return;

            const isOverlay = 'overrides' in doc;
            const schema = isOverlay ? RoleOverlaySchema : ScenarioTemplateSchema;
            const result = schema.safeParse(doc);

            const vr: ValidationResult = {
                file,
                docIndex: idx,
                type: isOverlay ? 'overlay' : 'template',
                valid: result.success,
                errors: [],
            };

            if (!result.success) {
                hasErrors = true;
                vr.errors = result.error.errors.map(
                    (e) => `  ${e.path.join('.')}: ${e.message}`,
                );
            }

            // Cross-validation: every consequenceRule.actionId must match an action
            if (result.success && !isOverlay) {
                const tmpl = doc as unknown as { actions: { actionId: string }[]; consequenceRules: { actionId: string }[] };
                const actionIds = new Set(tmpl.actions.map((a) => a.actionId));
                for (const cr of tmpl.consequenceRules) {
                    if (!actionIds.has(cr.actionId)) {
                        vr.valid = false;
                        vr.errors.push(`  consequenceRules: actionId "${cr.actionId}" has no matching action`);
                        hasErrors = true;
                    }
                }
            }

            results.push(vr);
        });
    }

    // Report
    console.log('\n=== Scenario Validation Report ===\n');
    for (const r of results) {
        const icon = r.valid ? '✓' : '✗';
        console.log(`${icon} ${r.file} [doc ${r.docIndex}] (${r.type})`);
        for (const e of r.errors) {
            console.log(e);
        }
    }

    const total = results.length;
    const passed = results.filter((r) => r.valid).length;
    console.log(`\n${passed}/${total} documents passed validation\n`);

    if (hasErrors) {
        console.error('VALIDATION FAILED — fix errors above before merging');
        process.exit(1);
    }

    console.log('All scenarios valid ✓');
}

validate();
