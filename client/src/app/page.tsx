"use client";

import { useEffect, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import BackgroundStage from "@/components/BackgroundStage";
const ProtocolOnboarding = dynamic(() => import("@/components/ProtocolOnboarding"), { ssr: false });
const NameInput = dynamic(() => import("@/components/NameInput"), { ssr: false });
const Workspace = dynamic(() => import("@/components/Workspace"), { ssr: false });
const EndScreen = dynamic(() => import("@/components/EndScreen"), { ssr: false });
const JobHuntChapter = dynamic(() => import("@/engine/chapter3_job_hunt/JobHuntChapter"), { ssr: false });
const RoadmapTransition = dynamic(() => import("@/components/RoadmapTransition"), { ssr: false });
const StrategicBriefing = dynamic(() => import("@/components/StrategicBriefing"), { ssr: false });

// Babylon.js Components
const VoxelWorld = dynamic(() => import("@/components/babylon/VoxelWorld"), { ssr: false });
const TonyRoom = dynamic(() => import("@/components/babylon/TonyRoom"), { ssr: false });
const JobHuntWorld = dynamic(() => import("@/components/babylon/JobHuntWorld"), { ssr: false });

// 3D Components
const CharacterCreator = dynamic(() => import("@/components/3d/CharacterCreator"), { ssr: false });
const OnboardingWorld = dynamic(() => import("@/components/3d/OnboardingWorld"), { ssr: false });
const OnboardingSceneManager = dynamic(() => import("@/components/3d/OnboardingSceneManager"), { ssr: false });

import { createSession, submitAction, getMirror } from "@/lib/api";
import { useGameStore } from "@/store/gameStore";
import { useAudio } from "@/hooks/useAudio";
import styles from "./page.module.css";

/* ============================================================
   Scene Action Definitions
   ============================================================ */

const SCENE_ACTIONS: Record<string, Array<{ id: string; label: string; desc: string }>> = {
    // Ch1
    ch1_role_selection: [
        { id: "role_analyst", label: "Data Analyst", desc: "You see patterns in chaos. Spreadsheets are your language." },
        { id: "role_data_engineer", label: "Data Engineer", desc: "You build the pipes. Without you, nothing flows." },
        { id: "role_data_scientist", label: "Data Scientist", desc: "You ask the hard questions and hunt for answers in data." },
        { id: "role_ai_ml", label: "AI / ML Engineer", desc: "You teach machines to think. The frontier calls you." },
    ],
    ch1_experience: [
        { id: "exp_student_fresher", label: "Student / Fresher", desc: "No corporate scars yet. The world is abstract." },
        { id: "exp_early_1_3", label: "1–3 Years", desc: "You've seen enough to have opinions. Not enough to trust them." },
        { id: "exp_mid_3_7", label: "3–7 Years", desc: "You know the game. You're not sure you like it." },
    ],
    ch1_mindset: [
        { id: "mindset_ambitious", label: "Ambitious", desc: "You want more. Always have." },
        { id: "mindset_cautious", label: "Cautious", desc: "You measure twice. Sometimes three times." },
        { id: "mindset_idealistic", label: "Idealistic", desc: "You believe work should mean something." },
        { id: "mindset_pragmatic", label: "Pragmatic", desc: "You deal with what's in front of you." },
    ],
    // Ch2
    ch2_resume: [
        { id: "resume_honest", label: "Keep It Honest", desc: "List only what you've actually done. No embellishments." },
        { id: "resume_fluff", label: "Pad It a Little", desc: "Stretch a group project into 'led a cross-functional team'." },
        { id: "resume_targeted", label: "Tailor for Each Role", desc: "Rewrite it from scratch for every application." },
    ],
    ch2_apply: [
        { id: "apply_mass", label: "Cast a Wide Net", desc: "Apply to 50 jobs this week. Volume is the strategy." },
        { id: "apply_targeted", label: "Sniper Approach", desc: "3 carefully researched applications. Quality over quantity." },
        { id: "apply_referral", label: "Work Your Network", desc: "Reach out to people and ask for referrals." },
    ],
    ch2_interview_prep: [
        { id: "prep_cram", label: "Cram Everything", desc: "Pull an all-nighter. Watch 40 YouTube videos." },
        { id: "prep_methodical", label: "Structured Prep", desc: "Two weeks of deliberate practice. Mock interviews." },
        { id: "prep_wing_it", label: "Trust Your Instincts", desc: "You know your stuff. Over-preparing makes you robotic." },
    ],
    ch2_interview: [
        { id: "interview_technical", label: "Lead with Technical Depth", desc: "Show them the code, the models, the pipelines." },
        { id: "interview_story", label: "Tell Stories", desc: "Frame everything as a narrative. Problem, approach, impact." },
        { id: "interview_honest_gaps", label: "Acknowledge Your Gaps", desc: "When you don't know, say so." },
    ],
    ch2_offer: [
        { id: "offer_accept", label: "Accept Immediately", desc: "Don't risk it. Say yes before they change their mind." },
        { id: "offer_negotiate", label: "Negotiate", desc: "Ask for more. The worst they can say is no." },
        { id: "offer_reject", label: "Walk Away", desc: "It's not right. Something's off." },
    ],
    // Ch3 (Remaining actions same as before...)
    ch3_day_one: [
        { id: "day1_eager", label: "Hit the Ground Running", desc: "Introduce yourself to everyone. Show initiative." },
        { id: "day1_observe", label: "Observe First", desc: "Sit quietly. Watch how things work." },
        { id: "day1_social", label: "Find Your People", desc: "Skip the work — find who you'll eat lunch with." },
    ],
    ch3_first_task: [
        { id: "task_perfect", label: "Deliver Perfection", desc: "Take your time. Triple-check everything." },
        { id: "task_fast", label: "Ship It Fast", desc: "Good enough is good enough. Speed impresses." },
        { id: "task_ask_help", label: "Ask for Help", desc: "Swallow your pride. Better to ask now." },
    ],
    ch3_team: [
        { id: "team_ally", label: "Find a Mentor", desc: "Attach yourself to the approachable senior." },
        { id: "team_independent", label: "Stay Independent", desc: "Learn on your own. Dependencies are weaknesses." },
        { id: "team_political", label: "Play the Game", desc: "Figure out who has power and align yourself." },
    ],
    ch3_deliverable: [
        { id: "deliver_quality", label: "Quality Over Everything", desc: "Document it. Make it bulletproof." },
        { id: "deliver_speed", label: "Move Fast", desc: "Ship the MVP. Iterate later." },
        { id: "deliver_collaborate", label: "Co-own It", desc: "Pull in a teammate. Share credit, share risk." },
    ],
    ch3_checkin: [
        { id: "checkin_confident", label: "Highlight Your Wins", desc: "Walk in with a list of accomplishments." },
        { id: "checkin_vulnerable", label: "Ask for Honest Feedback", desc: "Where am I weak? Don't sugarcoat it." },
        { id: "checkin_deflect", label: "Keep It Light", desc: "Smile, nod, say everything is 'going great.'" },
    ],
    // Ch4
    ch4_routine: [
        { id: "routine_embrace", label: "Lean Into Stability", desc: "Master the cycle. Become indispensable." },
        { id: "routine_resist", label: "Fight the Monotony", desc: "Take on stretch projects nobody else wants." },
        { id: "routine_check_out", label: "Quiet Quit", desc: "Do the minimum. Save energy for after 5 PM." },
    ],
    ch4_growth: [
        { id: "growth_promotion", label: "Chase the Promotion", desc: "Visibility. Impact docs. Skip-level meetings." },
        { id: "growth_side_project", label: "Build Something on the Side", desc: "Nights and weekends. Your thing." },
        { id: "growth_learn", label: "Deep Skill Investment", desc: "Learn something nobody else on the team knows." },
    ],
    ch4_ethics: [
        { id: "ethics_speak_up", label: "Raise the Concern", desc: "Flag it. The data doesn't support the narrative." },
        { id: "ethics_quiet", label: "Stay Quiet", desc: "Not your problem. No political capital to spend." },
        { id: "ethics_anonymous", label: "Anonymous Report", desc: "Use the ethics hotline. Let someone else deal with it." },
    ],
    ch4_crossroads: [
        { id: "cross_stay", label: "Stay and Grow", desc: "There's still more to learn here." },
        { id: "cross_leave", label: "Start Looking", desc: "You've hit the ceiling. Time for the next thing." },
        { id: "cross_entrepreneurship", label: "Go Independent", desc: "Freelance. Consult. No more managers." },
    ],
    ch4_mirror: [
        { id: "mirror_view", label: "Look at the Mirror", desc: "See the reflection of every choice you've made." },
    ],
};

const CHAPTER_NAMES: Record<number, string> = {
    0: "PROLOGUE",
    1: "CHAPTER 1 — ORIENTATION",
    2: "CHAPTER 2 — THE JOB HUNT",
    3: "CHAPTER 3 — FIRST 90 DAYS",
    4: "CHAPTER 4 — CAREER CROSSROADS",
};

export default function GamePage() {
    const store = useGameStore();

    // Toggle for 3D mode (you can turn this on/off)
    const [use3D, setUse3D] = useState(true); // Set to false to use old 2D UI

    // 1. Loading State (Dashboard style)
    if (store.isLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--background)' }}>
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="font-medium animate-pulse tracking-widest uppercase text-sm" style={{ color: 'var(--foreground-muted)' }}>Initializing Scenario Engine...</p>
                </div>
            </main>
        );
    }

    // 2. Professional Splash Screen
    if (store.uiPhase === "intro") {
        return (
            <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
                {/* Abstract Background Element */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="text-center max-w-2xl relative z-10 flex flex-col items-center">
                    <div className="inline-block px-4 py-1.5 bg-blue-600/10 rounded-full border border-blue-500/30 mb-8 backdrop-blur-sm">
                        <span className="text-blue-400 font-bold text-xs tracking-[0.2em] uppercase">A Codebasics Production</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-none" style={{ color: 'var(--foreground)' }}>
                        CAREER<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">SIMULATOR</span>
                    </h1>

                    <p className="text-lg md:text-xl mb-10 max-w-lg mx-auto leading-relaxed font-medium" style={{ color: 'var(--foreground-muted)' }}>
                        Navigate the corporate labyrinth. Make tough choices. Build your legacy.
                    </p>

                    <button
                        className="group relative px-10 py-5 text-lg font-black uppercase tracking-widest rounded-full transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                        style={{ backgroundColor: 'var(--primary)', color: '#ffffff' }}
                        onClick={() => store.setUiPhase("tony_room")}
                    >
                        Start Your Journey
                        <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
                    </button>


                    <div className="mt-12 text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--foreground-muted)' }}>
                        Real Life Career Sim • v4.0 (Engine Powered)
                    </div>
                </div>
            </main>
        );
    }

    // 3. Name Input Phase (with 3D option)
    if (store.uiPhase === "setup") {
        if (use3D) {
            return <CharacterCreator />;
        }
        return (
            <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--background)' }}>
                <NameInput />
            </main>
        );
    }

    // 4. Tony Sharma's Room — Onboarding Questions
    if (store.uiPhase === "tony_room") {
        return (
            <TonyRoom
                playerName={store.characterName}
                onComplete={() => store.setUiPhase("jobhunt")}
            />
        );
    }

    // 4b. Strategic Briefing Phase (legacy 3D Onboarding)
    if (store.uiPhase === "briefing") {
        if (use3D) {
            return <OnboardingSceneManager />;
        }
        return <StrategicBriefing />;
    }

    // 5. Main Career Dashboard
    if (store.uiPhase === "end") {
        return <EndScreen />;
    }

    if (store.uiPhase === "roadmap") {
        return <RoadmapTransition />;
    }

    // 6. Job Hunt — GTA-Style Free-Roam 3D Rooms ("The Climb")
    if (store.uiPhase === "jobhunt") {
        return <JobHuntWorld />;
    }

    // 7. Voxel World for game phase
    if (store.uiPhase === "game") {
        return <VoxelWorld playerName={store.characterName} />;
    }

    // Default: Game Workspace (fallback)
    return <Workspace />;
}
