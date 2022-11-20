/**
 * Utility code relating to patterns
 */

// Style color codes that will be applied to our notes
const highlight_pattern_map = {
  /*
      " " : empty/space
      "." : empty/dot
      "n" : generic note
      "m" : special note
      "i" : generic instrument
      "u" : generic volume column effect
      "v" : generic volume column parameter
      "e" : generic effect column effect
      "f" : generic effect column parameter
  */
  // Colour-scheme mostly taken from OpenMPT's Blue (FT2) theme. (It doesn't line up 1:1)
  ' ': '',
  '.': 'rgb(224,224,64)',
  'n': 'rgb(224,224,64)',
  'm': 'rgb(224,224,64)',
  'i': 'rgb(255,255,0)',
  'u': 'rgb(0,255,0)',
  'v': 'rgb(0,255,0)',
  'e': 'rgb(0,255,255)',
  'f': 'rgb(0,255,255)',
}

/**
 * Returns a colourfully formatted pattern
 *
 * Rolls up same colour characters, to prevent excessive amounts of spans.
 * @param pattern[]
 * @param highlight[]
 * @returns {string}
 */
export const process_highlight = (pattern, highlight) => {
  let highlighted_pattern = [];

  let val = [];
  let prev_rgb_val = null;
  for (let i = 0; i < pattern.length; i++) {
    const highlight_character = highlight[i];
    const current_character = pattern[i];
    const rgb_val = highlight_pattern_map[highlight_character] ?? '';

    // Skip spaces
    if (current_character === ' ') {
      val.push(current_character);
      continue;
    }

    // If rgb values differ, close the span and start a new one!
    if (rgb_val !== prev_rgb_val) {
      if (val.length > 0) {
        val.push('</span>');
      }
      val.push(`<span style="color: ${rgb_val}">`);
    }

    val.push(current_character);

    prev_rgb_val = rgb_val;
  }
  highlighted_pattern.push(val.join(''));
  highlighted_pattern.push('</span>');

  return highlighted_pattern.join('');
}