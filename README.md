# CIP-0094 polls

This repository contains instructions and data for participating in SPO polls as proposed and defined in [CIP-0094](https://github.com/cardano-foundation/CIPs/tree/cip-spo-polls/CIP-0094) and announced in this [forum post](https://forum.cardano.org/t/entering-voltaire-on-chain-poll-for-spos/117330)

Note: We will add to and improve this guidance and information in the first half of May as part of the PreProd test run.

## System preparation
To run the poll governance subcommands, a version 8.x.x or higher of cardano-cli from the [input-output-hk/cardano-node](https://github.com/input-output-hk/cardano-node) repository is required (look for tag [8.0.0-untested](https://github.com/input-output-hk/cardano-node/releases/tag/8.0.0-untested) or higher). 

Please note that version 8 as successor of the previous v1.35.x codebase has undergone an extensive revision. So the build process on your system may be a bit different than you were used to. 
We provide a [build script](scripts/build_CCLI8.sh) here, which was tested on Linux/Ubuntu, and should serve you as a help. If it does not run successfully on your system, please try to find the adjustments for your system using the steps that are already given there. 

### Download the build script:

```bash
mkdir "$HOME/tmp";cd "$HOME/tmp"
# Install curl
# CentOS / RedHat - sudo dnf -y install curl
# Ubuntu / Debian - sudo apt -y install curl
curl -sS -o build_CCLI8.sh https://raw.githubusercontent.com/cardano-foundation/CIP-0049-polls/main/scripts/build_CCLI8.sh
chmod 755 build_CCLI8.sh
```

### Execute the build script
Now execute `./build_CCLI8.sh`. The script will explain each step it will do. Confirm with [Enter] or abort the script if something doesn't seem right.

The output should look like this:

```
Local repository check: OK
(assuming you git clone'd https://github.com/input-output-hk/cardano-node.git into it)

Let's checkout 8.0.0-untested tag ...
Press [Enter] to continue ...
Fetching origin
remote: Enumerating objects: 20, done.
remote: Counting objects: 100% (20/20), done.
...
...
HEAD is now at ...  Merge pull request ...

backup an existing cabal.project.local to cabal.project.local.bkp_8.0.0-untested ...
Press [Enter] to continue ...

prepare cabal to build 8.0.0-untested codebase ...
Press [Enter] to continue ...
Downloading the latest package lists from:
- hackage.haskell.org
- cardano-haskell-packages
Package list of cardano-haskell-packages is up to date.
The index-state is set to 2023-04-30T00:28:07Z.
Package list of hackage.haskell.org is up to date.
The index-state is set to 2023-05-01T13:54:13Z.

Now let's build cardano-cli ...
Press [Enter] to continue ...
Wrote tarball sdist to
...
...
...
Building     cardano-cli-8.0.0 (exe:cardano-cli)
Installing   cardano-cli-8.0.0 (exe:cardano-cli)
Completed    cardano-cli-8.0.0 (exe:cardano-cli)
Copying 'cardano-cli' to '/home/user/.local/bin/CIP-0094/cardano-cli'

restore the previous cabal.project.local file ...
Press [Enter] to continue ...
```


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