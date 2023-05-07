# CIP-0094 polls

This repository contains instructions and data for participating in SPO polls as proposed and defined in [CIP-0094](https://github.com/cardano-foundation/CIPs/tree/cip-spo-polls/CIP-0094) and announced in this [forum post](https://forum.cardano.org/t/entering-voltaire-on-chain-poll-for-spos/117330).

> **Note**
>
> We will add to and improve this guidance and information in the first half of
> May as part of the PreProd test run.

## Existing polls

| Date     | Network | Poll |
| ---      | ---     | ---  |
| May 2023 | PreProd | [d8c1b1d871a27d74fbddfa16d28ce38288411a75c5d3561bb74066bcd54689e2](networks/preprod/d8c1b1d871a27d74fbddfa16d28ce38288411a75c5d3561bb74066bcd54689e2/) |

## How to participate?

### Pre-requisites

To run the poll governance subcommands, a version of cardano-cli with governance poll subcommand support is required. There are few options available to you:

1. Checkout and build [input-output-hk/cardano-node@8.0.0-untested](INSTALL_CCLI8.md)

2. Checkout and build [CardanoSolutions/cardano-node@release/1.35+cip-0094](INSTALL_CCLI1357.md)

3. Download [pre-built binaries from CardanoSolutions/cardano-node@release/1.35+cip-0094](https://github.com/CardanoSolutions/cardano-node/releases/tag/1.35.7%2Bcip-0094), for a standard Linux system

### Steps

#### 1. Find an available poll

Available polls are [listed in the table above](#existing-polls). Alternatively, you can use the [getPoll.sh](scripts/getPoll.sh) script to look for specific polls submitted on-chain.

#### 2. Create a poll answer

Use the `cardano-cli governance answer-poll` command to create an answer.

#### 3. Build a transaction with metadata

Build a transaction using the poll answer as metadata. You'll also need to indicate your pool id as an extra required signatory.

#### 4. Sign the transaction

The transaction must be signed using your cold key.

#### 5. Submit the transaction

Finally, submit the transaction to the network.

### Tutorial

The steps above are explained in more detail in [TUTORIAL.md](TUTORIAL.md).
