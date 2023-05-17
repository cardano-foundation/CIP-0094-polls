import * as fs from 'node:fs'
import * as path from 'node:path'
import { strict as assert } from 'node:assert'

import { JSONStream } from '../lib/stream/json.mjs'
import { Ogmios as CardanoNode } from '../lib/ogmios.mjs'
import { collectPoll, collectAnswer } from '../lib/cip-0094.mjs'

const network = process.argv[2]
assert(
  ['mainnet', 'preview', 'preprod'].includes(network),
  'expected one known Cardano network (mainnet, preview or preprod) as 1st argument'
)

const pollIndex = Number.parseInt(process.argv[3])
assert(
  !Number.isNaN(pollIndex),
  'Expected poll index as non-negative integer as 2nd argument.'
)

const snapshotHeaderHash = process.argv[4]
assert(
  typeof snapshotHeaderHash === 'string' && snapshotHeaderHash.length === 64,
  'expected (hex-encoded) header hash of snapshot as 3rd argument.'
)
const stakeDistribution = JSON.parse(
  fs.readFileSync(path.join('data', snapshotHeaderHash, 'stake-distribution.json'))
)

const { networks } = JSON.parse(fs.readFileSync(path.join('..', 'networks', 'polls.json')))
const { from, to } = networks[network][pollIndex]
assert(
  from !== undefined && to !== undefined,
  `couldn't find any poll for ${network}[${pollIndex}]`
)

const { config } = JSON.parse(fs.readFileSync('package.json'))
const node = new CardanoNode(config.ogmiosUrl)
await node.configure({ from, to })

fs.mkdirSync('results', { recursive: true })
const answers = new JSONStream(path.join('data', snapshotHeaderHash, 'answers.json'))
const invalid = new JSONStream(path.join('data', snapshotHeaderHash, 'invalid.json'))

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
        poll.stakeDistribution = stakeDistribution
      }
    }
  })
}

answers.end()
invalid.end()
node.end()
