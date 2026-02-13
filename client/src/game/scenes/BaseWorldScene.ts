/**
 * BASEWORLDSCENE — Base Phaser Scene for all locations
 *
 * Handles:
 *  - Player movement (WASD)
 *  - NPC placement and positioning
 *  - NPC interaction detection (proximity)
 *  - Dialogue UI rendering
 *  - HUD (stats, time)
 *  - Location transitions
 *
 * Extended by: DowntownScene, LibraryScene, TechOfficeScene, HomeScene, ParkScene
 */

import * as Phaser from 'phaser';
import type { SeedStats } from '@/server/src/engine/stat-seeder';
import { getEffectiveDialogueNode, applyDialogueChoice } from '@/game/systems/DialogueRouter';
import {
  INPUT_CONFIG,
  DIALOGUE_UI_CONFIG,
  HUD_CONFIG,
  NPC_CONFIG,
  UI_LAYERS,
  DEBUG_CONFIG,
} from '@/game/GameConfig';

// Placeholder types and data
interface WorldNPC {
  npcId: string;
  name: string;
  location: string;
  x: number;
  y: number;
  sprite: string;
}

interface NPCRelationship {
  npcId: string;
  trust: number;
}

interface DialogueNode {
  id: string;
  text: string;
  choices: DialogueChoice[];
  conditions?: any[];
}

interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId?: string;
  triggerActivity?: string;
  fx?: any;
  npcEffects?: any;
}

interface ActivityType {
  [key: string]: any;
}

// Placeholder NPC database
const NPC_DATABASE: { [key: string]: WorldNPC } = {
  sarah: { npcId: 'sarah', name: 'Sarah', location: 'downtown', x: 300, y: 300, sprite: 'npc_recruiter' },
  alex: { npcId: 'alex', name: 'Alex', location: 'library', x: 400, y: 250, sprite: 'npc_mentor' },
  casey: { npcId: 'casey', name: 'Casey', location: 'tech-office', x: 350, y: 350, sprite: 'npc_hr' },
  jordan: { npcId: 'jordan', name: 'Jordan', location: 'downtown', x: 500, y: 200, sprite: 'npc_peer' },
  family: { npcId: 'family', name: 'Family', location: 'home', x: 250, y: 300, sprite: 'npc_family' },
};

function initializeNPCRelationships(): { [key: string]: NPCRelationship } {
  const relationships: { [key: string]: NPCRelationship } = {};
  for (const npcId of Object.keys(NPC_DATABASE)) {
    relationships[npcId] = { npcId, trust: 50 };
  }
  return relationships;
}

export interface LocationConfig {
  sceneKey: string;
  displayName: string;
  backgroundColor: number;
  npcIds: string[];
  exits: Array<{
    name: string;
    targetScene: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export class BaseWorldScene extends Phaser.Scene {
  // Location config
  protected locationConfig!: LocationConfig;

  // Player
  protected player!: Phaser.Physics.Arcade.Sprite;
  protected playerKeys: Record<string, Phaser.Input.Keyboard.Key> = {};

  // NPCs
  protected npcs: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
  protected npcNameTags: Map<string, Phaser.GameObjects.Text> = new Map();
  protected nearbyNPC: string | null = null;

  // Game state
  protected gameState = {
    stats: {} as SeedStats,
    npcRelationships: {} as Record<string, NPCRelationship>,
    narrativeFlags: {} as Record<string, boolean>,
    playerTrack: 'analyst' as string,
  };

  // UI
  protected dialoguePanel: DialoguePanel | null = null;
  protected hudPanel: HUDPanel | null = null;
  protected isInDialogue: boolean = false;

  // Time
  protected gameDay: number = 0;
  protected gameHour: number = 8;
  protected gameMinute: number = 0;

  constructor(locationConfig?: LocationConfig) {
    const sceneKey = locationConfig?.sceneKey || 'BaseWorldScene';
    super(sceneKey);
    if (locationConfig) {
      this.locationConfig = locationConfig;
    }
  }

  preload() {
    // Load placeholder assets (would be actual sprites/backgrounds in full implementation)
  }

  create() {
    this.createBackground();
    this.createPlayer();
    this.createNPCs();
    this.createUI();
    this.createInputHandlers();
    this.setupCamera();

    console.log(`✅ Scene created: ${this.locationConfig.displayName}`);
  }

  update(time: number, delta: number) {
    this.updatePlayerMovement(delta);
    this.checkNPCInteractions();
    this.updateGameTime(delta);
    if (this.hudPanel) {
      this.hudPanel.updateStats(this.gameState.stats);
      this.hudPanel.updateTime(this.gameHour);
    }
  }

  // ========================================
  // SCENE SETUP
  // ========================================

  protected createBackground() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: true });
    graphics.fillStyle(this.locationConfig.backgroundColor || 0x1a1a2e);
    graphics.fillRect(0, 0, 1024, 768);
    graphics.setDepth(UI_LAYERS.world);

