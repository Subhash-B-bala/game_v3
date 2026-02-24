import { Billboard, Text } from '@react-three/drei';

interface SpeechBubbleProps {
  text: string;
  position?: [number, number, number];
  maxWidth?: number;
}

/**
 * Speech bubble that floats above NPCs
 * Always faces the camera using Billboard
 * White background with tail pointer
 */
export default function SpeechBubble({
  text,
  position = [0, 2.5, 0],
  maxWidth = 4,
}: SpeechBubbleProps) {
  // Calculate bubble width based on text length (rough estimate)
  const bubbleWidth = Math.min(Math.max(text.length * 0.08, 2), maxWidth);
  const bubbleHeight = 0.6;

  return (
    <Billboard position={position} follow={true} lockX={false} lockY={false} lockZ={false}>
      <group>
        {/* Background plane */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[bubbleWidth, bubbleHeight]} />
          <meshBasicMaterial color="#ffffff" opacity={0.95} transparent />
        </mesh>

        {/* Text content */}
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.12}
          color="#000000"
          maxWidth={bubbleWidth - 0.2}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
        >
          {text}
        </Text>

        {/* Tail pointer (triangle pointing down to NPC) */}
        <mesh position={[0, -bubbleHeight / 2 - 0.05, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.15, 0.2, 3]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
    </Billboard>
  );
}
