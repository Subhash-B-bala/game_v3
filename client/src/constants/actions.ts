export const SCENE_ACTIONS: Record<string, any[]> = {
    // New Chapter 1 Setup Actions
    // New Chapter 1 Setup Actions
    ch1_setup_background: [
        {
            description: "Select your educational and professional history.",
            id: "bg_fresher", label: "FRESH GRADUATE", desc: "CS Degree. High energy, strong theory."
        },
        { id: "bg_switcher", label: "CAREER SWITCHER", desc: "High soft skills, transferable exp." },
        { id: "bg_bootcamp", label: "BOOTCAMP GRAD", desc: "Practical skills, high urgency." },
        { id: "bg_senior", label: "SENIOR PIVOT", desc: "High reputation, high expectations." },
    ],
    ch1_setup_financial: [
        {
            description: "Define your current financial pressure and runway.",
            id: "fin_comfortable", label: "COMFORTABLE", desc: "High savings. Low pressure."
        },
        { id: "fin_middle", label: "MIDDLE CLASS", desc: "Standard runway. Moderate pressure." },
        { id: "fin_dependent", label: "SELF-DEPENDENT", desc: "Paycheck to paycheck. High Grind." },
    ],
    ch1_setup_role: [
        {
            description: "Select your primary technical specialization.",
            id: "role_analyst", label: "DATA ANALYTICS", desc: "Insights & Strategy."
        },
        { id: "role_engineer", label: "DATA ENGINEERING", desc: "Infrastructure & Pipes." },
        { id: "role_ai", label: "AI / ML ENGINEER", desc: "Models & Automation." },
    ],

};
