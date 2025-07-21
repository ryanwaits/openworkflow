export interface ReleaseFormatProfile {
  structure: {
    sections: {
      emoji: string;
      title: string;
      keywords: string[];
      priority: number;
    }[];
    includeContributors: boolean;
    includeCommitHash: boolean;
    groupByType: boolean;
  };
  style: {
    versionFormat: "vX.Y.Z" | "X.Y.Z";
    commitFormat: "title-only" | "title-with-pr" | "title-pr-hash";
    prReferenceFormat: "(#123)" | "#123";
    listStyle: "bullet" | "dash";
    headerLevel: number;
  };
  tone: {
    formality: "formal" | "casual" | "technical";
    detail: "minimal" | "moderate" | "comprehensive";
    highlightSection?: string;
  };
}

export interface PRFormatProfile {
  structure: {
    titleFormat: string; // e.g., "{type}: {summary}"
    types: string[]; // ["chore", "feat", "fix", "docs", "refactor", "test", "style", "perf"]
    includeHeaders: boolean;
    sections?: string[]; // Optional sections like "Changes", "Testing", "Notes"
  };
  style: {
    listStyle: "bullet" | "dash" | "none";
    maxTitleLength: number;
    descriptionStyle: "brief" | "detailed";
  };
  tone: {
    formality: "casual" | "professional";
    technicalLevel: "low" | "medium" | "high";
  };
}

export const defaultReleaseProfile: ReleaseFormatProfile = {
  structure: {
    sections: [
      { emoji: "✨", title: "Features", keywords: ["feat", "feature", "add", "new"], priority: 1 },
      { emoji: "🪲", title: "Bug Fixes", keywords: ["fix", "bug", "resolve", "patch"], priority: 2 },
      { emoji: "⚡", title: "Performance", keywords: ["perf", "performance", "optimize", "speed"], priority: 3 },
      { emoji: "🔁", title: "Refactor", keywords: ["refactor", "restructure", "cleanup"], priority: 4 },
      { emoji: "🧹", title: "Chores", keywords: ["chore", "maintenance", "deps", "dependencies"], priority: 5 },
      { emoji: "📚", title: "Documentation", keywords: ["docs", "documentation", "readme"], priority: 6 },
      { emoji: "🔧", title: "CI/CD", keywords: ["ci", "cd", "pipeline", "workflow", "action"], priority: 7 }
    ],
    includeContributors: true,
    includeCommitHash: true,
    groupByType: true
  },
  style: {
    versionFormat: "vX.Y.Z",
    commitFormat: "title-pr-hash",
    prReferenceFormat: "(#123)",
    listStyle: "bullet",
    headerLevel: 2
  },
  tone: {
    formality: "technical",
    detail: "moderate",
    highlightSection: "Features"
  }
};

export const defaultPRProfile: PRFormatProfile = {
  structure: {
    titleFormat: "{type}: {summary}",
    types: ["chore", "feat", "fix", "docs", "refactor", "test", "style", "perf"],
    includeHeaders: false
  },
  style: {
    listStyle: "bullet",
    maxTitleLength: 50,
    descriptionStyle: "brief"
  },
  tone: {
    formality: "casual",
    technicalLevel: "medium"
  }
};

// Minimal PR profile for simple PRs
export const minimalPRProfile: PRFormatProfile = {
  structure: {
    titleFormat: "{type}: {summary}",
    types: ["chore", "feat", "fix"],
    includeHeaders: false
  },
  style: {
    listStyle: "none",
    maxTitleLength: 60,
    descriptionStyle: "brief"
  },
  tone: {
    formality: "casual",
    technicalLevel: "low"
  }
};