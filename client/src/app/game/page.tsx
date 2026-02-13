"use client";

import dynamic from "next/dynamic";

const Game2D = dynamic(() => import("@/components/Game2D").then(mod => ({ default: mod.Game2D })), {
  ssr: false,
  loading: () => <div style={{ width: "100vw", height: "100vh", background: "#0a0e27", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>Loading game...</div>
});

export default function GamePage() {
  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0, padding: 0, overflow: "hidden" }}>
      <Game2D />
    </div>
  );
}
