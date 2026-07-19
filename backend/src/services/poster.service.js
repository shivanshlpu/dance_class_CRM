const Poster = require('../models/Poster');

/**
 * Get a random poster for a specific category,
 * avoiding recently used ones until all are exhausted.
 * @param {string} category 
 * @returns {string|null} - imageUrl or null if no posters found
 */
const getRandomPoster = async (category) => {
  try {
    // 1. Find all active posters in this category
    const activePosters = await Poster.find({ category, isActive: true });
    
    if (activePosters.length === 0) {
      return null; // No posters for this category
    }

    // 2. Sort by lastUsedAt (ascending) and useCount (ascending)
    // This gives us the least recently used poster.
    activePosters.sort((a, b) => {
      // If one was never used, prioritize it
      if (!a.lastUsedAt && b.lastUsedAt) return -1;
      if (a.lastUsedAt && !b.lastUsedAt) return 1;
      
      // Both used: compare lastUsedAt
      if (a.lastUsedAt && b.lastUsedAt) {
          if (a.lastUsedAt.getTime() !== b.lastUsedAt.getTime()) {
              return a.lastUsedAt.getTime() - b.lastUsedAt.getTime();
          }
      }
      
      // If still tied, use count
      return a.useCount - b.useCount;
    });

    // Select the first one (least recently used)
    const selectedPoster = activePosters[0];

    // 3. Randomize slightly if multiple posters have the same lowest usage? 
    // Not strictly necessary, strictly LRU is usually fine for "random without repeats".

    // 4. Update lastUsedAt and useCount
    selectedPoster.lastUsedAt = new Date();
    selectedPoster.useCount += 1;
    await selectedPoster.save();

    return selectedPoster.imageUrl;
  } catch (error) {
    console.error('Error fetching random poster:', error);
    return null;
  }
};

module.exports = {
  getRandomPoster
};