    // Debug grid
    if (DEBUG_CONFIG.showBounds) {
      graphics.strokeStyle(0x16c784, 0.1);
      for (let i = 0; i < 1024; i += 64) {
        graphics.beginPath();
        graphics.moveTo(i, 0);
        graphics.lineTo(i, 768);
        graphics.strokePath();
      }
      for (let i = 0; i < 768; i += 64) {
        graphics.beginPath();
        graphics.moveTo(0, i);
        graphics.lineTo(1024, i);
        graphics.strokePath();
      }
    }
  }

  protected createPlayer() {
    this.player = this.physics.add.sprite(512, 400, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.1);
    this.player.setDrag(1000);
    this.player.setDepth(UI_LAYERS.player);
    this.player.body.setMaxVelocity(INPUT_CONFIG.moveSpeed, INPUT_CONFIG.moveSpeed);
  }

  protected createNPCs() {
    for (const npcId of this.locationConfig.npcIds) {
      const npcData = NPC_DATABASE[npcId as keyof typeof NPC_DATABASE];
      if (!npcData) continue;

      // Create sprite
      const sprite = this.physics.add.sprite(npcData.x, npcData.y, npcData.avatar);
      sprite.setImmovable(true);
      sprite.setDepth(UI_LAYERS.npcs);
      this.npcs.set(npcId, sprite);

      // Create name tag
      const nameTag = this.add.text(npcData.x, npcData.y - NPC_CONFIG.nameTagOffsetY, npcData.name, {
        fontSize: '14px',
        color: '#16c784',
        fontFamily: 'Arial',
      });
      nameTag.setOrigin(0.5);
      nameTag.setDepth(UI_LAYERS.npcs);
      this.npcNameTags.set(npcId, nameTag);

      // Debug: show interaction radius
      if (DEBUG_CONFIG.showInteractionRadius) {
        const circle = this.make.graphics({ x: npcData.x, y: npcData.y, add: true }, true);
        circle.strokeStyle(0x16c784, 0.3);
        circle.strokeCircleShape(new Phaser.Geom.Circle(0, 0, NPC_CONFIG.interactionRadius));
      }
    }
  }

  protected createUI() {
    this.dialoguePanel = new DialoguePanel(this);
    this.hudPanel = new HUDPanel(this);

    // Location name
    this.add
      .text(512, 20, this.locationConfig.displayName, {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5)
      .setDepth(UI_LAYERS.hud);

    // Interaction prompt
    this.add
      .text(512, 740, 'Press E to interact', {
        fontSize: '12px',
        color: '#888888',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5)
      .setDepth(UI_LAYERS.hud);
  }

  protected createInputHandlers() {
    this.playerKeys = this.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      interact: Phaser.Input.Keyboard.KeyCodes.E,
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    // Add interact key event handler
    this.input.keyboard!.on('keydown-E', () => this.handleInteractKey());
  }

  protected setupCamera() {
    this.cameras.main.setBounds(0, 0, 1024, 768);
    this.cameras.main.startFollow(this.player);
  }

  // ========================================
  // PLAYER MOVEMENT
  // ========================================

  protected updatePlayerMovement(delta: number) {
    this.player.setVelocity(0);

    let isMoving = false;

    if (this.playerKeys.up?.isDown) {
      this.player.setVelocityY(-INPUT_CONFIG.moveSpeed);
      isMoving = true;
    } else if (this.playerKeys.down?.isDown) {
      this.player.setVelocityY(INPUT_CONFIG.moveSpeed);
      isMoving = true;
    }

    if (this.playerKeys.left?.isDown) {
      this.player.setVelocityX(-INPUT_CONFIG.moveSpeed);
      isMoving = true;
    } else if (this.playerKeys.right?.isDown) {
      this.player.setVelocityX(INPUT_CONFIG.moveSpeed);
      isMoving = true;
    }

    // Update animation
    if (isMoving) {
      this.player.play('walk_down', true);
    } else {
      this.player.play('idle_down', true);
    }
  }

  // ========================================
  // NPC INTERACTIONS
  // ========================================

  protected checkNPCInteractions() {
    this.nearbyNPC = null;

    for (const [npcId, npcSprite] of this.npcs) {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        npcSprite.x,
        npcSprite.y
      );

      if (distance < NPC_CONFIG.interactionRadius) {
        this.nearbyNPC = npcId;
        break;
      }
    }
  }

  protected handleInteractKey() {
    if (this.isInDialogue || !this.nearbyNPC) return;
    this.startDialogue(this.nearbyNPC);
  }

  protected startDialogue(npcId: string) {
    if (!this.dialoguePanel) return;

    this.isInDialogue = true;

    const npcDb = NPC_DATABASE[npcId as keyof typeof NPC_DATABASE];
    if (!npcDb) return;

    const tree = npcDb.dialogueTree;
    const rootNode = tree.nodes[tree.rootNodeId];
    if (!rootNode) return;

    const effectiveNode = getEffectiveDialogueNode(rootNode, this.gameState, npcId);

    this.dialoguePanel.show(npcId, effectiveNode, (choiceId: string) => {
      this.handleDialogueChoice(npcId, effectiveNode, choiceId);
    });
  }

  protected handleDialogueChoice(npcId: string, node: any, choiceId: string) {
    const choice = node.choices.find((c: any) => c.id === choiceId);
    if (!choice) return;

    const effects = applyDialogueChoice(choice, this.gameState, npcId);

    // Update stats
    for (const [stat, delta] of Object.entries(effects.statUpdates)) {
      (this.gameState.stats as any)[stat] =
        ((this.gameState.stats as any)[stat] as number) + (delta as number);
    }

    // Update NPC relationship
    if (Object.keys(effects.npcUpdates).length > 0) {
      const npc = this.gameState.npcRelationships[npcId];
      if (npc) {
        Object.assign(npc, effects.npcUpdates);
      }
    }

    // Apply flags
    Object.assign(this.gameState.narrativeFlags, effects.flagUpdates);

    // Activity or next dialogue
    if (effects.triggerActivity) {
      this.startActivity(effects.triggerActivity, npcId);
    } else if (choice.nextNodeId) {
      const npcDb = NPC_DATABASE[npcId as keyof typeof NPC_DATABASE];
      const nextNode = npcDb?.dialogueTree.nodes[choice.nextNodeId];
      if (nextNode) {
        const effectiveNext = getEffectiveDialogueNode(nextNode, this.gameState, npcId);
        if (this.dialoguePanel) {
          this.dialoguePanel.show(npcId, effectiveNext, (nextChoiceId: string) => {
            this.handleDialogueChoice(npcId, effectiveNext, nextChoiceId);
          });
        }
      }
    } else {
      this.onDialogueEnd();
    }
  }

  protected startActivity(activityType: string, npcId: string) {
    const activityScenes: Record<string, string> = {
      interview: 'InterviewScene',
      coffee_chat: 'CoffeeChatScene',
      mentoring: 'MentoringScene',
      networking: 'NetworkingEventScene',
    };

    const sceneKey = activityScenes[activityType];
    if (sceneKey) {
      this.scene.launch(sceneKey, { npcId, returnScene: this.scene.key });
    }
  }

  protected onDialogueEnd() {
    this.isInDialogue = false;
  }

  // ========================================
  // TIME & GAME STATE
  // ========================================

  protected updateGameTime(delta: number) {
    this.gameMinute += delta / 1000 / 60;

    if (this.gameMinute >= 60) {
      this.gameHour += 1;
      this.gameMinute = 0;
    }

    if (this.gameHour >= 24) {
      this.gameDay += 1;
      this.gameHour = 0;
    }
  }

  // ========================================
  // INPUT EVENT HANDLERS
  // ========================================

  protected handleInteractKey() {
    if (this.nearbyNPC && !this.isInDialogue) {
      this.isInDialogue = true;
      // Trigger NPC dialogue
      console.log(`💬 Interacting with NPC: ${this.nearbyNPC}`);
    }
  }
}

