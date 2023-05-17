import * as fs from 'node:fs'

export class JSONStream {
  #stream
  #isEmpty

  constructor(filepath) {
    this.#stream = fs.createWriteStream(filepath)
    this.#isEmpty = true
  }

  write(obj) {
    if (this.#isEmpty) {
      this.#stream.write(`[ ${JSON.stringify(obj)}\n`)
      this.#isEmpty = false
    } else {
      this.#stream.write(`, ${JSON.stringify(obj)}\n`)
    }
  }

  end() {
    if (this.#isEmpty) {
      this.#stream.end('[]')
    } else {
      this.#stream.end(']')
    }
  }
}
