const fs = require('fs');

try {
    const raw = fs.readFileSync('./job_hunt_scenarios.json', 'utf8');
    const scenarios = JSON.parse(raw);

    console.log(`Loaded ${scenarios.length} scenarios.`);

    const ids = new Set();
    const stageCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, other: 0 };
    let errors = 0;

    scenarios.forEach(s => {
        // ID Check
        if (ids.has(s.id)) {
            console.error(`ERROR: Duplicate ID found -> ${s.id}`);
            errors++;
        }
        ids.add(s.id);

        // Phase Check
        if (s.phase !== "hunt") {
            console.error(`ERROR: Invalid phase for ${s.id} -> ${s.phase}`);
            errors++;
        }

        // Choice Check
        if (!s.choices || s.choices.length === 0) {
            console.error(`ERROR: No choices for ${s.id}`);
            errors++;
        } else {
            s.choices.forEach(c => {
                if (c.energyCost === undefined && c.fx?.energy === undefined) console.warn(`WARN: Choice ${c.id} in ${s.id} has no energy cost.`);
                if (c.huntProgress === undefined) console.warn(`WARN: Choice ${c.id} in ${s.id} has no huntProgress info.`);
                if (c.time === undefined && c.timeCost === undefined) console.warn(`WARN: Choice ${c.id} in ${s.id} has no time cost.`);
            });
        }

        // Stage Bucketing
        let min = s.gates?.stageMin ?? 0;
        let max = s.gates?.stageMax ?? 0;

        // Count approximate buckets (just for report)
        if (max === 0) stageCounts[0]++;
        else if (min === 1 && max === 1) stageCounts[1]++;
        else if (min === 2 && max === 2) stageCounts[2]++;
        else if (min === 3 && max === 3) stageCounts[3]++;
        else if (min === 4 && max === 4) stageCounts[4]++;
        else stageCounts.other++;
    });

    console.log("\n--- Validation Report ---");
    console.log(`Total Errors: ${errors}`);
    console.log("Scenario Counts by Target Stage:");
    console.log(JSON.stringify(stageCounts, null, 2));

    console.log("\n--- Samples ---");
    const samples = [
        scenarios.find(s => s.gates?.stageMax === 0),
        scenarios.find(s => s.gates?.stageMin === 1),
        scenarios.find(s => s.gates?.stageMin === 2),
        scenarios.find(s => s.gates?.stageMin === 3),
        scenarios.find(s => s.gates?.stageMin === 4)
    ];

    samples.forEach(samp => {
        if (samp) console.log(`[Stage ${samp.gates?.stageMin ?? 0}-${samp.gates?.stageMax ?? 0}] ${samp.id} ("${samp.title}")`);
    });

    if (errors === 0) console.log("\nSUCCESS: Validation Passed.");
    else console.log("\nFAILURE: Validation Failed.");

} catch (e) {
    console.error("Script failed:", e);
}
