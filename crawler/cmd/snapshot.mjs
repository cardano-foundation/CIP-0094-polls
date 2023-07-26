import * as fs from 'node:fs'
import * as path from 'node:path'
import { strict as assert } from 'node:assert'

import { Ogmios as CardanoNode } from '../lib/ogmios.mjs'

const slot = Number.parseInt(process.argv[2], 10)
assert(
  slot > 0,
  'expected slot number as 1st argument'
)

const hash = process.argv[3]
assert(
  typeof hash === 'string' && hash.length === 64,
  'expected (hex-encoded) header hash as 2nd argument.'
)

const point = { slot, hash }

const { config } = JSON.parse(fs.readFileSync('package.json'))

const node = new CardanoNode(config.ogmiosUrl)

await node.acquire(point)

const snapshot = Object.assign(
  { point },
  (await node.query('queryLedgerState/rewardsProvenance')).rewardsProvenance
)

console.log(`Snapshot fetched, found ${Object.keys(snapshot.pools || []).length} stake pools.`)

fs.mkdirSync(path.join('data', hash))
fs.writeFileSync(
  path.join('data', hash, 'stake-distribution.json'),
  JSON.stringify(snapshot, null, 2)
)

node.end()
