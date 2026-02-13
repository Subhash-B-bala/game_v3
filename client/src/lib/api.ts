const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function createSession(playerId?: string) {
    const res = await fetch(`${API_URL}/api/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
    });
    if (!res.ok) throw new Error("Failed to create session");
    return res.json();
}

export async function loadSession(sessionId: string) {
    const res = await fetch(`${API_URL}/api/session/${sessionId}`);
    if (!res.ok) throw new Error("Failed to load session");
    return res.json();
}

export async function submitAction(
    sessionId: string,
    scenarioId: string,
    actionId: string,
) {
    const res = await fetch(`${API_URL}/api/session/${sessionId}/action`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, actionId }),
    });
    if (!res.ok) throw new Error("Failed to submit action");
    return res.json();
}

export async function pollEvents(sessionId: string) {
    const res = await fetch(`${API_URL}/api/session/${sessionId}/events`);
    if (!res.ok) throw new Error("Failed to poll events");
    return res.json();
}

export async function getMirror(sessionId: string) {
    const res = await fetch(`${API_URL}/api/session/${sessionId}/mirror`);
    if (!res.ok) throw new Error("Failed to get mirror");
    return res.json();
}

export async function getScenario(scenarioId: string, role?: string) {
    const query = role ? `?role=${encodeURIComponent(role)}` : "";
    const res = await fetch(`${API_URL}/api/scenario/${scenarioId}${query}`);
    if (!res.ok) throw new Error("Failed to load scenario");
    return res.json();
}
