const SYMBOLS = ["∑", "∫", "π", "√", "∞", "Δ", "θ", "λ", "∂", "∇", "≈", "φ"];

export function FloatingMath() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {SYMBOLS.map((s, i) => {
        const left = (i * 83) % 100;
        const top = (i * 41) % 90;
        const size = 32 + ((i * 13) % 48);
        const delay = (i * 0.7) % 6;
        const duration = 6 + ((i * 1.3) % 5);
        return (
          <span
            key={i}
            className="float-symbol font-bold"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              fontSize: `${size}px`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          >
            {s}
          </span>
        );
      })}
    </div>
  );
}
