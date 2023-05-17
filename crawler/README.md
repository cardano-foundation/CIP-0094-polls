# CIP-0094 Chain Crawler

This folder contains two utility scripts written with node.js:

- `yarn snapshot <SLOT> <HEADER-HASH>`

  Take a snapshot of the stake pool distribution at the request point, including pledge and
  delegated stake.

- `yarn crawl <NETWORK> <POLL-INDEX> <HEADER-HASH>`

  Crawl the chain between two specified points and store CIP-0094 submissions for a configured poll.
  The crawler process and validate submissions to produce a dataset of valid and invalid answers
  found on-chain. It requires a block header hash associated to a stake distribution snapshot.

  For example:

  ```
  yarn crawl mainnet 0 be0c25b32fecf411b4d82acd3b556402a6e5634000f6882b625ab8eae8d760c5
  ```

  > **Warning**
  >
  > The `crawl` command assumes the existence of a `data/${HEADER-HASH}/stake-distribution.json`
  > snapshot. Make sure one snapshot exists.

## Configuration

The configuration is found in the `package.json` file, under the `config` field.

### ogmiosUrl

An URL to an Ogmios instance (local or remote). Starting with `ws://` or `wss://`.

> **Note**
>
> One can use instances provided by [Demeter.run](https://demeter.run/).