export class DialoguePanel {
  protected panel: Phaser.GameObjects.Container;
  protected currentNPC: WorldNPC | null = null;
  protected currentNode: DialogueNode | null = null;
  
  onDialogueEnd: (() => void) | null = null;
  
  constructor(protected scene: Phaser.Scene) {
    this.panel = scene.add.container(512, 384);
    this.panel.setVisible(false);
  }
  
  startDialogue(npc: WorldNPC, initialNode: DialogueNode) {
    this.currentNPC = npc;
    this.showDialogueNode(initialNode);
  }
  
  protected showDialogueNode(node: DialogueNode) {
    // Check conditions
    const gameState = useGameStore();
    if (node.conditions) {
      const conditionsMet = node.conditions.every(c =>
        evaluateCondition(c, gameState.stats, gameState.narrativeContext)
      );
      
      if (!conditionsMet) {
        this.endDialogue();
        return;
      }
    }
    
    this.currentNode = node;
    
    // Clear previous
    this.panel.removeAll(true);
    
    // Background
    const bg = this.scene.add.rectangle(0, 0, 800, 200, 0x000000, 0.8);
    bg.setOrigin(0.5);
    this.panel.add(bg);
    
    // NPC name + emotion
    const nameText = this.scene.add.text(-300, -70, `${this.currentNPC?.name}`, {
      fontSize: '24px',
      color: '#ffffff'
    });
    this.panel.add(nameText);
    
    // Dialogue text
    const dialogueText = this.scene.add.text(-300, -30, node.text, {
      fontSize: '16px',
      color: '#ffffff',
      wordWrap: { width: 600 }
    });
    this.panel.add(dialogueText);
    
    // Choice buttons
    node.choices.forEach((choice, index) => {
      const button = this.createChoiceButton(choice, index);
      this.panel.add(button);
    });
    
    this.panel.setVisible(true);
  }
  
