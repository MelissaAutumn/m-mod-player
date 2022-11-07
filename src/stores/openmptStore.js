import { writable } from 'svelte/store';

/**
 * Song meta data from libopenmpt. These values are strings.
 */
export const songMetadata = writable({
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
export const subSongData = writable([

]);