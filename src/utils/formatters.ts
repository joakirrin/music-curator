// FILE: src/utils/formatters.ts (MODIFIED)

/**
 * Formats playlist description with Fonea branding
 * As specified in Task 4.5.2
 *
 * UPDATED: Now formats to a SINGLE LINE to avoid Spotify API 400 errors.
 *
 * @param userDescription - User's custom description (optional)
 * @returns Formatted description with branding
 */
export function formatPlaylistDescription(userDescription?: string): string {
  
  // UPDATED: Branding is now on one line, separated by '•'
  const branding = `Made with Fonea Sound Curator 🎵 • curator.fonea.app`;

  if (!userDescription || userDescription.trim() === '') {
    return branding;
  }

  // NEW: Force the user's description to a single line by replacing newlines
  const singleLineDescription = userDescription.trim().replace(/(\r\n|\n|\r)/gm, ' ');

  // UPDATED: Separator is now '---' on the same line
  return `${singleLineDescription} --- ${branding}`;
}