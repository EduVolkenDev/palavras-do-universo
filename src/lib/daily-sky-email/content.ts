import { calculatePlanetPositionsAt, type NatalBody, type ZodiacSign } from "@/lib/astrology/natal-chart";

export type SkyEmailLocale = "pt-BR" | "en";

const names: Record<NatalBody, [string, string]> = {
  Sun: ["Sol", "Sun"], Moon: ["Lua", "Moon"], Mercury: ["Mercúrio", "Mercury"],
  Venus: ["Vênus", "Venus"], Mars: ["Marte", "Mars"], Jupiter: ["Júpiter", "Jupiter"],
  Saturn: ["Saturno", "Saturn"], Uranus: ["Urano", "Uranus"],
  Neptune: ["Netuno", "Neptune"], Pluto: ["Plutão", "Pluto"],
};

const signNames: Record<ZodiacSign, [string, string]> = {
  aries: ["Áries", "Aries"], taurus: ["Touro", "Taurus"], gemini: ["Gêmeos", "Gemini"],
  cancer: ["Câncer", "Cancer"], leo: ["Leão", "Leo"], virgo: ["Virgem", "Virgo"],
  libra: ["Libra", "Libra"], scorpio: ["Escorpião", "Scorpio"],
  sagittarius: ["Sagitário", "Sagittarius"], capricorn: ["Capricórnio", "Capricorn"],
  aquarius: ["Aquário", "Aquarius"], pisces: ["Peixes", "Pisces"],
};

const angles = [
  { angle: 0, label: ["em conjunção com", "conjunct"] as const, meaning: ["dois temas se encontram e pedem atenção ao mesmo tempo", "two themes meet and ask for attention at once"] as const },
  { angle: 60, label: ["em sextil com", "sextile"] as const, meaning: ["há uma oportunidade de cooperação, se você escolher agir", "there is room for cooperation if you choose to act"] as const },
  { angle: 90, label: ["em quadratura com", "square"] as const, meaning: ["a tensão entre esses temas pode revelar uma escolha que merece cuidado", "tension between these themes may reveal a choice worth approaching with care"] as const },
  { angle: 120, label: ["em trígono com", "trine"] as const, meaning: ["os temas conversam com mais fluidez, sem dispensar intenção", "these themes may flow more easily, though intention still matters"] as const },
  { angle: 180, label: ["em oposição a", "opposite"] as const, meaning: ["os dois lados da experiência pedem equilíbrio, não uma resposta imediata", "both sides of the experience ask for balance, not an instant answer"] as const },
];

const themes: Record<NatalBody, [string, string]> = {
  Sun: ["identidade e direção", "identity and direction"], Moon: ["necessidades e humor", "needs and mood"],
  Mercury: ["pensamento e conversa", "thinking and conversation"], Venus: ["afeto e valores", "affection and values"],
  Mars: ["energia e iniciativa", "energy and initiative"], Jupiter: ["expansão e perspectiva", "growth and perspective"],
  Saturn: ["limites e compromisso", "boundaries and commitment"], Uranus: ["mudança e liberdade", "change and freedom"],
  Neptune: ["imaginação e sensibilidade", "imagination and sensitivity"], Pluto: ["transformação e profundidade", "change and depth"],
};

function gap(a: number, b: number) {
  const delta = Math.abs(a - b) % 360;
  return Math.min(delta, 360 - delta);
}

export function dailySkyStory(date: Date, locale: SkyEmailLocale) {
  if (Number.isNaN(date.getTime())) throw new Error("Invalid sky date");
  const en = locale === "en";
  const index = en ? 1 : 0;
  const positions = calculatePlanetPositionsAt(date);
  const candidates = [] as Array<{ first: NatalBody; second: NatalBody; angle: (typeof angles)[number]; orb: number }>;
  const featured: NatalBody[] = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const first = positions[i];
      const second = positions[j];
      if (!featured.includes(first.body) || !featured.includes(second.body)) continue;
      const distance = gap(first.longitude, second.longitude);
      for (const angle of angles) {
        const orb = Math.abs(distance - angle.angle);
        if (orb <= 1.5) candidates.push({ first: first.body, second: second.body, angle, orb });
      }
    }
  }
  candidates.sort((a, b) => a.orb - b.orb);
  const aspect = candidates[0];
  if (aspect) {
    const first = names[aspect.first][index];
    const second = names[aspect.second][index];
    const subject = en
      ? `${first} ${aspect.angle.label[index]} ${second} in today's sky`
      : `${first} ${aspect.angle.label[index]} ${second} no céu de hoje`;
    const observation = en
      ? `In a snapshot of today's sky, ${first} is approximately ${aspect.angle.angle}° from ${second}. In symbolic astrology, ${aspect.angle.meaning[index]}.`
      : `Em um retrato do céu de hoje, ${first} está a cerca de ${aspect.angle.angle}° de ${second}. Na linguagem simbólica da astrologia, ${aspect.angle.meaning[index]}.`;
    const reflection = en
      ? `Where might “${themes[aspect.first][index]}” meet “${themes[aspect.second][index]}” in your day? What small choice would make space for both?`
      : `Onde “${themes[aspect.first][index]}” encontra “${themes[aspect.second][index]}” no seu dia? Que pequena escolha daria espaço aos dois?`;
    return { subject, observation, reflection };
  }
  const moon = positions.find((position) => position.body === "Moon");
  if (!moon) throw new Error("Moon position unavailable");
  const sign = signNames[moon.sign][index];
  return en
    ? {
        subject: `The Moon in ${sign}: a moment in today's sky`,
        observation: `In a snapshot of today's sky, the Moon is in ${sign}. It moves through the zodiac quickly, so this is a moment in the sky, not a statement about your personality or future.`,
        reflection: "What does your day need more of: room to feel, or room to pause?",
      }
    : {
        subject: `Lua em ${sign}: um momento do céu de hoje`,
        observation: `Em um retrato do céu de hoje, a Lua está em ${sign}. Ela percorre o zodíaco rapidamente: é um momento do céu, não uma afirmação sobre a sua personalidade ou o seu futuro.`,
        reflection: "De que o seu dia precisa mais: espaço para sentir ou espaço para pausar?",
      };
}
