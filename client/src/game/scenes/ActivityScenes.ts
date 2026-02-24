/* ============================================================
   Activity System — Interviews, Challenges, Networking Events
   Encounters triggered from NPC conversations
   ============================================================ */

import * as Phaser from 'phaser';
// TODO: game-types.ts doesn't exist - types temporarily disabled
// import type { InterviewEncounter, CodingChallenge, NetworkingEvent } from './game-types';
type InterviewEncounter = any;
type CodingChallenge = any;
type NetworkingEvent = any;
import { useGameStore } from '@/store/gameStore';
// TODO: npc-manager doesn't exist - imports temporarily disabled
// import { updateNPCTrust, applyNPCInteractions } from '@/engine/npc-manager';
const updateNPCTrust = (...args: any[]) => console.log('updateNPCTrust', args);
const applyNPCInteractions = (...args: any[]) => console.log('applyNPCInteractions', args);

// ============================================================
// INTERVIEW SYSTEM
// ============================================================

export class InterviewScene extends Phaser.Scene {
  protected currentInterview!: InterviewEncounter;
  protected questionIndex: number = 0;
  protected uiPanel!: Phaser.GameObjects.Container;
  
  constructor() {
    super('scene-interview');
  }
  
  init(data: { interview: InterviewEncounter; npcId: string }) {
    this.currentInterview = data.interview;
  }
  
  create() {
    // Background
    this.add.rectangle(512, 384, 1024, 768, 0x2c3e50);
    
    // Interview header
    const title = this.add.text(512, 50, `Interview: ${this.currentInterview.position}`, {
      fontSize: '32px',
      color: '#ffffff',
      align: 'center'
    });
    title.setOrigin(0.5);
    
    // Interviewer portrait (placeholder)
    const portraitBg = this.add.rectangle(150, 200, 200, 300, 0x34495e);
    const portraitText = this.add.text(150, 200, '[Interviewer]', {
      fontSize: '18px',
      color: '#bdc3c7'
    });
    portraitText.setOrigin(0.5);
    
    // Current question
    const question = this.currentInterview.questions[this.questionIndex];
    const questionText = this.add.text(450, 150, `Q: ${question.text}`, {
      fontSize: '18px',
      color: '#ecf0f1',
      wordWrap: { width: 520 }
    });
    
    // Answer options
    question.answers.forEach((answer: any, index: number) => {
      this.createAnswerButton(answer, index, 250 + index * 100);
    });
    
    // Control hint
    const hint = this.add.text(512, 700, '[Press Space to continue]', {
      fontSize: '12px',
      color: '#95a5a6'
    });
    hint.setOrigin(0.5);
    
    // Input
    this.input.keyboard?.on('keydown-SPACE', () => this.nextQuestion());
  }
  
  protected createAnswerButton(answer: any, index: number, x: number) {
    const bg = this.add.rectangle(x, 400, 140, 60, 0x3498db, 0.8);
    bg.setInteractive();
    bg.on('pointerdown', () => this.selectAnswer(answer));
    
    const text = this.add.text(x, 400, answer.text, {
      fontSize: '12px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 130 }
    });
    text.setOrigin(0.5);
  }
  
  protected selectAnswer(answer: any) {
    const gameState = useGameStore();
    
    // Calculate success chance based on skills
    const success = Math.random() < answer.successChance;
    
    if (success) {
      console.log('✓ Great answer!');
      // Apply stat bonuses
      if (answer.fx) {
        gameState.updateStats(answer.fx);
      }
    } else {
      console.log('✗ Not ideal');
      // Penalty (handled elsewhere)
    }
    
    this.nextQuestion();
  }
  
  protected nextQuestion() {
    this.questionIndex++;
    
    if (this.questionIndex >= this.currentInterview.questions.length) {
      this.endInterview();
    } else {
      this.scene.restart();
    }
  }
  
  protected endInterview() {
    const gameState = useGameStore();
    const success = Math.random() > 0.5;  // Simplified
    
    if (success) {
      // Job offer!
      this.showOutcome('🎉 Offer Extended!', this.currentInterview.passRewards);
      gameState.updateStats(this.currentInterview.passRewards);
    } else {
      this.showOutcome('Unfortunately...', this.currentInterview.failPenalty);
      gameState.updateStats(this.currentInterview.failPenalty);
    }
    
    // Return to world after 3 seconds
    this.time.delayedCall(3000, () => {
      this.scene.stop();
      this.scene.resume('scene-downtown');
    });
  }
  
  protected showOutcome(title: string, data: any) {
    const bg = this.add.rectangle(512, 384, 600, 300, 0x000000, 0.9);
    const titleText = this.add.text(512, 250, title, {
      fontSize: '32px',
      color: '#ffffff'
    });
    titleText.setOrigin(0.5);
    
    const message = this.add.text(512, 350, JSON.stringify(data), {
      fontSize: '16px',
      color: '#ecf0f1'
    });
    message.setOrigin(0.5);
  }
}

