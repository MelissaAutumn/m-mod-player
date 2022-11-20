import { writable } from 'svelte/store';

/**
 * Song meta data from libopenmpt. These values are strings.
 */
export const song_metadata = writable({
  type: null,
  typeLong: null,
  originalType: null,
  originalTypeLong: null,
  container: null,
  containerLong: null,
  tracker: null,
  artist: null,
  title: null,
  date: null,
  message: null,
  messageRaw: null,
  warnings: null,
});
export const sequence_data = writable([]);

// Stored in slightly dumb way for now.
// Array[Pattern Sheets][Rows][Columns/Channels]
export const patterns = writable([]);

// Floats from 0.0 - 1.0 stored in an array
// Array[Column/Channel] = 0.0 - 1.0
export const channel_volume = writable([]);

export const current_pattern = writable(0);
export const current_row = writable(0);
export const next_pattern = writable(0);
