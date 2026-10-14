import type { CaffeineState } from './caffeine.types'

export type CatalogChange = (state: CaffeineState) => CaffeineState

/** Catalog edits stay in memory until the user commits the session. */
export class CatalogDraft {
  state: CaffeineState
  private changes: CatalogChange[] = []

  constructor(private readonly initial: CaffeineState) {
    this.state = initial
  }

  get changed() { return this.changes.length > 0 }

  stage(change: CatalogChange) {
    const next = change(this.state)
    if (next !== this.state) this.changes.push(change)
    this.state = next
  }

  reset() {
    this.state = this.initial
    this.changes = []
  }

  snapshot(): CatalogChange {
    const changes = [...this.changes]
    // Replay against the latest saved state so unrelated records/settings survive.
    return current => changes.reduce((state, change) => change(state), current)
  }
}