  protected createChoiceButton(choice: DialogueChoice, index: number) {
    const container = this.scene.add.container(0, 80 + index * 40);
    
    const bg = this.scene.add.rectangle(0, 0, 600, 35, 0x1111ff, 0.7);
    bg.setInteractive();
    bg.on('pointerdown', () => this.selectChoice(choice));
    
    const text = this.scene.add.text(0, 0, choice.text, {
      fontSize: '14px',
      color: '#ffffff'
    });
    text.setOrigin(0.5);
    
    container.add(bg);
    container.add(text);
    
    return container;
  }
  
  protected selectChoice(choice: DialogueChoice) {
    const gameState = useGameStore();
    
    // Apply stat effects
    if (choice.fx) {
      // Update player stats in store
    }
    
    // Apply NPC effects
    if (choice.npcEffects && this.currentNPC) {
      gameState.updateNPCRelation(
        this.currentNPC.npcId,
        (npc) => updateNPCTrust(npc, choice.npcEffects.trust)
      );
    }
    
    // Record choice in narrative history
    gameState.recordChoice(`dialogue_${this.currentNPC?.npcId}`, choice.id);
    
    // Trigger activity if specified
    if (choice.triggerActivity) {
      this.startActivity(choice.triggerActivity, this.currentNPC!);
    }
    
    // Go to next node or end
    if (choice.nextNodeId) {
      const nextNode = this.findDialogueNode(choice.nextNodeId);
      if (nextNode) {
        this.showDialogueNode(nextNode);
      } else {
        this.endDialogue();
      }
    } else {
      this.endDialogue();
    }
  }
  
  protected findDialogueNode(nodeId: string): DialogueNode | null {
    // Search through NPC's dialogue tree
    // (simplified - would be recursive in real implementation)
    return null;
  }
  
  protected startActivity(activity: ActivityType, npc: WorldNPC) {
    console.log(`Starting ${activity} with ${npc.name}`);
    // Launch activity scene
  }
  
  protected endDialogue() {
    this.panel.setVisible(false);
    this.onDialogueEnd?.();
  }
}

// ============================================================
// FILE 3: HUDPanel.tsx — Heads-up display
// ============================================================

export class HUDPanel {
  protected statsDisplay: Phaser.GameObjects.Text;
  protected timeDisplay: Phaser.GameObjects.Text;
  
  constructor(protected scene: Phaser.Scene) {
    // Top-left stats
    this.statsDisplay = scene.add.text(10, 10, '', {
      fontSize: '12px',
      color: '#00ff00',
      fontFamily: 'monospace'
    });
    
    // Top-right time
    this.timeDisplay = scene.add.text(900, 10, '', {
      fontSize: '14px',
      color: '#ffffff'
    });
  }
  
  updateStats(stats: any) {
    const text = `
ENERGY: ${stats.energy}/100
STRESS: ${stats.stress}/100
CONFIDENCE: ${stats.confidence}%
SAVINGS: $${stats.savings}
    `.trim();
    
    this.statsDisplay.setText(text);
  }
  
  updateTime(hour: number) {
    const ampm = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour % 12 || 12;
    this.timeDisplay.setText(`${displayHour}:00 ${ampm}`);
  }
}
