export type SearchItemType = "blog" | "project";

export interface SearchItem {
  id: string;

  type: SearchItemType;

  title: string;

  description: string;

  href: string;

  keywords: string[];
}

export interface SearchResult extends SearchItem {
  score: number;
}

export function normalizeSearchText(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("zh-CN");
}

export function tokenizeSearchQuery(query: string): string[] {
  const normalized = normalizeSearchText(query);

  if (!normalized) {
    return [];
  }

  return normalized.split(/\s+/).filter(Boolean);
}

export function scoreSearchItem(item: SearchItem, terms: string[]): number {
  if (terms.length === 0) {
    return 0;
  }

  const title = normalizeSearchText(item.title);

  const description = normalizeSearchText(item.description);

  const keywords = item.keywords.map(normalizeSearchText);

  let score = 0;

  for (const term of terms) {
    let termScore = 0;

    if (title.includes(term)) {
      termScore += 5;
    }

    if (keywords.some((keyword) => keyword.includes(term))) {
      termScore += 3;
    }

    if (description.includes(term)) {
      termScore += 1;
    }

    if (termScore === 0) {
      return 0;
    }

    score += termScore;
  }

  return score;
}

export function searchItems(
  items: SearchItem[],
  query: string,
): SearchResult[] {
  const terms = tokenizeSearchQuery(query);

  if (terms.length === 0) {
    return [];
  }

  const normalizedQuery = normalizeSearchText(query);

  return items
    .map((item) => {
      let score = scoreSearchItem(item, terms);

      if (normalizeSearchText(item.title) === normalizedQuery) {
        score += 10;
      }

      return {
        ...item,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.title.localeCompare(b.title, "zh-CN");
    });
}
