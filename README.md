# CIP-0094 polls

This repository contains instructions and data for participating in SPO polls as proposed and defined in [CIP-0094](https://github.com/cardano-foundation/CIPs/tree/cip-spo-polls/CIP-0094) and announced in this [forum post](https://forum.cardano.org/t/entering-voltaire-on-chain-poll-for-spos/117330)

Note: We will add to and improve this guidance and information in the first half of May as part of the PreProd test run.

## System preparation
To run the poll governance subcommands, a version of cardano-cli with governance poll subcommand support is required. There are a couple of options for you: 

1) Checkout and build [8.0.0-untested](https://github.com/input-output-hk/cardano-node/releases/tag/8.0.0-untested) (or higher) from the [input-output-hk/cardano-node](https://github.com/input-output-hk/cardano-node) repository. 
2) Checkout and build [release/1.35](https://github.com/CardanoSolutions/cardano-node/tree/release/1.35) from the [cardanosolutions/cardano-node](https://github.com/CardanoSolutionsCardanoSolutions/cardano-node) repository.
3) Download pre-built binaries, for a standard Linux system

### 1) Build cardano-cli v8
Please note that version 8 as successor of the previous v1.35.x codebase has undergone an extensive revision. So the build process on your system may be a bit different than you were used to. 
We provide a [build script](scripts/build_CCLI8.sh) here, which was tested on Linux/Ubuntu, and should serve you as a help. If it does not run successfully on your system, please try to find the adjustments for your system using the steps that are already given there. 

**Build requirements**

The cabal and ghc binaries should be versions known to work for compiling cardano-node. If you do not normally compile your own cardano-node the following versions are known to work.

* cabal 3.6.2.0
* ghc 8.10.7

**Download the v8 build script:**

```bash
mkdir "$HOME/tmp";cd "$HOME/tmp"
# Install curl
# CentOS / RedHat - sudo dnf -y install curl
# Ubuntu / Debian - sudo apt -y install curl
curl -sS -o build_CCLI8.sh https://raw.githubusercontent.com/cardano-foundation/CIP-0049-polls/main/scripts/build_CCLI8.sh
chmod 755 build_CCLI8.sh
```

**Execute the build script**

Now execute `./build_CCLI8.sh`. The script will explain each step it will do. Confirm with [Enter] or abort the script if something doesn't seem right. It is designed to rely on an existing local clone of IOG's cardano-node repository on your computer. If successfull it will not overwrite your existing cardano-cli but instead save it into a dedicated subfolder. 

### 2) Build cardano-cli 1.35.7 with governance poll support

@Ktorz has implemented the governance poll extension also merged in IOG's 8.0.0 codebase. If you prefer building a cardano-cli from the 1.35 codebase there is a repository you can clone to build your 1.35.7 with the governance poll subcommands included. 

**Download the v1.35 build script:**

```bash
mkdir "$HOME/tmp";cd "$HOME/tmp"
# Install curl
# CentOS / RedHat - sudo dnf -y install curl
# Ubuntu / Debian - sudo apt -y install curl
curl -sS -o build_CCLI135.sh https://raw.githubusercontent.com/cardano-foundation/CIP-0049-polls/main/scripts/build_CCLI135.sh
chmod 755 build_CCLI135.sh
```

**Execute the build script**

Now execute `./build_CCLI135.sh`. The script will explain each step it will do. Confirm with [Enter] or abort the script if something doesn't seem right. It is designed to clone a new local copy and build the executable from it. If successfull it will not overwrite your existing cardano-cli but instead save it into a dedicated subfolder. 

### 3) Download a pre-built cardano-cli 1.35.7 with governance poll support

(work in progress - stay tuned)


## The poll participation procedure

With the current v8 version of cardano-cli installed, the following steps are due now:
1) find the transaction
2) download this TX's metadata
3) generate an answer with the desired option
4) sign the transaction with the answer using the pool's cold key
5) send it to the network

As a last step, the previous build script should have downloaded a second [script getPoll.sh](scripts/getPoll.sh). You can now run this as a helper script for the above steps, or use it as a guide to perform the steps yourself if your system is set up differently and is incompatible with this helper script.

Running `./getPoll.sh` should give you something like this:

```
Using /home/user/.local/bin/CIP-0094/cardano-cli version 8.0.0 ...
   _____ ____  ____                    ____
  / ___// __ \/ __ \      ____  ____  / / /
  \__ \/ /_/ / / / /_____/ __ \/ __ \/ / /
 ___/ / ____/ /_/ /_____/ /_/ / /_/ / / /
/____/_/    \____/     / .___/\____/_/_/
                      /_/

1) PreProd
2) Mainnet
3) Quit
Which network should we look at? 1
OK so be it PreProd

1) PreProd Demo Poll (epoch 86 - 1 May 2023)
2) Other
3) Quit
Which poll TX should we look at? 1
OK so TX d8c1b1d871a27d74fbddfa16d28ce38288411a75c5d3561bb74066bcd54689e2
Query preprod: d8c1b1d871a27d74fbddfa16d28ce38288411a75c5d3561bb74066bcd54689e2 metadata ...
Looks promising: TX metadata has a CIP-0094 label

How satisfied are you with the current rewards and incentives scheme?
[0] dissatisfied
[1] no opinion
[2] satisfied

Please indicate an answer (by index): 1

Poll answer created successfully.
Please submit a transaction using the resulting metadata.
To be valid, the transaction must also be signed using a valid key
identifying your stake pool (e.g. your cold key).


Hint (1): Use '--json-metadata-detailed-schema' and '--metadata-json-file' from the build or build-raw commands.
Hint (2): You can redirect the standard output of this command to a JSON file to capture metadata.

Metadata for your answer TX is ready in /tmp/CIP-0094_d8c1b1d871a27d74fbddfa16d28ce38288411a75c5d3561bb74066bcd54689e2-poll-answer.json
```

Now there are steps 4 and 5 left: create a transaction with this metadata json file and sign it with the cold key of your pool. 

(Further additions and notes will follow in the coming days)

## Existing SPO polls

- PreProd Test Run ([d8c1b1d871a27d74fbddfa16d28ce38288411a75c5d3561bb74066bcd54689e2](networks/preprod/d8c1b1d871a27d74fbddfa16d28ce38288411a75c5d3561bb74066bcd54689e2/))  May 2023
