import { bech32 } from 'bech32'
import blake2b from 'blake2b'
import * as cbor from './codec/cbor.mjs'

export function collectPoll(transaction, genesisDelegates) {
  if (transaction.metadata) {
    const { 94: metadata } = transaction.metadata.body.blob
    const signatories = transaction.body.requiredExtraSignatures
    if (metadata && signatories.some(vkh => genesisDelegates.includes(vkh))) {
      return parsePoll(metadata)
    }
  }
}

export function collectAnswer(poll, transaction, resolve, reject) {
  if (transaction.metadata) {
    const { 94: metadata } = transaction.metadata.body.blob
    const signatories = Object.keys(transaction.witness.signatures)

    if (metadata) {
      // Obtain pool id from known snapshot and signatories
      const pool = getPool(poll.stakeDistribution, signatories)
      if (!pool) {
        return reject({
          reason: 'unknown pool',
          transaction: transaction.id,
          signatories,
        })
      }

      const answer = parseAnswer(metadata)

      if (answer.poll === undefined || answer.index === undefined) {
        return reject({
          reason: 'malformed answer',
          transaction: transaction.id,
          pool: pool.id
        })
      }

      // Ensure correct survey
      if (answer.poll.hash !== poll.hash) {
        return reject({
          reason: 'hash mismatch',
          transaction: transaction.id,
          pool: pool.id,
        })
      }

      // Ensure only one vote per pool
      if (poll.participants.has(pool.id)) {
        return reject({
          reason: 'duplicate answer',
          transaction: transaction.id,
          pool: pool.id,
        })
      }

      // Ensure valid answer
      const choice = poll.answers[answer.index]
      if (!choice) {
        return reject({
          reason: 'invalid answer',
          transaction: transaction.id,
          pool: pool.id,
        })
      }

      // NOTE
      // Doing this here allows pools that have submitted a well-formed but invalid answer to
      // recast. Mistakes can happen, so we only count the first _valid_ answer.
      poll.participants.add(pool.id)

      // Count answer
      console.log(`${pool.id} → ${choice}`)
      if (transaction.body.requiredExtraSignatures.length === 0) {
        resolve({
            transaction: transaction.id,
            pool,
            choice,
            warning: 'no required signers in body!'
        })
      } else {
        resolve({
            transaction: transaction.id,
            pool,
            choice,
        })
      }
    }
  }
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

function parseAnswer(metadata) {
  return (metadata['map'] || []).reduce((obj, pair) => {
    const k = (pair['k'] || {})['int']

    if (k === 2) {
      obj['poll'] = {}
      obj['poll']['hash'] = (pair['v'] || {})['bytes']
    }

    if (k === 3) {
      obj['index'] = (pair['v'] || {})['int']
    }

    return obj
  }, {})
}

function parsePoll(metadata) {
  let preimage = {}

  const poll = (metadata['map'] || []).reduce((obj, pair) => {
    const k = (pair['k'] || {})['int']

    if (k === 0) {
      const chunks = (pair['v'] || {})['list'] || []
      obj['question'] = chunks.map(chunk => chunk['string']).join('')
      preimage['0'] = chunks.map(chunk => chunk['string'])
    }

    if (k === 1) {
      const chunks = (pair['v'] || {})['list'] || []
      obj['answers'] = chunks.reduce((ans, chunk, ix) => {
        ans[ix] = (chunk['list'] || []).map(x => x['string']).join('')
        return ans
      }, {})
      preimage['1'] = chunks.reduce((xs, chunk) => {
        xs.push((chunk['list'] || []).map(x => x['string']))
        return xs
      }, [])
    }

    return obj
  }, {})

  preimage = cbor.map(
    cbor.int,
    (_, meta) => cbor.map(
      cbor.int,
      (k, v) => {
        if (k == 0) {
          return cbor.list(cbor.text, v)
        }

        if (k == 1) {
          return cbor.list(x => cbor.list(cbor.text, x), v)
        }
      },
      meta
    ),
    { 94: preimage }
  )

  poll.hash = blake2b(32).update(preimage).digest('hex')

  return poll
}
