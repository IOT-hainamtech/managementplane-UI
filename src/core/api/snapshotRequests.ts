/** Share initial reads across components and limit simultaneous Data API calls. */
export function createSnapshotRequests(concurrency = 2) {
  const cache = new Map<string, Promise<unknown>>()
  const active = new Set<AbortController>()
  const queue: { start: () => void; cancel: () => void }[] = []
  let generation = 0

  const drain = () => {
    while (active.size < concurrency && queue.length) queue.shift()!.start()
  }

  return {
    get<T>(key: string, revision: number, load: (signal: AbortSignal) => Promise<T>): Promise<T> {
      if (revision < generation) return Promise.reject(new DOMException('Snapshot superseded', 'AbortError'))
      if (revision > generation) {
        generation = revision
        cache.clear()
        queue.splice(0).forEach(job => job.cancel())
        active.forEach(controller => controller.abort())
      }
      const existing = cache.get(key)
      if (existing) return existing as Promise<T>

      const promise = new Promise<T>((resolve, reject) => {
        queue.push({
          cancel: () => reject(new DOMException('Snapshot superseded', 'AbortError')),
          start: () => {
            const controller = new AbortController()
            active.add(controller)
            Promise.resolve().then(() => load(controller.signal)).then(resolve, reject).finally(() => {
              active.delete(controller)
              drain()
            })
          },
        })
      })
      cache.set(key, promise)
      drain()
      return promise
    },
  }
}

export const snapshotRequests = createSnapshotRequests()
