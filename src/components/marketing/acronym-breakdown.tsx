const LETTERS = [
  { letter: "T", word: "Tribal" },
  { letter: "R", word: "Rights" },
  { letter: "I", word: "Intelligent" },
  { letter: "N", word: "Network" },
  { letter: "E", word: "Empowerment" },
  { letter: "T", word: "Technology" },
  { letter: "R", word: "Research" },
  { letter: "A", word: "Analysis" },
];

export function AcronymBreakdown() {
  return (
    <section className="border-b border-line bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <p className="text-center font-mono text-xs uppercase tracking-wider text-clay">
          What TRINETRA stands for
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-x-2 gap-y-6 sm:gap-x-3">
          {LETTERS.map((item, i) => (
            <div key={i} className="flex w-[76px] flex-col items-center sm:w-[92px]">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-forest font-display text-xl text-paper-raised sm:h-14 sm:w-14 sm:text-2xl">
                {item.letter}
              </span>
              <span className="mt-2 text-center font-mono text-[10px] uppercase leading-tight tracking-wider text-ink-soft sm:text-xs">
                {item.word}
              </span>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-xl text-center text-sm text-ink-soft">
          <span className="text-ink">T</span>ribal{" "}
          <span className="text-ink">R</span>ights{" "}
          <span className="text-ink">I</span>ntelligent{" "}
          <span className="text-ink">N</span>etwork for{" "}
          <span className="text-ink">E</span>mpowerment through{" "}
          <span className="text-ink">T</span>echnology,{" "}
          <span className="text-ink">R</span>esearch and{" "}
          <span className="text-ink">A</span>nalysis
        </p>
      </div>
    </section>
  );
}
