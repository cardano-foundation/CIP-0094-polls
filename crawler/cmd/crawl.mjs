import * as fs from 'node:fs'
import * as path from 'node:path'
import { bech32 } from 'bech32'
import blake2b from 'blake2b'

import { JSONStream } from '../lib/stream/json.mjs'
import { Ogmios as CardanoNode } from '../lib/ogmios.mjs'

const { config } = JSON.parse(fs.readFileSync('package.json'))
const stakeDistribution = JSON.parse(fs.readFileSync(path.join('data', 'stake-distribution.json')))

const node = new CardanoNode(config.ogmiosUrl)

await node.configure(config)

fs.mkdirSync('results', { recursive: true })
const answers = new JSONStream(path.join('data', 'answers.json'))
const invalid = new JSONStream(path.join('data', 'invalid_answers.json'))

const seen = new Set()

for await (const block of node.nextBlock()) {
  block.transactions.forEach((transaction) => {
    if (transaction.metadata) {
      const { 94: metadata } = transaction.metadata.body.blob
      const signatories = Object.keys(transaction.witness.signatures)

      if (metadata) {
        // Obtain pool id from known snapshot and signatories
        const pool = getPool(stakeDistribution, signatories)
        if (!pool) {
          invalid.write({
            reason: 'unknown pool',
            transaction: transaction.id,
            signatories,
          })
          return
        }

        const poll = parsePoll(metadata)

        // Ensure correct survey
        if (poll.hash !== config.poll.hash) {
          invalid.write({
            reason: 'hash mismatch',
            transaction: transaction.id,
            pool: pool.id,
          })
          return
        }

        // Ensure only one vote per pool
        if (seen.has(pool.id)) {
          invalid.write({
            reason: 'duplicate answer',
            transaction: transaction.id,
            pool: pool.id,
          })
          return
        }

        // NOTE: Doing this _here_ is up-to-debate. We could only count
        // valid submissions.
        seen.add(pool.id)

        // Ensure valid answer
        const answer = config.poll.answers[poll.answer]
        if (!answer) {
          invalid.write({
            reason: 'invalid answer',
            transaction: transaction.id,
            pool: pool.id,
          })
          return
        }

        // Count answer
        console.log(`${block.header.slot} | ${pool.id} → ${answer}`)
        if (transaction.body.requiredExtraSignatures.length === 0) {
          answers.write({
              transaction: transaction.id,
              pool,
              answer,
              warning: 'no required signers in body!'
          })
        } else {
          answers.write({
              transaction: transaction.id,
              pool,
              answer,
          })
        }
      }
    }
  })
}

function getPool(stakeDistribution, signatories) {
  for (const signatory of signatories) {
    const hash = blake2b(28).update(Buffer.from(signatory, 'hex')).digest()
    const poolId = bech32.encode('pool', bech32.toWords(hash), 999)
    const pool = stakeDistribution.pools[poolId]
    if (pool) {
      return {
        id: poolId,
        stake: pool.stake,
        ownerStake: pool.ownerStake,
        pledge: pool.poolParameters.pledge
      }
    }
  }
}

function parsePoll(metadata) {
  return (metadata['map'] || []).reduce((obj, pair) => {
    const k = (pair['k'] || {})['int']

    if (k === 2) {
      obj['hash'] = (pair['v'] || {})['bytes']
    }

    if (k === 3) {
      obj['answer'] = (pair['v'] || {})['int']
    }

    return obj
  }, {})
}

answers.end()
invalid.end()
node.end()
