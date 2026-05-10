// components/tracfin/AmbientOrbs.tsx — orbes flottants animés en fond

export default function AmbientOrbs() {
  return (
    <>
      <style>{`
        @keyframes orbDrift1 { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(40px,25px) scale(1.08); } }
        @keyframes orbDrift2 { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(-30px,20px) scale(1.05); } }
        @keyframes orbDrift3 { 0% { transform: translate(-50%,-50%) scale(1); } 100% { transform: translate(-50%,-50%) translate(25px,35px) scale(1.06); } }
      `}</style>

      <div
        className="fixed pointer-events-none rounded-full"
        style={{
          width: 650, height: 650, top: -180, left: -120, zIndex: 0, filter: "blur(90px)",
          background: "radial-gradient(circle, rgba(99,102,241,0.28) 0%, transparent 70%)",
          animation: "orbDrift1 14s ease-in-out infinite alternate",
        }}
      />
      <div
        className="fixed pointer-events-none rounded-full"
        style={{
          width: 550, height: 550, bottom: -120, right: -100, zIndex: 0, filter: "blur(90px)",
          background: "radial-gradient(circle, rgba(6,182,212,0.22) 0%, transparent 70%)",
          animation: "orbDrift2 17s ease-in-out infinite alternate",
        }}
      />
      <div
        className="fixed pointer-events-none rounded-full"
        style={{
          width: 420, height: 420, top: "35%", left: "45%", zIndex: 0, filter: "blur(90px)",
          background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)",
          animation: "orbDrift3 20s ease-in-out infinite alternate",
        }}
      />
    </>
  );
}