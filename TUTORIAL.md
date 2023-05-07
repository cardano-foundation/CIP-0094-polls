# CIP-0094 - Tutorial

## Pre-requisites

Here's a quick tutorial on how to interactively submit an answer to an SPO
survey. To start, you must have received a valid survey in the form of a JSON
files properly constructed using the `create-poll` command. The file should
look roughly like the following:

<p align="right"><strong>poll.json</strong></p>

```json
{
    "type": "GovernancePoll",
    "description": "An on-chain poll for SPOs: Pineapples on pizza?",
    "cborHex": "a1185ea2007450696e656170706c6573206f6e2070697a7a613f018263796573626e6f"
}
```

> **Warning**
>
> Surveys are made 'official' using a signature from the genesis delegate key;
> the signature is however not present in metadata but used as extra signatory
> on the originating transaction.

## Creating answer

From there, you can create a metadata entry to answer the survey using the
`governance answer-poll` command as such:

```console
$ cardano-cli governance answer-poll --poll-file poll.json
```

This command will prompt you to answer interactively. If you do not wish to be
prompt interactively, you can use `--answer` with the index of the answer.

Running this command will display the survey in a human-readable form, and
prompt you for an answer, as shown below:

```
An on-chain poll for SPOs: Pineapples on pizza?
[0] Yes
[1] No

Please indicate an answer (by index): _
```

You can proceed by typing one of the possible answer index (here, `0` or `1`)
and a newline. This will print witnessed metadata in the form of a JSON
detailed schema that shall then be posted on-chain in any transaction and
**signed with your stake pool cold key**: the easiest being to build a simple
transaction to yourself carrying the metadata.

Here's an example of metadata using choosing the answer `0`:

<p align="right"><strong>answer.json</strong></p>

```json
{
  "94": {
    "map": [
      {
        "k": { "int": 2 },
        "v": { "bytes": "c9a077a1098d73498d17e9ea27045af820c311ced91f8c2bb9b5c7f446379063" }
      },
      {
        "k": { "int": 3 },
        "v": { "int": 0 }
      }
    ]
  }
}
```

## Publishing answer

From there, you can use the `transaction build` command to create a transaction
to post on-chain. You'll need a signing key associated to a UTxO with enough
funds to carry the transaction (~0.2 Ada should you make a basic transaction to
yourself).

Assuming you have saved metadata produced from the previous step in a file
called `answer.json`, the command for building the transaction shall look like:

```
$ cardano-cli transaction build \
    --babbage-era \
    --cardano-mode \
    --mainnet \
    --tx-in $TXID#$IX \
    --change-address $ADDRESS \
    --metadata-json-file answer.json \
    --json-metadata-detailed-schema \
    --required-signer-hash $POOL_ID \
    --out-file answer.tx
```

> **Warning**
>
> Note that it is extremely important to add `--required-signer-hash` for the answer to
> be counted as valid for the survey; this is what identifies you as a stake pool
> operator.

You'll need to fill-in `--tx-in` & `--change-address` with their corresponding
values.

From there, you can sign `answer.tx` using your stake pool cold key and any
necessary payment key; then submit the result as usual. If everything goes
well, the cardano-cli should display a transaction id that you can track
on-chain to ensure your reply to the survey was properly published.

## Verifying Answers

Finally, it's possible to verify answers seen on-chain using the `governance
verify-poll` command. What 'verify' means here is two-folds:

- It checks that an answer is valid within the context of a given survey
- It returns the list of signatories key hashes found in the transaction;
  in the case of a valid submission, one key hash will correspond to a known
  stake pool id.

Assuming you still have the original `poll.json` file, and some signed transaction
carrying a survey's answer as `answer.signed`, you can verify its validity via:

```
$ cardano-cli governance verify-poll \
  --poll-file poll.json \
  --signed-tx-file answer.signed
```

On success, this should outputs something like:

```
Found valid poll answer, signed by:
[
    "f8db28823f8ebd01a2d9e24efb2f0d18e387665770274513e370b5d5"
]
```

Otherwise, the command will formulate an issue with the answer and/or poll.
