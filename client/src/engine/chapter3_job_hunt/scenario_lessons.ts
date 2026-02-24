/**
 * Scenario Lessons — Tony's Micro-Teaching System
 *
 * Each scenario has:
 *   - lesson: 2-4 slides Tony shows BEFORE choices unlock
 *   - reactions: Tony's feedback per choiceId (after choosing)
 *   - tip: Real-world actionable takeaway
 */

export interface ScenarioLesson {
    lesson: string[];
    reactions: Record<string, string>;
    tip: string;
}

export const SCENARIO_LESSONS: Record<string, ScenarioLesson> = {
    // ═══════════════════════════════════
    // FLOOR 0 — THE GRIND (Stage 0)
    // ═══════════════════════════════════

    intro_linkedin_profile: {
        lesson: [
            "Your LinkedIn profile is your digital handshake. Recruiters spend an average of 6 seconds scanning it before deciding to read more.",
            "The top 3 things recruiters look for: a professional photo, a headline with keywords (not just your job title), and a summary that tells your career story.",
            "Here's the formula: Photo + Keyword-Rich Headline + 3-Paragraph Summary + Quantified Achievements = a profile that gets 40x more views.",
        ],
        reactions: {
            optimize_profile: "Smart move. AI-assisted optimization gets your profile found. Now keep it updated every month.",
            write_story: "Excellent! A strong personal brand story is what turns profile views into recruiter messages. This takes time but pays dividends.",
            ignore_social: "Risky. GitHub is great, but 87% of recruiters check LinkedIn first. You're invisible to most opportunities right now.",
            professional_photo: "Good start! A professional photo alone increases profile views by 14x. But don't stop here — your headline and summary need work too.",
        },
        tip: "Use LinkedIn's 'Open to Work' feature (visible only to recruiters) and add industry keywords to your headline. Example: 'Data Analyst | SQL • Python • Tableau | Business Intelligence'",
    },

    resume_ats_battle: {
        lesson: [
            "Your resume goes through an Applicant Tracking System (ATS) before any human reads it. Think of it as a robot gatekeeper.",
            "73% of resumes are auto-rejected by ATS. The #1 reason? Fancy formatting the robot can't parse — columns, tables, graphics, headers/footers.",
            "The fix: single-column layout, standard fonts (Arial/Calibri), no tables or images, and mirror the exact keywords from the job description.",
        ],
        reactions: {
            simplify_resume: "Good instinct! Plain text formatting passes ATS every time. Just make sure you're also including the right keywords.",
            keyword_stuff: "Careful — ATS systems are getting smarter. Keyword stuffing can flag your resume as spam. Use keywords naturally in context.",
            use_ats_scanner: "Smart! Tools like Jobscan or Resume Worded score your resume against job descriptions. Free and incredibly effective.",
            get_human_feedback: "Great approach! A human can catch things ATS scanners miss. Combine this with ATS-friendly formatting for the best results.",
        },
        tip: "Use jobscan.co (free) to check your resume's ATS compatibility score against any job description. Aim for 75%+ match rate.",
    },

    cold_message_spam: {
        lesson: [
            "Cold outreach is a numbers game — but not the way you think. Quality beats quantity every time.",
            "A personalized message gets a 30% response rate. A copy-paste template? Under 3%. That's a 10x difference for the same effort.",
            "The winning formula: Research the person → Reference something specific (their blog post, company news) → Make a clear, small ask (15-min chat, not 'give me a job').",
        ],
        reactions: {
            spam_everyone: "Volume without quality is noise. You'll burn through your network and get blacklisted. Less is more here.",
            target_research: "This is the right approach! 3 well-researched leads will generate more conversations than 100 generic messages.",
            warm_intro: "Brilliant! Warm introductions have a 50% response rate. Your existing network is your biggest asset — use it.",
            content_engage: "Playing the long game! Engaging with someone's content before messaging them builds familiarity. They'll recognize your name.",
        },
        tip: "Before messaging anyone, engage with 2-3 of their posts first. Then reference a specific post in your outreach. This triples your response rate.",
    },

    freelance_temptation: {
        lesson: [
            "Side gigs during a job hunt are a double-edged sword. Money helps, but distraction hurts.",
            "The real question isn't 'should I take it?' — it's 'what's my hourly rate for job hunting?' If job hunting leads to a $60K salary, every focused hour is worth $30+.",
            "Smart approach: If you take gigs, treat them as portfolio pieces. A paid project you can showcase beats random LeetCode any day.",
        ],
        reactions: {
            take_gig: "The cash helps short-term, but you just lost half a day of job hunting. Was $50 worth it? Sometimes yes — just be intentional.",
            focus_hunt: "Disciplined choice. Every hour spent hunting compounds — one good application today could be an offer next month.",
            negotiate_time: "Negotiation practice is always valuable! You just turned a $50 gig into $75 and bought yourself more time. Well played.",
            build_portfolio: "The smartest move here! You get paid AND add a real project to your portfolio. That's the kind of strategic thinking employers love.",
        },
        tip: "If you freelance during your job hunt, always ask: 'Can I use this as a portfolio project?' If yes, it's worth 3x the cash value.",
    },

    family_pressure_call: {
        lesson: [
            "Family pressure during a job hunt is one of the most stressful parts — and nobody talks about it.",
            "Here's the truth: comparison is a thief. Every career path has different timelines. Your friend's son at Google? He probably applied 200 times before getting in.",
            "The healthiest approach: Set boundaries with love. Share your plan (not your emotions), give weekly updates, and redirect conversations to progress, not outcomes.",
        ],
        reactions: {
            explain_market: "You tried to educate, but Mom isn't looking for a market analysis. Save your energy — she needs reassurance, not data.",
            lie_status: "The short-term relief isn't worth the long-term anxiety. What happens when they ask for details? Honesty is always easier to maintain.",
            hang_up: "Grit is good, but isolation hurts. You need emotional support too. Just don't let guilt become your motivator — it leads to bad decisions.",
            set_boundary: "This is emotional intelligence in action. Setting boundaries with love protects your mental health AND your family relationships. Well done.",
        },
        tip: "Create a 'Family Update Template': Share 3 things weekly — 1 application sent, 1 skill learned, 1 positive interaction. It keeps them informed without the pressure.",
    },

    scam_job_offer: {
        lesson: [
            "Job scams cost victims an average of $2,000. In a tough market, desperation makes smart people vulnerable.",
            "Red flags: Unrealistic salary ($200K for entry-level), urgency ('respond in 24 hours'), requesting bank/personal details upfront, generic company email (gmail/yahoo), no interview process.",
            "Real companies never ask for money or bank details during hiring. If it feels too good to be true, it always is.",
        ],
        reactions: {
            click_link: "You just lost $500 to a phishing attack. This is exactly how scammers operate — they prey on urgency and desperation. Learn from this.",
            report_scam: "Perfect response! Reporting helps protect other job seekers. Check naukri.com or LinkedIn for official listings from the same company.",
            research_company: "Excellent critical thinking! Always Google the company + 'scam' before engaging. Check their official website and LinkedIn page.",
            ask_community: "Smart crowd-sourcing! Job search forums and Reddit communities are great for verifying suspicious offers. Someone else has probably seen this scam.",
        },
        tip: "Before responding to any unsolicited job offer, Google: '[Company Name] + scam + reviews'. Check if they have a real website, LinkedIn page, and Glassdoor reviews.",
    },

    portfolio_crash: {
        lesson: [
            "Your portfolio site going down during a job hunt is a crisis — but how you handle it shows real engineering maturity.",
            "AWS bills, configuration errors, expired domains — these are real-world problems that interviewers appreciate hearing about.",
            "Modern deployment rule: Use free-tier hosting (Vercel, Netlify, GitHub Pages) for portfolio sites. Reserve paid hosting for production apps.",
        ],
        reactions: {
            fix_deployment: "Debugging skills leveled up! But for a portfolio, you shouldn't be paying AWS bills. Next time, use Vercel — it's free and auto-deploys.",
            move_github: "Practical choice. GitHub Pages is free and reliable. Your portfolio doesn't need to be fancy — it needs to be UP.",
            use_vercel: "Best choice! Vercel gives you free hosting, auto-deploy from GitHub, custom domains, and looks professional. This is the modern standard.",
            ignore_for_now: "Temporary fix, but you're missing a huge signal. A live portfolio with projects shows initiative. LinkedIn alone isn't enough for tech roles.",
        },
        tip: "Deploy your portfolio on Vercel (free). Connect it to GitHub for auto-deploy. Use a simple template — content matters more than design for tech roles.",
    },

    first_screening_call: {
        lesson: [
            "The screening call is often with a junior recruiter who checks boxes. They're looking for: communication skills, role fit, salary expectations, and availability.",
            "'Tell me about yourself' is the most common opener. The ideal answer follows the Present-Past-Future format: Where you are now → How you got here → Where you're headed.",
            "Keep it under 90 seconds. Practice out loud 10 times. Record yourself. The goal isn't to be perfect — it's to not ramble.",
        ],
        reactions: {
            wing_it: "Winging it shows. Recruiters hear thousands of answers — they can tell who prepared. You survived, but barely. Practice the 90-second pitch.",
            reschedule: "You bought time, but rescheduling sends a signal that you're not ready. Some recruiters won't give a second chance. Prepare a pitch NOW.",
            structure_star: "Impressive under pressure! Using STAR on the fly shows real composure. But next time, have your 90-second pitch rehearsed so you don't need to improvise.",
            honest_unprepared: "Honesty is refreshing! 'Can I gather my thoughts for 10 seconds?' is actually a power move. It shows self-awareness and buys you thinking time.",
        },
        tip: "Write a 90-second 'Tell me about yourself' script using Present-Past-Future. Practice it 10 times out loud. Record yourself and listen back. This one pitch opens every door.",
    },

    // ═══════════════════════════════════
    // FLOOR 1 — THE WORKBENCH (Stage 1)
    // ═══════════════════════════════════

    technical_screening_analyst: {
        lesson: [
            "SQL is the #1 tested skill for data analyst roles. 90% of technical screenings start with a SQL query.",
            "Interviewers care about: correct logic first, then optimization, then style. A working query beats a fancy broken one.",
            "Pro pattern: Always clarify the question → Write a basic working query → Then optimize. Talking through your thought process scores more points than silent coding.",
        ],
        reactions: {
            efficient_query: "Clean, efficient SQL — that's what gets you hired. You showed you can think about performance from the start.",
            basic_query: "It works, but it's basic. For analyst roles, they expect JOIN optimization and awareness of query performance.",
            explain_approach: "Excellent communication! Talking through your approach before coding shows analytical thinking. Interviewers love this.",
            use_cte: "CTEs show advanced SQL maturity. Clean, readable code is a sign of someone who writes production-ready queries. Strong impression.",
        },
        tip: "Practice the 'SQL Interview Pattern': 1) Restate the question, 2) Identify tables needed, 3) Write basic query, 4) Optimize. Sites like StrataScratch and LeetCode have free SQL practice.",
    },

    technical_screening_engineer: {
        lesson: [
            "Algorithm interviews test problem-solving, not memorization. Companies want to see HOW you think, not just IF you can solve it.",
            "The pattern: 1) Ask clarifying questions (edge cases, constraints), 2) Discuss approach before coding, 3) Code the solution, 4) Test with examples, 5) Analyze time/space complexity.",
            "80% of algorithm questions can be solved with these 5 patterns: Two Pointers, Sliding Window, BFS/DFS, Dynamic Programming, and HashMap tricks.",
        ],
        reactions: {
            recursive_sol: "Clean recursive solution! You showed you understand the problem deeply. Just remember to mention the call stack trade-off.",
            brute_force: "It works, but brute force signals junior-level thinking. Always discuss optimization after your initial solution.",
            ask_clarifications: "This is what senior engineers do! Asking edge cases before coding shows production-level thinking. Interviewers are impressed.",
            test_driven: "TDD in an interview? That's rare and incredibly impressive. You just showed engineering maturity most candidates don't have.",
        },
        tip: "Master these 5 patterns and you can solve 80% of algorithm interviews: Two Pointers, Sliding Window, BFS/DFS, Dynamic Programming, and HashMaps. Start with NeetCode's roadmap.",
    },

    technical_screening_ai: {
        lesson: [
            "ML interviews test conceptual understanding more than coding. Can you explain WHY you'd use a technique, not just HOW?",
            "For any ML concept, use this framework: 1) What problem does it solve? 2) How does it work intuitively? 3) What are the trade-offs? 4) When would you use it vs alternatives?",
            "Visual explanations win. If you can draw a diagram or give a real-world analogy, you'll stand out from candidates who just recite textbook definitions.",
        ],
        reactions: {
            detailed_math: "Impressive depth! But be careful — mathematical derivations can lose non-technical interviewers. Always lead with intuition.",
            intuition_only: "High-level is a start, but for ML roles they want depth. Can you explain the math if pushed? Practice going one level deeper.",
            visual_explain: "Visual learners love this approach! Drawing helps both you and the interviewer. This is how the best ML practitioners communicate.",
            practical_examples: "Real-world use cases make abstract concepts concrete. 'L1 for feature selection in fraud detection' — that's memorable and practical.",
        },
        tip: "For every ML concept, prepare: 1) A one-line intuition, 2) A real-world use case, 3) The trade-off vs alternatives. This 3-part answer works for 90% of ML interview questions.",
    },

    ghosted_after_screening: {
        lesson: [
            "Being ghosted after an interview is painfully common. 75% of candidates report it. It's not about you — it's broken hiring processes.",
            "The timeline reality: Hiring decisions take 2-6 weeks. Internal politics, budget freezes, and competing priorities cause delays. Silence doesn't always mean rejection.",
            "The productive response: Follow up once (professionally), then move on mentally. Never stop applying while waiting. Your pipeline should always have multiple opportunities.",
        ],
        reactions: {
            follow_up_polite: "A polite follow-up is the minimum. It keeps you on their radar without being pushy. Good but not great.",
            move_on_angry: "Rage applying feels cathartic but leads to sloppy applications. Channel that energy into 2-3 quality applications instead.",
            strategic_followup: "A value-add follow-up is genius! Sharing a relevant article or insight keeps you top of mind and shows continued interest.",
            accept_move_on: "Emotional maturity. Accepting reality and moving forward is the healthiest response. Keep your pipeline full so one rejection doesn't derail you.",
        },
        tip: "After any interview, send a thank-you email within 24 hours. If no response after 1 week, send ONE follow-up with a value-add (article, insight). Then move on. Never chase.",
    },

    take_home_assignment: {
        lesson: [
            "Take-home assignments are controversial. Some are legitimate skill assessments. Others are unpaid labor disguised as interviews.",
            "Red flags for exploitative assignments: No clear time expectation, involves their real product/data, no feedback promised, scope is unreasonably large.",
            "Smart approach: Set a time limit for yourself (4-6 hours max). Build an MVP that shows your thinking. Document your decisions. A polished MVP beats a buggy full build.",
        ],
        reactions: {
            do_it_perfect: "You got the result, but at what cost? 80 energy points and a weekend gone. This level of effort isn't sustainable across multiple interviews.",
            refuse_assignment: "Principled stand. If the assignment feels exploitative, walking away is valid. But make sure you're not closing doors prematurely.",
            mvp_scope: "Smart scoping! An MVP with clear documentation shows strategic thinking. You completed 80% of the value in 40% of the time.",
            negotiate_time: "Negotiating timelines is underrated! It shows confidence and professionalism. Most companies will accommodate reasonable requests.",
        },
        tip: "For take-home assignments: Set a 4-6 hour personal limit. Document trade-offs in a README: 'Given more time, I would add X, Y, Z.' This shows senior-level thinking.",
    },

    referral_request: {
        lesson: [
            "Employee referrals are the #1 way people get hired. Referred candidates are 15x more likely to be hired than cold applicants.",
            "The mistake most people make: Asking for a referral immediately. The right approach: Reconnect → Show genuine interest in their work → THEN ask.",
            "Make it easy for your referrer: Send them your updated resume, the specific job link, and a 2-line summary of why you're a fit. Don't make them do the work.",
        ],
        reactions: {
            ask_referral: "Coffee chats build real relationships. This approach takes longer but creates lasting professional connections beyond just this one referral.",
            cold_apply: "You missed a huge opportunity. A cold application has a 2% chance of getting an interview. A referral? 40%. The math is clear.",
            direct_referral: "Direct and efficient! If you already have a good relationship, being straightforward is refreshing. Just make sure you've earned the ask.",
            reconnect_first: "This is the gold standard of networking. Reconnecting genuinely before asking shows you value the relationship, not just the referral.",
        },
        tip: "When asking for a referral, send: 1) The specific job link, 2) Your updated resume, 3) A 2-sentence summary of why you fit. Make it a 30-second task for your referrer.",
    },

    lowball_offer_check: {
        lesson: [
            "The salary question is designed to anchor you low. Whatever number you say first becomes the ceiling, not the floor.",
            "In many places, it's actually illegal for employers to ask your current salary. Know your local laws. Even where legal, you're not obligated to answer.",
            "The power move: Redirect to the role's budget. 'I'd love to understand the compensation range for this role first, so we're aligned.' This puts the ball in their court.",
        ],
        reactions: {
            reveal_low: "You just anchored yourself low. Every future offer from this company will be based on this number. Hard to recover from this.",
            deflect: "Good deflection! 'Market rate' keeps your options open. If pushed, follow up with: 'I'm looking for [X range] based on the role requirements.'",
            inflate_slightly: "Risky but common. If they verify your salary through references or background checks, this could backfire. Proceed with caution.",
            flip_question: "Pro negotiator move! Asking their range first gives you information without revealing yours. This is what negotiation experts recommend.",
        },
        tip: "Never reveal your current salary. Instead say: 'Based on my research on Glassdoor and Levels.fyi, the market range for this role is X-Y. I'm targeting the upper end based on my experience.'",
    },

    visa_question: {
        lesson: [
            "The visa/sponsorship question eliminates 60-70% of international candidates before a human even reviews their application.",
            "This is a systemic challenge, not a personal failure. Many great companies do sponsor — but you need to find them strategically.",
            "Resources: Check the H1B salary database (h1bdata.info), company sponsorship lists, and filter job boards for 'visa sponsorship available'.",
        ],
        reactions: {
            check_no: "Lying on applications is risky. If discovered during background checks, it's an immediate disqualification and could affect future applications.",
            check_yes: "Honesty is the right call. Yes, it narrows your options — but it ensures every interview is with a company that can actually hire you.",
            ask_recruiter: "Smart approach! Sometimes the form is a filter but the company has flexibility. A direct conversation with the recruiter can clarify.",
            skip_company: "Efficient use of your time. Focus on companies with proven sponsorship track records. Quality over quantity applies here too.",
        },
        tip: "Use h1bdata.info to find companies that have sponsored visas in the past. Target these companies specifically — they've already built the legal infrastructure.",
    },

    // ═══════════════════════════════════
    // FLOOR 2 — THE COWORK (Stage 2)
    // ═══════════════════════════════════

    system_design_round_1: {
        lesson: [
            "System design interviews aren't about building the perfect system. They're about demonstrating structured thinking under ambiguity.",
            "The #1 mistake candidates make: jumping straight into databases and APIs. Interviewers want to see you ask clarifying questions first — scope the problem before solving it.",
            "A proven framework: 1) Clarify requirements and constraints, 2) Define high-level architecture, 3) Deep-dive into key components, 4) Discuss trade-offs and scaling. Each step earns you points.",
        ],
        reactions: {
            focus_database: "Deep database knowledge is impressive, but you missed the big picture. Interviewers want breadth first, then depth. You went straight to depth.",
            focus_api: "APIs and caching are critical, but jumping in without clarifying requirements means you might be solving the wrong problem. Always scope first.",
            clarify_requirements: "This is what senior engineers do! Asking 'How many daily users? Read-heavy or write-heavy?' shows you think about systems holistically before coding.",
            holistic_approach: "Good breadth coverage! You touched all major components. Just be ready to go deeper if they push — 'Tell me more about your database choice' is coming.",
        },
        tip: "For system design: spend the first 5 minutes asking clarifying questions. 'How many users? Read-heavy or write-heavy? What's the latency requirement?' This immediately signals senior-level thinking.",
    },

    case_study_analyst: {
        lesson: [
            "Business case interviews test analytical thinking, not just spreadsheet skills. They want to see how you structure a messy problem.",
            "The MECE framework (Mutually Exclusive, Collectively Exhaustive) is your best friend. Break the problem into non-overlapping categories that cover all possibilities.",
            "Always start with hypotheses, not data. 'Revenue dropped 20%' — is it volume, price, or mix? Narrowing down before diving into data saves you 70% of the time.",
        ],
        reactions: {
            framework_approach: "MECE is the gold standard for case interviews. You showed structured thinking that consulting firms and product teams value highly.",
            dive_data: "Jumping into spreadsheets without a hypothesis is like searching for a needle in a haystack. You'll drown in data without direction. Always hypothesize first.",
            ask_hypotheses: "Proposing hypotheses before touching data is what distinguishes analysts from data entry. You showed strategic thinking and saved time. Excellent.",
            segment_analysis: "Segmentation is a powerful technique! Breaking data by region, product, or customer type often reveals the root cause quickly. Smart analytical instinct.",
        },
        tip: "In case study interviews, always state your hypothesis out loud before diving in. 'I suspect the revenue drop is driven by [X]. Let me test this first.' Structure beats speed every time.",
    },

    behavioral_failure: {
        lesson: [
            "'Tell me about a failure' is actually a character test, not a skill test. Interviewers want to see self-awareness, ownership, and growth.",
            "The worst answer? 'I'm a perfectionist' or 'I work too hard.' Interviewers hear this 50 times a week. It signals zero self-awareness.",
            "The winning pattern: Share a REAL failure → Take genuine ownership (no blaming) → Explain what you learned → Show how you changed your behavior. Vulnerability is strength.",
        ],
        reactions: {
            fake_failure: "Interviewers see through fake failures like 'I care too much.' You just wasted your chance to show genuine self-awareness. They've heard this answer a thousand times.",
            real_failure: "Powerful! Sharing a real failure with genuine ownership takes courage. Interviewers remember authenticity. You just stood out from every other candidate.",
            star_method: "STAR with genuine ownership is the perfect combination. You showed structure AND authenticity. This answer will be remembered in the debrief.",
            deflect_team: "Blaming others is the biggest red flag in behavioral interviews. Even if it was the team's fault, ownership matters. You just raised a serious concern about your character.",
        },
        tip: "Prepare 3 real failure stories using STAR format. The key is genuine ownership: 'I underestimated X, which caused Y. I learned Z and now I always do W.' Practice saying it without cringing.",
    },

    live_pair_programming: {
        lesson: [
            "Pair programming interviews test collaboration, not just coding skill. Your communication IS the interview — the code is secondary.",
            "Think of it like cooking together: narrate what you're doing, ask for input, and treat the interviewer as a teammate, not a judge.",
            "The biggest mistake: going silent. Even if you're thinking, say 'I'm considering two approaches here...' Silence makes interviewers anxious about your thought process.",
        ],
        reactions: {
            communicate_loud: "Exactly right! Narrating your thought process lets the interviewer help you and shows how you'd collaborate on a real team. Communication IS the skill they're testing.",
            silent_focus: "Your code was clean, but the interviewer has no idea how you think. In pair programming, silence is worse than a wrong approach discussed out loud.",
            ask_preferences: "Respectful and professional! Asking their workflow preference shows emotional intelligence and adaptability. You just made the interviewer feel valued.",
            write_tests: "TDD in a pair programming interview is impressive and rare. You showed engineering discipline and gave the interviewer a clear way to follow your logic.",
        },
        tip: "In pair programming, talk constantly: 'I'm thinking about using a hash map here because...' Even wrong ideas shared out loud are better than correct code written in silence.",
    },

    stress_test_interview: {
        lesson: [
            "Stress interviews are designed to test composure, not correctness. The interviewer is acting rude on purpose — your emotional response IS the answer.",
            "The reality: some companies use stress tactics, but many don't. If the interview feels hostile, it might be a cultural red flag — or it might be a deliberate test.",
            "The winning strategy: Stay calm, acknowledge the push-back, and stand your ground with data. 'That's a fair challenge — here's why I chose this approach...' shows confidence without arrogance.",
        ],
        reactions: {
            get_defensive: "Getting defensive in a stress interview is exactly what they're testing for. You just failed the composure check. In real work, you'll face pushback constantly — handling it gracefully is essential.",
            keep_calm: "Perfect composure! Staying calm under pressure and clarifying your position shows the emotional resilience they need. You passed the real test.",
            ask_feedback: "Turning the attack into a dialogue is a power move. You showed curiosity instead of defensiveness. This response actually impresses most interviewers.",
            walk_out: "Bold move. Sometimes this IS the right call — toxic interview processes often reflect toxic cultures. But make sure you're reading the situation correctly first.",
        },
        tip: "If an interviewer pushes back hard, pause for 2 seconds, take a breath, and say: 'That's a good point. Let me reconsider...' This demonstrates composure and intellectual flexibility.",
    },

    bar_raiser: {
        lesson: [
            "The 'Bar Raiser' round (popularized by Amazon) is about culture fit and leadership principles. Technical skills are already proven — this tests WHO you are.",
            "They're looking for: ownership mentality, customer obsession, bias for action, and the ability to disagree and commit. Every story you tell should demonstrate these traits.",
            "The trick: be authentic but strategic. Pick stories that naturally align with the company's values. If you're interviewing at Amazon, every answer should map to a Leadership Principle.",
        ],
        reactions: {
            show_principles: "Strategic alignment! You mapped your stories to their values perfectly. Bar Raisers are trained to detect authenticity — yours rang true.",
            just_skills: "Technical skills aren't what this round tests. The Bar Raiser already knows you can code. They want to know if you'll elevate the team culture. Missed opportunity.",
            balanced_approach: "The best approach! Balancing technical depth with cultural alignment shows you understand that great engineering is about people AND code.",
            ask_about_role: "Showing curiosity about the role from their perspective is refreshing. It demonstrates humility and a genuine desire to understand the team dynamics.",
        },
        tip: "Before any final round, research the company's published values or leadership principles. Prepare 2-3 stories that naturally demonstrate these values. Authenticity matters — don't force it.",
    },

    lunch_interview: {
        lesson: [
            "The lunch interview is NEVER casual. Everyone at the table will share their impression with the hiring manager. You're being evaluated on social skills and professionalism.",
            "Common traps: ordering messy food, talking negatively about past employers, dominating the conversation, checking your phone, or treating restaurant staff poorly.",
            "The goal: be professional but personable. Ask genuine questions about their work, show interest in the team, and be polite to everyone — including the waiter.",
        ],
        reactions: {
            relax_too_much: "Venting about your old job at a lunch interview is career poison. Everything you said will be reported back. The table just voted 'no hire.'",
            professional_social: "Perfect balance! You were warm, engaged, and professional. The team will report back that you'd be great to work with. That's the whole point of this round.",
            ask_questions: "Great strategy! Asking about work culture shows genuine interest and makes the team feel valued. People love talking about themselves — you just made everyone feel good.",
            match_energy: "Social calibration is an underrated skill! Mirroring the team's energy without losing your professionalism shows high emotional intelligence.",
        },
        tip: "At lunch interviews: order something easy to eat (no spaghetti), never talk negatively about past employers, ask questions about their team culture, and always be kind to staff.",
    },

    // ═══════════════════════════════════
    // FLOOR 3 — THE NEGOTIATION SUITE (Stage 3)
    // ═══════════════════════════════════

    salary_negotiation_start: {
        lesson: [
            "The first offer is almost never the final offer. 84% of employers expect candidates to negotiate. By not negotiating, you're leaving money on the table.",
            "The key insight: salary negotiation isn't adversarial. Both sides want to close the deal. The company has already invested thousands in interviewing you — they want you to say yes.",
            "Your leverage is highest between receiving the offer and signing it. Once you sign, your negotiation power drops to zero. Use this window wisely.",
        ],
        reactions: {
            accept_immediately: "You just left significant money on the table. The first offer is always negotiable. Even a 10% bump compounds to hundreds of thousands over your career.",
            negotiate_data: "Data-driven negotiation is the most effective approach. 'Based on market research, the range for this role is X-Y' is impossible to argue against.",
            negotiate_total_comp: "Smart thinking! Total compensation includes base, bonus, equity, signing bonus, PTO, and learning budget. Negotiating the package — not just the number — maximizes your value.",
            reject_politely: "Walking away from a low offer takes courage. If the gap is too wide, this is the right call. Just make sure you have alternatives — don't bluff without a backup.",
        },
        tip: "Never accept the first offer. Say: 'I'm excited about this role. Based on my research on Levels.fyi, the market range is X-Y. Given my experience in Z, I'd like to discuss a base closer to Y.'",
    },

    equity_confusion: {
        lesson: [
            "Stock options (ISOs/NSOs) are the most misunderstood part of compensation. Most people either overvalue or undervalue them — both mistakes cost thousands.",
            "Key terms you MUST understand: Strike price (your buy price), Fair Market Value (current share value), Vesting schedule (usually 4 years with 1-year cliff), and 409A valuation.",
            "The critical question for startups: 'What percentage of the company do my shares represent?' 10,000 shares means nothing without knowing total shares outstanding.",
        ],
        reactions: {
            ask_details: "Asking the right questions protects you. 'What's the 409A valuation? Total shares outstanding? Latest funding round?' These questions show financial sophistication.",
            assume_bonus: "Never assume equity equals cash! ISOs have tax implications, vesting schedules, and exercise windows. Treating equity like a bonus is a common and expensive mistake.",
            hire_advisor: "Smart move! A financial advisor specializing in equity compensation can save you thousands in tax planning alone. This is a professional investment.",
            research_online: "Good starting point! Resources like Carta's equity education, The Holloway Guide to Equity, and r/financialplanning can help. But for big decisions, consult a professional.",
        },
        tip: "For any equity offer, ask 4 questions: 1) What percentage of the company do I own? 2) What's the latest 409A valuation? 3) What's the vesting schedule? 4) What happens to my equity if I leave?",
    },

    exploding_offer: {
        lesson: [
            "Exploding offers (24-48 hour deadlines) are a pressure tactic. They work because fear of loss is a stronger motivator than potential gain.",
            "The reality: most deadlines are negotiable. Companies that invest weeks interviewing you won't throw you away over a 3-day extension request. If they do — red flag.",
            "A professional extension request: 'I'm very excited about this opportunity. I want to make a thoughtful decision. Could I have until [specific date]?' This is standard and expected.",
        ],
        reactions: {
            call_bluff: "Good instinct! Asking for an extension is standard practice. Most companies will give you 3-7 days. If they don't, that tells you something about their culture.",
            panic_sign: "Panic signing is the worst negotiation outcome. You've given up all leverage and might be accepting below market rate. Fear made the decision, not logic.",
            negotiate_deadline: "Professional and assertive! Requesting a specific extension (not open-ended) shows you're serious about the role while respecting your own decision process.",
            walk_away: "Sometimes walking away is the right call. If a company won't give you 48 hours to make a life-changing decision, imagine what working there would be like.",
        },
        tip: "When you receive an exploding offer, email immediately: 'Thank you for this exciting offer. To make a thoughtful decision, I'd appreciate an extension until [date 5 days out].' 90% of companies will agree.",
    },

    reference_check_scare: {
        lesson: [
            "Reference checks are the final hurdle — and the most anxiety-inducing for people who've had difficult manager relationships.",
            "Good news: most reference checks are brief and formulaic. They verify dates, title, and ask if you're eligible for rehire. Detailed character assassinations are rare (and legally risky for the reference).",
            "Preparation strategy: Always give your references a heads-up. Tell them what role you're applying for, what skills to highlight, and what questions to expect. Prepared references give better responses.",
        ],
        reactions: {
            warn_manager: "Proactive communication! Calling your ex-manager shows maturity. Most people mellow over time. You might be surprised — they may have moved on from the friction.",
            provide_peer: "A common workaround! If your relationship with your manager was genuinely toxic, offering peer references is totally acceptable. Most companies allow it.",
            honest_context: "Transparency builds trust. Saying 'My manager and I had different work styles, but here are peers who can speak to my contributions' is honest and professional.",
            multiple_refs: "Offering 4-5 references when they asked for 2 dilutes any single negative voice. Plus, it shows confidence — people who have something to hide don't offer MORE references.",
        },
        tip: "Always brief your references before they get called. Send them: the job description, 2-3 points you'd like them to highlight, and a timeline. A prepared reference is 3x more effective.",
    },

    competing_offer_leverage: {
        lesson: [
            "Having multiple offers is the strongest position in any negotiation. It transforms 'please hire me' into 'help me choose you.'",
            "The ethical way to use competing offers: be honest. 'I have another offer I'm considering. I prefer your company because [genuine reason]. Can we discuss the compensation?'",
            "Never lie about competing offers. Recruiters talk to each other. Industries are smaller than you think. Getting caught fabricating an offer destroys your reputation permanently.",
        ],
        reactions: {
            mention_offer: "Transparent leverage! Mentioning Company B honestly gives Company A a reason to improve their offer. This is how negotiation works — information creates value.",
            play_safe: "Playing it safe means playing it small. You have real leverage and you're leaving it on the table. The worst they can say is 'our offer stands.'",
            explore_both: "Fast-tracking the second process is smart! Having two finalized offers gives you maximum leverage and genuine choice. Just be honest with both companies about your timeline.",
            compare_values: "Money isn't everything. Comparing culture, growth opportunities, and team dynamics shows maturity. The highest-paying job isn't always the best career move.",
        },
        tip: "When you have competing offers, be direct: 'I have an offer from [Company B] at [X level]. I prefer your company because [reason]. Is there flexibility in the compensation?' This works 70% of the time.",
    },

    // ═══════════════════════════════════
    // FLOOR 4 — THE SUMMIT (Stage 4)
    // ═══════════════════════════════════

    sign_or_walk: {
        lesson: [
            "The final decision isn't just about the offer — it's about the trajectory. Where will this job take you in 2 years? 5 years? That's the real question.",
            "Safe but boring vs exciting but risky — this tension defines career growth. Neither choice is wrong. What matters is that YOU are making the decision, not fear or pressure.",
            "A framework for big decisions: Write down your 3 non-negotiables (things you must have), 3 nice-to-haves, and 3 deal-breakers. Score the offer against these. Let data guide emotion.",
        ],
        reactions: {
            sign_contract: "You chose stability. That's not weakness — it's strategy. Use the first year to build skills, network internally, and create options for your next move.",
            decline_offer: "Walking away takes extraordinary courage. Make sure you have a plan B and a financial runway. The best opportunities often come to those who dare to wait.",
            negotiate_one_more: "One final push! There's nothing to lose at this stage. The worst outcome is the original offer. The best? An extra few thousand per year for the rest of your career.",
            sign_with_plan: "The growth mindset play! Signing while maintaining learning momentum means you're never stuck. This job is a platform, not a destination. Excellent thinking.",
        },
        tip: "Before signing any offer, ask yourself: 'Will I learn enough here to be worth 30% more in 2 years?' If yes, sign confidently. If no, negotiate for learning opportunities (conference budget, training, mentorship).",
    },

    startup_gamble: {
        lesson: [
            "Equity-only startup offers are the highest-risk, highest-reward play in the job market. 90% of startups fail — but the 10% that succeed can be life-changing.",
            "The critical evaluation: Who are the founders? What's the market size? Do they have funding or revenue? What's the burn rate? Answers to these questions determine if this is a smart bet or a fantasy.",
            "The hybrid approach is often the smartest: negotiate for a base salary (even below market) plus equity. This gives you financial stability while maintaining upside potential.",
        ],
        reactions: {
            join_startup: "All-in! This is the entrepreneur's choice. If the founders are proven, the market is large, and you have financial runway — this could be the decision that changes everything. High risk, high reward.",
            reject_risk: "Pragmatic choice. Equity-only offers are a gamble, and turning one down to pursue stable opportunities is financially responsible. There will be other startups.",
            negotiate_base_salary: "The smartest financial play! A below-market base salary plus equity gives you stability AND upside. Most startups will agree because it shows you're invested in their success.",
            advisor_role: "Creative negotiation! A part-time advisor role lets you keep your day job while getting equity exposure. Lower risk, lower reward, but maximum flexibility.",
        },
        tip: "For startup equity offers, ask: 1) How much runway do you have? 2) What's the cap table look like? 3) Can I see the term sheet? If they can't answer these questions, walk away.",
    },
};
