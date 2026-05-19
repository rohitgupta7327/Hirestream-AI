// src/utils/rankingUtils.js

export function processRanking(prevResults, newData) {
  // Normalize backend response
  const normalized = newData.map((c) => ({
    name: c.name ?? c.Name ?? "Unknown",
    email: c.email ?? c.Email ?? "N/A",
    matchPercentage: c.matchPercentage ?? c.MatchPercentage ?? 0,
    skills: c.skills ?? c.Skills ?? [],
    missingSkills: c.missingSkills ?? c.MissingSkills ?? [],
    reason: c.reason ?? c.Reason ?? "",
  }));

  // Merge old + new
  const merged = [...prevResults, ...normalized];

  // Remove duplicates (based on name)
  const unique = merged.filter(
    (v, i, arr) => i === arr.findIndex((x) => x.name === v.name)
  );

  // Sort by match %
  const sorted = unique.sort((a, b) => b.matchPercentage - a.matchPercentage);

  // Calculate rank changes
  const rankChanges = {};

  sorted.forEach((candidate, newIndex) => {
    const oldIndex = prevResults.findIndex((c) => c.name === candidate.name);

    if (oldIndex === -1) {
      rankChanges[candidate.name] = "new";
    } else if (newIndex < oldIndex) {
      rankChanges[candidate.name] = "up";
    } else if (newIndex > oldIndex) {
      rankChanges[candidate.name] = "down";
    } else {
      rankChanges[candidate.name] = "same";
    }
  });

  return { sorted, rankChanges };
}