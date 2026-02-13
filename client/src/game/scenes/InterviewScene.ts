/**
 * INTERVIEWSCENE — Technical Interview Activity
 *
 * A game-like interview scenario where player answers questions
 * Performance is based on player's technical_depth stat
 *
 * Mechanics:
 * - Multiple choice Q&A
 * - Score calculated based on answer quality
 * - Stats updated based on performance
 * - Returns to location with results
 */

import * as Phaser from 'phaser';
import type { SeedStats } from '@/server/src/engine/stat-seeder';
import { UI_LAYERS, DIALOGUE_UI_CONFIG } from '@/game/GameConfig';

// Placeholder types and data
interface WorldNPC {
  npcId: string;
  name: string;
  location: string;
  x: number;
  y: number;
  sprite: string;
}

const NPC_DATABASE: { [key: string]: WorldNPC } = {
  sarah: { npcId: 'sarah', name: 'Sarah', location: 'downtown', x: 300, y: 300, sprite: 'npc_recruiter' },
  alex: { npcId: 'alex', name: 'Alex', location: 'library', x: 400, y: 250, sprite: 'npc_mentor' },
  casey: { npcId: 'casey', name: 'Casey', location: 'tech-office', x: 350, y: 350, sprite: 'npc_hr' },
  jordan: { npcId: 'jordan', name: 'Jordan', location: 'downtown', x: 500, y: 200, sprite: 'npc_peer' },
  family: { npcId: 'family', name: 'Family', location: 'home', x: 250, y: 300, sprite: 'npc_family' },
};

export class InterviewScene extends Phaser.Scene {
  private npcId: string = '';
  private returnScene: string = '';
  private gameState: any = {};
  private questionPanel: QuestionPanel | null = null;
  private currentQuestion: number = 0;
  private score: number = 0;

  private questions = [
    {
      id: 'q1',
      text: 'What is the time complexity of binary search?',
      answers: [
        { text: 'O(n)', value: 10 },
        { text: 'O(log n)', value: 100 },
        { text: 'O(n log n)', value: 20 },
        { text: 'O(1)', value: 5 },
      ],
    },
    {
      id: 'q2',
      text: 'Explain the concept of memoization.',
      answers: [
        { text: 'Caching results to avoid recomputation', value: 100 },
        { text: 'A type of algorithm', value: 50 },
        { text: 'Memory management technique', value: 30 },
        { text: 'Not sure', value: 0 },
      ],
    },
    {
      id: 'q3',
      text: 'What is a callback function?',
      answers: [
        { text: 'Function passed as argument to another function', value: 100 },
        { text: 'A function that returns another function', value: 40 },
        { text: 'A function in callback.js', value: 10 },
        { text: 'No idea', value: 0 },
      ],
    },
  ];

  constructor() {
    super('InterviewScene');
  }

  init(data: any) {
    this.npcId = data.npcId;
    this.returnScene = data.returnScene || 'TechOfficeScene';
    this.gameState = data.gameState || {};
  }

  create() {
    this.createBackground();
    this.questionPanel = new QuestionPanel(this, DIALOGUE_UI_CONFIG);
    this.showQuestion();
  }

