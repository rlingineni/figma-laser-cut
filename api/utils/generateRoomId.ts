const ADJECTIVES = [
  "amber", "azure", "bold", "brave", "bright", "calm", "crisp", "cyan",
  "dark", "dawn", "dusty", "electric", "ember", "fresh", "frosted", "golden",
  "green", "indigo", "jade", "lemon", "lime", "magenta", "mellow", "mint",
  "misty", "navy", "neon", "obsidian", "olive", "opal", "orange", "pink",
  "plum", "purple", "red", "rose", "ruby", "russet", "sage", "scarlet",
  "silver", "slate", "smoky", "soft", "steel", "storm", "sunny", "teal",
  "violet", "warm",
];

const NOUNS = [
  "apple", "arrow", "beacon", "berry", "birch", "bloom", "brook", "canyon",
  "cedar", "cloud", "comet", "coral", "creek", "crystal", "dawn", "delta",
  "dune", "dust", "echo", "fern", "field", "flare", "flame", "fog",
  "forest", "frost", "gale", "glacier", "grove", "harbor", "iris", "island",
  "jasper", "lake", "lark", "leaf", "mesa", "moon", "moss", "ocean",
  "pebble", "pine", "prism", "quartz", "rain", "reed", "ridge", "river",
  "rock", "rose", "sand", "shore", "sky", "slate", "snow", "star",
  "stone", "storm", "stream", "tide", "timber", "torch", "trail", "vapor",
  "wave", "willow", "wind", "wood",
];

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateRoomId(): string {
  return `${pick(ADJECTIVES)}-${pick(ADJECTIVES)}-${pick(NOUNS)}`;
}