// ============================================================
// CODING CHALLENGE SYSTEM
// ============================================================

export class CodingChallengeScene extends Phaser.Scene {
  protected currentChallenge: CodingChallenge;
  protected gameState = useGameStore();
  
  constructor() {
    super('scene-coding-challenge');
  }
  
  init(data: { challenge: CodingChallenge }) {
    this.currentChallenge = data.challenge;
  }
  
  create() {
    this.add.rectangle(512, 384, 1024, 768, 0x1e1e1e);
    
    // Challenge title
    const title = this.add.text(512, 50, `${this.currentChallenge.title}`, {
      fontSize: '28px',
      color: '#00ff00',
      fontFamily: 'monospace'
    });
    title.setOrigin(0.5);
    
    // Challenge description
    const desc = this.add.text(512, 120, this.currentChallenge.description, {
      fontSize: '14px',
      color: '#cccccc',
      wordWrap: { width: 800 }
    });
    desc.setOrigin(0.5);
    
    // Mini-game based on type
    switch (this.currentChallenge.minigameType) {
      case 'bug_smasher':
        this.createBugSmasher();
        break;
      case 'code_completion':
        this.createCodeCompletion();
        break;
      case 'algorithm_race':
        this.createAlgorithmRace();
        break;
    }
    
    // Continue button
    const continueBtn = this.add.text(512, 700, '[Press SPACE to finish]', {
      fontSize: '14px',
      color: '#ffffff'
    });
    continueBtn.setOrigin(0.5);
    
    this.input.keyboard?.on('keydown-SPACE', () => this.endChallenge());
  }
  
