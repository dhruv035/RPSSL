import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import dynamic from "next/dynamic";
const web3 = require("web3");
import Head from "next/head";
import RadioGroup from "./components/Radio";
import { ChangeEvent, useEffect, useState } from "react";
import {
  useAccount,
  useContractReads,
  useContractWrite,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import {
  parseEther,
  hashMessage,
  hexToBigInt,
  getContractAddress,
  formatEther,
} from "viem";
import contractabi from "../contractabi.json";
enum Move {
  Null = 0,
  Rock = 1,
  Paper,
  Scissors,
  Spock,
  Lizard,
}

const Home: NextPage = () => {
  const [isCreator, setIsCreator] = useState<boolean>(false);
  const publicClient = usePublicClient({ chainId: 5 });
  const [warning, setWarning] = useState(false);
  const [timer, setTimer] = useState<boolean>(false);
  const { address } = useAccount();
  const { data: client } = useWalletClient();
  const [target, setTarget] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(
    localStorage.getItem("stage")
  );
  const [radio, setRadio] = useState<number>(0);
  const [user, setUser] = useState<string>("init");
  const contractAddress = localStorage.getItem("contract") as `0x${string}`;
  const [stake, setStake] = useState<string>("0");
  const { data: dataReads, error: errorReads } = useContractReads({
    contracts: [
      {
        address: contractAddress,
        abi: [
          {
            constant: true,
            inputs: [],
            name: "stake",
            outputs: [
              {
                name: "",
                type: "uint256",
              },
            ],
            payable: false,
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "stake",
      },
      {
        address: contractAddress,
        abi: [
          {
            constant: true,
            inputs: [],
            name: "c2",
            outputs: [
              {
                name: "",
                type: "uint8",
              },
            ],
            payable: false,
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "c2",
      },
      {
        address: contractAddress,
        abi: [
          {
            constant: true,
            inputs: [],
            name: "lastAction",
            outputs: [
              {
                name: "",
                type: "uint256",
              },
            ],
            payable: false,
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "lastAction",
      },
      {
        address: contractAddress,
        abi: [
          {
            constant: true,
            inputs: [],
            name: "j2",
            outputs: [
              {
                name: "",
                type: "address",
              },
            ],
            payable: false,
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "j2",
      },
      {
        address: contractAddress,
        abi: [
          {
            constant: true,
            inputs: [],
            name: "j1",
            outputs: [
              {
                name: "",
                type: "address",
              },
            ],
            payable: false,
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "j1",
      },
    ],
  });

  console.log("DATAREADS", dataReads);

  const { writeAsync: writePlay } = useContractWrite({
    abi: contractabi.abi,
    address: contractAddress,
    functionName: "play",
  });

  const { writeAsync: writeReveal } = useContractWrite({
    abi: contractabi.abi,
    address: contractAddress,
    functionName: "solve",
  });
  const { writeAsync: writej1Timeout } = useContractWrite({
    abi: contractabi.abi,
    address: contractAddress,
    functionName: "j1Timeout",
  });

  const { writeAsync: writej2Timeout } = useContractWrite({
    abi: contractabi.abi,
    address: contractAddress,
    functionName: "j2Timeout",
  });

  useEffect(() => {
    if (!dataReads) return;
    if (dataReads[0] && typeof dataReads[0].result === "bigint")
      setStake(formatEther(dataReads[0].result));
    if (dataReads[2] && typeof dataReads[2].result === "bigint") {
      const difference =
        Math.floor(Date.now() / 1000) - Number(dataReads[2].result);
      console.log("Diff", difference);
      if (difference > 60 * 5) {
        if (dataReads[1] && Number(dataReads[1].result) === 0)
          setIsCreator(false);
        else setIsCreator(true);
        setTimer(true);
      }
    }
  }, [dataReads]);

  const handleCommit = async () => {
    if (client?.chain.id !== 5 || !address) {
      console.log("Wrong Chain");
      return;
    }
    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
    localStorage.setItem("nonce:" + address, nonce);

    const signature = await client?.signMessage({ message: nonce });
    if (!signature) return;
    const saltHex = hashMessage(signature);
    const salt = hexToBigInt(saltHex);
    const c1Hash = web3.utils.soliditySha3(
      { t: "uint8", v: radio },
      { t: "uint256", v: salt }
    );
    const txNonce = await publicClient.getTransactionCount({
      address: address,
    });
    const bigNonce = BigInt(txNonce);
    const contractAddress = await getContractAddress({
      from: address,
      nonce: bigNonce,
    });
    const hash = await client?.deployContract({
      abi: contractabi.abi,
      account: address,
      args: [c1Hash, target as `0x${string}`],
      value: parseEther(stake),
      bytecode: contractabi.bytecode as `0x${string}`,
    });
    if (!hash) return;
    setTimeout(() => {}, 3000);

    try {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: hash,
        confirmations: 1,
      });
      console.log("RECEIPT", receipt);
    } catch (error) {
      console.log("error", error);
      //Doesnt matter, the address will still get logged
    }

    console.log("Address is", contractAddress);
    localStorage.setItem("contract", contractAddress);
    localStorage.setItem("stage", "reveal");
    localStorage.setItem("c1Move", radio.toString());
    setStage("reveal");
    setUser("init");
  };

  const handleStake = async (e: ChangeEvent<HTMLInputElement>) => {
    setStake(e.target.value.toString());
    console.log("value set is", e.target.value.toString());
  };
  const handleReveal = async () => {
    const nonce = localStorage.getItem("nonce:" + address);
    console.log("Nonce is", nonce);
    if (!nonce) return;
    const signature = await client?.signMessage({ message: nonce });
    if (!signature) return;
    const saltHex = hashMessage(signature);
    const salt = hexToBigInt(saltHex);
    const move = localStorage.getItem("c1Move");

    if (!move) return;

    const { hash } = await writeReveal({
      args: [parseInt(move), salt],
    });
    try {
      const receipt = await publicClient.waitForTransactionReceipt({
        confirmations: 1,
        hash: hash,
      });
    } catch (err) {
      //still works
    }
    reset();
  };

  const reset = () => {
    localStorage.setItem("stage", "commit");
    localStorage.setItem("contract", "");
    localStorage.setItem("c1Move", "");
    setStage("commit");
    setUser("init");
  };

  const handlePlay = async () => {
    console.log("HEY", dataReads);
    const { hash } = await writePlay({
      args: [radio],
      value: parseEther(stake),
    });

    try {
      await publicClient.waitForTransactionReceipt({
        confirmations: 1,
        hash: hash,
      });
    } catch (err) {
      //still works
    }

    //const {data, isLoading,isError,isSuccess} = useContractWrite({
    //  address:contractAddress,
    //  value:
    //
    //})
    setUser("init");
  };

  const handleTimeout = async () => {
    if (!dataReads) return;
    let txHash;
    if (isCreator) {
      const { hash } = await writej1Timeout();
      txHash = hash;
    } else {
      const { hash } = await writej2Timeout();
      txHash = hash;
    }
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    reset();
  };
  return (
    <div className="w-[100vw] h-[100vh] flex flex-col">
      <div className="flex flex-row-reverse mt-4 mr-4">
        <ConnectButton />
        <button
          className="border-2 bg-blue-400 rounded-[10px] mx-3 w-[150px] mr-4"
          onClick={reset}
        >
          Flush Storage
        </button>
      </div>
      <div className="flex w-3/4 h-max mt-40 self-center justify-center">
        <div className="flex w-3/4 justify-center self-centernpm r">
          {!address || !client ? (
            <div className="text-[60px] text-amber-400">
              Please Connect Wallet
            </div>
          ) : !client || client.chain?.id !== 5 ? (
            <div className="text-[100px] text-red-600">
              Wrong Chain, Please Select the Goerli Network
            </div>
          ) : user === "init" ? (
            timer && dataReads && dataReads[4] && dataReads[3] ? (
              <div className="flex flex-col items-center text-[30px] text-blue-600">
                Turn has expired for the{" "}
                {!isCreator ? "Player. Creator may" : "Creator. Player may"}{" "}
                call the timeout function;
                {(isCreator && address === dataReads[3].result) ||
                (!isCreator && address === dataReads[4].result) ? (
                  <button
                    className="mt-4 text-black border-2 rounded-[10px] bg-blue-700 w-[200px]"
                    onClick={() => {
                      handleTimeout();
                    }}
                  >
                    Call Timeout
                  </button>
                ) : (
                  <div>
                    Select the Right wallet to call the timeout function
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[60px] flex flex-col">
                Please select action type
                <div className="flex text-[20px] justify-center flex-row mt-4">
                  <button
                    className="border-2 bg-blue-400 rounded-[10px] mx-3 w-[100px]"
                    onClick={() => {
                      setUser("play");
                    }}
                  >
                    Player
                  </button>
                  <button
                    className="border-2 bg-blue-400 rounded-[10px] mx-3 w-[100px]"
                    onClick={() => {
                      setUser("create");
                    }}
                  >
                    Creator
                  </button>
                </div>
              </div>
            )
          ) : user === "play" ? (
            dataReads && address === dataReads[3].result ? (
              dataReads[1] && Number(dataReads[1].result !== 0) ? (
                <div className="text-[60px] text-red-400">Please wait for the Creator to reveal their move</div>
              ) : (
                <div>
                  <div>Staked amount is {stake}</div>
                  <div className="radio-group">
                    <RadioGroup radio={radio} setRadio={setRadio} />
                  </div>
                  <button
                    className="border-2 bg-amber-300 rounded-[10px] w-[80px]"
                    onClick={() => {
                      handlePlay();
                    }}
                  >
                    Confirm
                  </button>
                </div>
              )
            ) : (
              <div className="text-[60px] text-red-400">Connected Wallet is not The player</div>
            )
          ) : stage !== "reveal" ? (
            <div className="flex flex-col">
              Commit a stake and your Choice
              <div className="radio-group">
                <RadioGroup radio={radio} setRadio={setRadio} />
              </div>
              <label className="mt-4">Enter amount to Stake</label>
              <input
                className="border-2 rounded-[10px]"
                type="number"
                onChange={(e) => {
                  handleStake(e);
                }}
                step={0.001}
              ></input>
              <label className="mt-4">Enter address to challenge</label>
              <div hidden={!warning} className="text-red-600 text-[30px]">
                Please enter a different wallet address than your own
              </div>
              <input
                className="border-2 rounded-[10px]"
                type="string"
                onChange={(e) => {
                  setTarget(e.currentTarget.value);
                }}
                step={0.001}
              ></input>
              <button
                className="border-2 mt-4 bg-amber-300 rounded-[10px] w-[80px]"
                onClick={() => {
                  console.log("target", target, address);
                  if (target == address) setWarning(true);
                  else {
                    setWarning(false);
                    handleCommit();
                  }
                }}
              >
                Confirm
              </button>
            </div>
          ) : dataReads && dataReads[4].result !== address ? (
            <div className="text-[60px] text-red-400">Selected Wallet is not the creator</div>
          ) : dataReads && dataReads[1] && Number(dataReads[1].result) === 0 ? (
            <div className="text-[60px] text-red-400">Please Wait for the Player to play their move</div>
          ) : (
            <div className="flex flex-col text-[60px]">
              Reveal your Choice
              <button
                className="text-[30px] bg-yellow-300 rounded-[10px]"
                onClick={() => {
                  handleReveal();
                }}
              >
                Reveal
              </button>
            </div>
          )}
          <div>
            <br></br>
            <br></br>
            {<div></div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(Home), { ssr: false });
