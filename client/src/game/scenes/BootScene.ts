/**
 * BOOTSCENE — Game Initialization
 *
 * Handles:
 * - Load player profile
 * - Initialize game state with seeded stats
 * - Create procedural placeholder assets
 * - Start first location (Downtown)
 */

import * as Phaser from 'phaser';

// Simple placeholder - in full app, would call server API
const seedStats = (profile: any) => ({
  confidence: 50,
  stress: 30,
  savings: 5000,
  reputation: 10,
  network: 5,
  resume_strength: 40,
  portfolio_strength: 0,
  interview_skill: 35,
  technical_depth: 50,
  sql_skill: 40,
  python_skill: 60,
  scam_awareness: 50,
});

const initializeNPCRelationships = () => ({}); 

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Load any external assets here if needed
  }

  create() {
    console.log('🎮 Boot Scene - Initializing Career Simulator...');

    // Create placeholder assets programmatically
    this.createProceduralAssets();

    // Initialize player profile with sensible defaults
    // In full implementation, this would come from player input UI
    const playerProfile = {
      track: 'engineer' as const,
      background: 'bootcamp',
      financialSituation: 'moderate' as const,
      trackRating: 3,
      backgroundRating: 3,
      financialRating: 3,
    };

    // Seed initial stats based on profile
    const stats = seedStats(playerProfile);
    console.log('✅ Player stats seeded:', {
      confidence: stats.confidence,
      stress: stats.stress,
      savings: stats.savings,
    });

    // Initialize NPC relationships (baseline)
    const npcRelationships = initializeNPCRelationships();
    console.log('✅ NPC relationships initialized');

    // Initialize narrative flags
    const narrativeFlags = {
      has_mentor: false,
      has_portfolio: false,
      owns_car: false,
      active_job_search: true,
      bootcamp_completed: true,
    };

    // Store game state globally (will be replaced with Zustand store)
    // This allows scenes to access state until full store integration
    (window as any).gameState = {
      stats,
      npcRelationships,
      narrativeFlags,
      playerTrack: playerProfile.track,
    };

    console.log('✅ Game initialization complete. Starting Downtown...');

    // Start the first location (Downtown)
    this.scene.start('DowntownScene');
  }

  /**
   * Create placeholder assets using Phaser graphics
   * These will be replaced with proper sprite sheets in full implementation
   */
  private createProceduralAssets() {
    // Player sprite
    const playerGraphics = this.make.graphics({ x: 0, y: 0 }, false);
    playerGraphics.fillStyle(0x0984e3, 1);
    playerGraphics.fillCircle(16, 16, 14);
    playerGraphics.fillStyle(0xff9999, 1);
    playerGraphics.fillCircle(16, 8, 8);
    playerGraphics.generateTexture('player', 32, 32);
    playerGraphics.destroy();

    // NPC sprites
    const npcGraphics = this.make.graphics({ x: 0, y: 0 }, false);
    npcGraphics.fillStyle(0xffd700, 1);
    npcGraphics.fillCircle(16, 16, 14);
    npcGraphics.generateTexture('npc', 32, 32);
    npcGraphics.destroy();

    console.log('✅ Placeholder assets created');
  }
}
