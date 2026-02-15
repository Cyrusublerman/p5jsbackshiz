/**
 * History — undo/redo stack using Recipe JSON snapshots.
 */
import { Recipe } from './Recipe.js';

export class History {
  constructor(maxEntries = 30) {
    this._stack = [];
    this._index = -1;
    this._max = maxEntries;
  }

  /** Snapshot current state before a mutation. */
  push(state, registry) {
    const json = Recipe.exp(state, registry);
    // Truncate any forward history
    this._stack = this._stack.slice(0, this._index + 1);
    this._stack.push(json);
    if (this._stack.length > this._max) this._stack.shift();
    this._index = this._stack.length - 1;
  }

  /** Undo: restore previous state. Returns true if successful. */
  undo(state, registry) {
    if (this._index <= 0) return false;
    this._index--;
    Recipe.imp(state, this._stack[this._index], registry);
    return true;
  }

  /** Redo: restore next state. Returns true if successful. */
  redo(state, registry) {
    if (this._index >= this._stack.length - 1) return false;
    this._index++;
    Recipe.imp(state, this._stack[this._index], registry);
    return true;
  }

  get canUndo() { return this._index > 0; }
  get canRedo() { return this._index < this._stack.length - 1; }
  get depth() { return this._stack.length; }
}
