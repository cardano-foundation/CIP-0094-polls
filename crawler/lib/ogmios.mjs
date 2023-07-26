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
        const { id, result, error } = JSON.parse(msg)
        if (id !== 'findIntersection') {
          reject(`Unexpected response from server: ${msg}`)
          return
        }

        if (error) {
          reject(`Intersection not found. Node tip at: ${JSON.stringify(error.data.tip)}`)
          return
        }

        this.#listener = Ogmios.#onNextBlock(this.#ws, this.#queue, to)
        this.#ws.on('message', this.#listener)
        for (let i = 0; i < MAX_IN_FLIGHT; i += 1) {
          this.#ws.send(Ogmios.#rpc('nextBlock', {}, i))
        }

        resolve(result.intersection)
      })

      this.#ws.send(Ogmios.#rpc('findIntersection', { points: [from] }))
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
        const { id, result, error } = JSON.parse(msg)

        if (id !== 'acquireLedgerState') {
          reject(`Unexpected response from server: ${msg}`)
          return
        }

        if (error) {
          reject(`Unable to acquire requested point: ${JSON.stringify(error)}`)
          return
        }

        const acquired = result.point

        console.log(`Acquired ${acquired.slot} / ${acquired.hash}`)
        resolve(acquired)
      })

      console.log(`Acquiring ${point.slot} / ${point.hash}...`)
      this.#ws.send(Ogmios.#rpc('acquireLedgerState', { point }))
    })
  }

  async query(query, params = {}) {
    await this.#ready

    return new Promise((resolve, reject) => {
      const n = 60 * 60 * 1000
      const timeout = setTimeout(() => reject(`no response from the server within last ${n / 1000}s`), n)

      this.#ws.once('error', reject)
      this.#ws.once('message', (msg) => {
        this.#ws.off('error', reject)
        clearTimeout(timeout)

        const { id, result, error } = JSON.parse(msg)

        if (id !== query) {
          reject(`Unexpected response from server: ${msg}`)
          return
        }

        if (error) {
          reject(`Query failed: ${JSON.stringify(error)}`)
          return
        }

        resolve(result)
      })

      console.log(`Querying ${JSON.stringify(query)}`)

      this.#ws.send(Ogmios.#rpc(query, params))
    })
  }

  static #rpc(method, params = {}, id = method) {
    return JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id
    })
  }

  static #onNextBlock(ws, queue, to) {
    return (msg) => {
      const { id, result } = JSON.parse(msg)

      if (result.direction == 'forward') {
        rollForward(result, id)
      } else {
        rollBackward(result, id)
      }
    }

    function rollForward(result) {
      const slot = block.slot
      const hash = block.header.hash

      if (slot > to.slot) {
        queue.push({ done: true })
      } else {
        queue.push({
          done: false,
          handle(next) {
            ws.send(Ogmios.#rpc('nextBlock'))

            const transactions = block.transactions || []
            const header = { slot, hash }

            next({ header, transactions })
          }
        })
      }
    }

    function rollBackward(result, id) {
      if (id === 0) {
        ws.send(Ogmios.#rpc('nextBlock'))
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