  protected createBugSmasher() {
    // Simple click-the-bugs mini-game
    // Bugs appear randomly, player clicks them
    const bugCount = 5;
    let bugsClicked = 0;
    
    for (let i = 0; i < bugCount; i++) {
      const x = 200 + Math.random() * 600;
      const y = 300 + Math.random() * 300;
      
      const bug = this.add.rectangle(x, y, 20, 20, 0xff4444);
      bug.setInteractive();
      bug.on('pointerdown', () => {
        bug.destroy();
        bugsClicked++;
        
        if (bugsClicked === bugCount) {
          this.showSuccess('All bugs squashed!', { python: 10 });
        }
      });
    }
    
    // Timer
    const timerText = this.add.text(900, 300, '30s', {
      fontSize: '24px',
      color: '#ffff00'
    });
    
    let timeLeft = 30;
    const timer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        timeLeft--;
        timerText.setText(`${timeLeft}s`);

        if (timeLeft <= 0) {
          timer.remove();
          this.showResult(bugsClicked, bugCount);
        }
      },
      loop: true
    });
  }
  
  protected createCodeCompletion() {
    // Show incomplete code, player fills in blanks
    // (Simplified: just tap buttons with correct options)
    
    const codeSnippet = `
function fibonacci(n) {
  if (n <= 1) return n;
  return [BLANK1](n-1) + [BLANK2](n-2);
}

const result = fibonacci(5);  // Should be [BLANK3]
    `;
    
    this.add.text(512, 300, codeSnippet, {
      fontSize: '12px',
      color: '#00ff00',
      fontFamily: 'monospace'
    });
    
    // Answer options
    const options = [
      { text: 'fibonacci', blank: 1 },
      { text: 'fib', blank: 1 },
      { text: 'recurse', blank: 1 },
    ];
    
    // (simplified - full version would show multiple choice for each blank)
  }
  
  protected createAlgorithmRace() {
    // Sort/algorithm challenge with visual feedback
    const items = [5, 2, 8, 1, 9, 3];
    
    // Display unsorted
    items.forEach((val, i) => {
      this.add.text(200 + i * 100, 350, String(val), {
        fontSize: '28px',
        color: '#ff6b6b'
      });
    });
    
    // Simple: on space key, animate sort
    let sorted = false;
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (!sorted) {
        items.sort((a, b) => a - b);
        this.tweens.add({
          targets: this,
          duration: 1000,
          onUpdate: () => {
            // Animate items shuffling
          }
        });
        sorted = true;
        this.showSuccess('Sorted correctly!', { python: 15 });
      }
    });
  }
  
  protected showSuccess(message: string, rewards: any) {
    const bg = this.add.rectangle(512, 384, 400, 200, 0x27ae60, 0.9);
    this.add.text(512, 340, message, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Apply skill reward
    this.gameState.updateStats(rewards);
  }
  
  protected showResult(correct: number, total: number) {
    const percentage = (correct / total) * 100;
    const success = percentage >= 70;
    
    const bg = this.add.rectangle(512, 384, 400, 200, success ? 0x27ae60 : 0xc0392b, 0.9);
    this.add.text(512, 340, `${percentage.toFixed(0)}% Complete`, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
  }
  
  protected endChallenge() {
    this.scene.stop();
    this.scene.resume('scene-downtown');
  }
}

// ============================================================
// NETWORKING EVENT SYSTEM
// ============================================================

export class NetworkingEventScene extends Phaser.Scene {
  protected event: NetworkingEvent;
  protected gameState = useGameStore();
  
  constructor() {
    super('scene-networking-event');
  }
  
  init(data: { event: NetworkingEvent }) {
    this.event = data.event;
  }
  
  create() {
    this.add.rectangle(512, 384, 1024, 768, 0x4a235a);
    
    // Event header
    this.add.text(512, 50, this.event.name, {
      fontSize: '28px',
      color: '#e91e63'
    }).setOrigin(0.5);
    
    // Show attendees (NPCs)
    this.add.text(100, 150, 'Meet people here:', {
      fontSize: '16px',
      color: '#ecf0f1'
    });
    
    this.event.attendees.forEach((npcId: any, index: number) => {
      this.createNPCOption(npcId, 100, 200 + index * 80);
    });
    
    // Reputation earned message
    this.add.text(512, 700, `🏆 +${this.event.reputation} Reputation`, {
      fontSize: '16px',
      color: '#f39c12'
    }).setOrigin(0.5);
    
    this.input.keyboard?.on('keydown-SPACE', () => this.endEvent());
  }
  
  protected createNPCOption(npcId: string, x: number, y: number) {
    const bg = this.add.rectangle(x + 150, y, 300, 60, 0x8e44ad, 0.8);
    bg.setInteractive();
    bg.on('pointerdown', () => this.meetNPC(npcId));
    
    const text = this.add.text(x + 150, y, `Network with someone from ${npcId}`, {
      fontSize: '14px',
      color: '#ffffff'
    });
    text.setOrigin(0.5);
  }
  
  protected meetNPC(npcId: string) {
    // Improve relationship with this NPC
    // TODO: updateNPCRelation doesn't exist in store
    console.log('Met NPC:', npcId);
    updateNPCTrust(npcId, 10);

    this.add.text(512, 400, `✓ Met ${npcId}!`, {
      fontSize: '20px',
      color: '#2ecc71'
    }).setOrigin(0.5);
  }
  
  protected endEvent() {
    // Apply reputation reward
    const rewards = { reputation: this.event.reputation };
    this.gameState.updateStats(rewards);
    
    this.scene.stop();
    this.scene.resume('scene-downtown');
  }
}

// ============================================================
// COFFEE CHAT ACTIVITY
// ============================================================

export class CoffeeChatScene extends Phaser.Scene {
  protected npcId!: string;
  protected gameState = useGameStore();
  
  constructor() {
    super('scene-coffee-chat');
  }
  
  init(data: { npcId: string }) {
    this.npcId = data.npcId;
  }
  
  create() {
    // Cozy cafe background
    this.add.rectangle(512, 384, 1024, 768, 0xd4a574);
    
    // NPC on left
    const npcBg = this.add.rectangle(200, 300, 150, 300, 0x8b6914);
    this.add.text(200, 200, '[NPC Portrait]', {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Dialogue on right
    const dialogue = this.add.text(550, 250, 'So, tell me about your career goals...', {
      fontSize: '16px',
      color: '#2c3e50',
      wordWrap: { width: 400 }
    });
    
    // Response options
    this.createResponseButton('Be vulnerable and honest', 1, 400);
    this.createResponseButton('Talk confidently about skills', 2, 450);
    this.createResponseButton('Ask for their advice', 3, 500);
    
    // Time spent
    this.add.text(512, 650, 'Time: 1 hour', {
      fontSize: '12px',
      color: '#34495e'
    }).setOrigin(0.5);
  }
  
  protected createResponseButton(text: string, index: number, y: number) {
    const bg = this.add.rectangle(550, y, 300, 35, 0x3498db, 0.7);
    bg.setInteractive();
    bg.on('pointerdown', () => this.selectResponse(index, text));
    
    this.add.text(550, y, text, {
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5);
  }
  
  protected selectResponse(index: number, text: string) {
    const trustGain = [20, 15, 10][index];
    const statBonus = [5, 15, 10][index];  // confidence bonuses vary
    
    // Update NPC relationship
    // TODO: updateNPCRelation doesn't exist in store
    console.log('Update NPC trust:', this.npcId, trustGain);
    updateNPCTrust(this.npcId, trustGain);
    
    // Apply stat changes
    this.gameState.updateStats({ confidence: statBonus });
    
    this.add.text(512, 550, `✓ Great conversation!`, {
      fontSize: '16px',
      color: '#2ecc71'
    }).setOrigin(0.5);
    
    this.time.delayedCall(2000, () => {
      this.scene.stop();
      this.scene.resume('scene-downtown');
    });
  }
}

export const ActivitySystem = {
  InterviewScene,
  CodingChallengeScene,
  NetworkingEventScene,
  CoffeeChatScene
};
