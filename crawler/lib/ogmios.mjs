/* A quick JavaScript client for Ogmios, tailored to our use-case.
 *
 * This client acts as a block generator from a given point, and doesn't handle rollback (it assumes
 * that information on chain on the covered period is somewhat immutable)
 */
import WebSocket from 'ws'

/**
 * Maximum number of request in flight.
 * Also defines the size of the 'MessageQueue' (and makes it bounded)
 */
const MAX_IN_FLIGHT = 100

export class Ogmios {
  #ws;
  #ready;
  #queue;
  #listener;

  constructor(url) {
    console.log(`Connecting to '${url}'...`)
    this.#ws = new WebSocket(url, { maxPayload: 1024**3 })
    this.#queue = new MessageQueue()
    this.#ready = new Promise((resolve, reject) => {
      this.#ws.once('error', reject)
      this.#ws.once('open', () => {
        console.log(`Connection established`)
        this.#ws.off('error', reject)
        resolve()
      })
    })
  }

  async configure({ from, to }) {
    console.log(`Configure synchronization ${from.slot} → ${to.slot}`)

    await this.#ready

    return new Promise((resolve, reject) => {
      this.#ws.once('message', (msg) => {
        const { methodname, result } = JSON.parse(msg)
        if (methodname !== 'FindIntersect') {
          reject(`Unexpected response from server: ${msg}`)
          return
        }

        if (!('IntersectionFound' in result)) {
          reject(`Intersection not found. Node tip at: ${JSON.stringify(result.tip)}`)
          return
        }

        const { point: intersection } = result.IntersectionFound

        this.#listener = Ogmios.#onRequestNext(this.#ws, this.#queue, to)
        this.#ws.on('message', this.#listener)
        for (let i = 0; i < MAX_IN_FLIGHT; i += 1) {
          this.#ws.send(Ogmios.#wsp('RequestNext', {}, i))
        }

        resolve(intersection)
      })

      this.#ws.send(Ogmios.#wsp('FindIntersect', { points: [from] }))
    })
  }

  async * nextBlock() {
    let done = false
    while (!done) {
      const msg = await this.#queue.next()

      done = msg.done

      if (msg.handle) {
        yield await new Promise((resolve) => msg.handle(resolve))
      }
    }
  }

  end() {
    if (this.#listener) {
      this.#ws.off('message', this.#listener)
    }
    this.#ws.close()
  }

  async acquire(point) {
    await this.#ready

    return new Promise((resolve, reject) => {
      this.#ws.once('message', (msg) => {
        const { methodname, result } = JSON.parse(msg)

        if (methodname !== 'Acquire') {
          reject(`Unexpected response from server: ${msg}`)
          return
        }

        if (result.AcquireFailure) {
          reject(`Unable to acquire requested point: ${JSON.stringify(result)}`)
          return
        }

        const acquired = result.AcquireSuccess.point

        console.log(`Acquired ${acquired.slot} / ${acquired.hash}`)
        resolve(result)
      })

      console.log(`Acquiring ${point.slot} / ${point.hash}...`)
      this.#ws.send(Ogmios.#wsp('Acquire', { point }))
    })
  }

  async query(query) {
    await this.#ready

    return new Promise((resolve, reject) => {
      const n = 12 * 60 * 60 * 1000
      const timeout = setTimeout(() => reject(`no response from the server within last ${n / 1000}s`), n)

      this.#ws.once('error', reject)
      this.#ws.once('message', (msg) => {
        this.#ws.off('error', reject)
        clearTimeout(timeout)

        const { methodname, result } = JSON.parse(msg)

        if (methodname !== 'Query') {
          reject(`Unexpected response from server: ${msg}`)
          return
        }

        if (result === 'QueryUnavailableInCurrentEra' || result.eraMismatch) {
          reject(`Query failed: ${JSON.stringify(result)}`)
          return
        }

        resolve(result)
      })

      console.log(`Querying ${JSON.stringify(query)}`)

      this.#ws.send(Ogmios.#wsp('Query', { query }))
    })
  }

  static #wsp(methodname, args = {}, mirror = null) {
    return JSON.stringify({
      type: 'jsonwsp/request',
      version: '1.0',
      servicename: 'ogmios',
      methodname,
      args,
      mirror
    })
  }

  static #onRequestNext(ws, queue, to) {
    return (msg) => {
      const { methodname, result, reflection } = JSON.parse(msg)

      if ('RollForward' in result) {
        rollForward(result, reflection)
      } else {
        rollBackward(result, reflection)
      }
    }

    function rollForward(result, reflection) {
      const block = result.RollForward.block.byron ||
        result.RollForward.block.shelley ||
        result.RollForward.block.allegra ||
        result.RollForward.block.mary ||
        result.RollForward.block.alonzo ||
        result.RollForward.block.babbage

      const slot = block.header.slot
      const hash = block.headerHash || block.header.hash

      if (slot > to.slot) {
        queue.push({ done: true })
      } else {
        queue.push({
          done: false,
          handle(next) {
            ws.send(Ogmios.#wsp('RequestNext'), {})

            const transactions = block.body || []
            const header = { slot, hash }

            next({ header, transactions })
          }
        })
      }
    }

    function rollBackward(result, reflection) {
      if (reflection === 0) {
        ws.send(Ogmios.#wsp('RequestNext'), {})
        return
      }

      throw new Error(`Unexpected response from server: ${JSON.stringify(result)}`)
    }
  }
}

/**
 * A simple message queue with an asynchronous accessor.
 */
class MessageQueue {
  #ms
  #messages

  constructor() {
    this.#reset()
    this.#messages = []
  }

  /**
   * Add a message to the queue.
   */
  push(msg) {
    this.#messages.push(msg)
  }

  /**
   * Get the next message from the queue. The action waits indefinitely for a message.
   */
  async next() {
    const msg = this.#messages.shift()

    if (msg === undefined) {
      await new Promise((resolve) => setTimeout(resolve, this.#ms))
      this.#ms = Math.min(1000, 2 * this.#ms)
      return await this.next()
    }

    this.#reset()

    return msg
  }

  /**
   * Reset the internal backoff delay when busy looping on messages.
   */
  #reset() {
    this.#ms = 10
  }
}
