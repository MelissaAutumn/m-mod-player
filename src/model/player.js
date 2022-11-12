// Store some context keys here:
export const selected_song_key = Symbol('Selected Song');
export const selected_sequence_key = Symbol('Selected Sequence');
export const selected_category_key = Symbol('Selected Category');
export const playback_state_key = Symbol('Playback State <playing|paused>');
export const page_key = Symbol('Page');

// Pseudo enum
export const pages = {Songs:0, Categories: 1, Queue: 2};
export const playback_states = {Paused:0, Playing: 1};