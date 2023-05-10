import * as fs from 'node:fs'
import * as path from 'node:path'

import { JSONStream } from '../lib/stream/json.mjs'
import { Ogmios as CardanoNode } from '../lib/ogmios.mjs'
import { collectPoll, collectAnswer } from '../lib/cip-0094.mjs'

const { config } = JSON.parse(fs.readFileSync('package.json'))

const node = new CardanoNode(config.ogmiosUrl)
await node.configure(config)

fs.mkdirSync('results', { recursive: true })
const answers = new JSONStream(path.join('data', 'answers.json'))
const invalid = new JSONStream(path.join('data', 'invalid_answers.json'))


let poll
for await (const block of node.nextBlock()) {
  block.transactions.forEach((transaction) => {
    if (poll) {
      collectAnswer(
        poll,
        transaction,
        x => answers.write(x),
        x => invalid.write(x)
      )
    } else {
      poll = collectPoll(transaction, config.genesisDelegates)
      if (poll) {
        console.log(`Found valid poll in transaction ${transaction.id}`)
        console.log(JSON.stringify(poll, null, 2))
        poll.participants = new Set()
        poll.stakeDistribution = JSON.parse(
          fs.readFileSync(path.join('data', 'stake-distribution.json'))
        )
      }
    }
  })
}

answers.end()
invalid.end()
node.end()