  private createBackground() {
    // Interview room background
    const graphics = this.make.graphics({ x: 0, y: 0, add: true });
    graphics.fillStyle(0x4a5a6a);
    graphics.fillRect(0, 0, 1024, 768);
    graphics.setDepth(UI_LAYERS.world);

    // Title
    this.add
      .text(512, 50, '💼 Technical Interview', {
        fontSize: '28px',
        color: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(UI_LAYERS.hud);

    // Progress
    const progress = `Question ${this.currentQuestion + 1}/${this.questions.length}`;
    this.add
      .text(512, 100, progress, {
        fontSize: '16px',
        color: '#16c784',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5)
      .setDepth(UI_LAYERS.hud);
  }

  private showQuestion() {
    if (this.currentQuestion >= this.questions.length) {
      this.finishInterview();
      return;
    }

    const q = this.questions[this.currentQuestion];
    if (!this.questionPanel) return;

    this.questionPanel.show(q.text, q.answers, (answerValue) => {
      this.score += answerValue;
      this.currentQuestion += 1;
      this.showQuestion();
    });
  }

  private finishInterview() {
    const maxScore = this.questions.length * 100;
    const percentage = Math.floor((this.score / maxScore) * 100);

    // Determine pass/fail and update stats
    const passed = percentage >= 60;
    const statBonus = passed ? Math.floor(percentage / 10) : -10;

    this.gameState.stats = this.gameState.stats || {};
    this.gameState.stats.confidence = Math.min(100, (this.gameState.stats.confidence || 50) + statBonus);
    this.gameState.stats.technical_depth = Math.min(100, (this.gameState.stats.technical_depth || 50) + statBonus);

    // Show results
    this.showResults(percentage, passed);

    // Return after 3 seconds
    this.time.delayedCall(3000, () => {
      this.returnToLocation();
    });
  }

  private showResults(percentage: number, passed: boolean) {
    const resultText = passed ? '✅ PASSED' : '❌ FAILED';
    const color = passed ? '#16c784' : '#ff6b6b';

    this.add
      .text(512, 350, resultText, {
        fontSize: '48px',
        color: color,
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(UI_LAYERS.modal);

    this.add
      .text(512, 420, `Score: ${percentage}%`, {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5)
      .setDepth(UI_LAYERS.modal);
  }

  private returnToLocation() {
    console.log(`✨ Interview finished, returning to ${this.returnScene}`);
    this.scene.stop('InterviewScene');
    this.scene.resume(this.returnScene);
  }
}

/**
 * Panel for displaying interview questions
 */
class QuestionPanel {
  private scene: Phaser.Scene;
  private config: any;
  private panel!: Phaser.GameObjects.Rectangle;
  private questionText!: Phaser.GameObjects.Text;
  private answerButtons: Array<{ bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }> = [];

  constructor(scene: Phaser.Scene, config: any) {
    this.scene = scene;
    this.config = config;
    this.createPanel();
  }

  private createPanel() {
    // Background
    this.panel = this.scene.add.rectangle(512, 400, 900, 350, 0x2a2a4a);
    this.panel.setStrokeStyle(3, 0x16c784);
    this.panel.setDepth(UI_LAYERS.modal);
    this.panel.setVisible(false);

    // Question text
    this.questionText = this.scene.add.text(512, 250, '', {
      fontSize: '18px',
      color: '#ffffff',
      wordWrap: { width: 800 },
      fontFamily: 'Arial',
      align: 'center',
    });
    this.questionText.setOrigin(0.5);
    this.questionText.setDepth(UI_LAYERS.modal);
    this.questionText.setVisible(false);
  }

  show(
    question: string,
    answers: Array<{ text: string; value: number }>,
    onAnswer: (value: number) => void
  ) {
    this.questionText.setText(question);
    this.questionText.setVisible(true);
    this.panel.setVisible(true);

    // Create answer buttons
    let yOffset = 320;
    answers.forEach((answer) => {
      const bgRect = this.scene.add.rectangle(512, yOffset, 800, 40, 0x16c784);
      bgRect.setInteractive();
      bgRect.setDepth(UI_LAYERS.modal);

      const text = this.scene.add.text(512, yOffset, answer.text, {
        fontSize: '14px',
        color: '#000000',
        wordWrap: { width: 750 },
        fontFamily: 'Arial',
      });
      text.setOrigin(0.5);
      text.setDepth(UI_LAYERS.modal);

      bgRect.on('pointerdown', () => {
        this.hide();
        onAnswer(answer.value);
      });

      this.answerButtons.push({ bg: bgRect, text });
      yOffset += 50;
    });
  }

  hide() {
    this.panel.setVisible(false);
    this.questionText.setVisible(false);
    this.answerButtons.forEach(({ bg, text }) => {
      bg.destroy();
      text.destroy();
    });
    this.answerButtons = [];
  }
}
