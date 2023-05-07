# CIP-0094 Chain Crawler

This folder contains two utility scripts written with node.js:

- `yarn snapshot <SLOT> <HEADER-HASH>`

  Take a snapshot of the stake pool distribution at the request point, including pledge and
  delegated stake.

- `yarn crawl`

  Crawl the chain between two specified points and store CIP-0094 submissions for a configured poll.
  The crawler process and validate submissions to produce a dataset of valid and invalid answers
  found on-chain.

  > **Warning**
  >
  > The `crawl` command assumes the existence of a `data/stake-distribution.json` snapshot. Make
  > sure one snapshot exists.

## Configuration

The configuration is found in the `package.json` file, until the `config` field.

### ogmiosUrl

An URL to an Ogmios instance (local or remote). Starting with `ws://` or `wss://`.

> **Note**
>
> One can use instances provided by [Demeter.run](https://demeter.run/).

### from / to

The crawling window is configured between two points on chain as `from` and `to`. Note that the
crawler start at the block immediately **after** `from`.

### poll

The poll itself must be configured as well; its hash and possible answers must be specified for
validation.
