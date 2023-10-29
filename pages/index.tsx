import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import dynamic from "next/dynamic";
const web3 = require("web3");
import RadioGroup from "./components/Radio";
import { ChangeEvent, useEffect, useState, useRef } from "react";
import {
  useAccount,
  useBalance,
  readContracts,
  useContractRead,
  useContractReads,
  useContractWrite,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { readContract } from "@wagmi/core";
import {
  parseEther,
  hashMessage,
  hexToBigInt,
  getContractAddress,
  formatEther,
  isAddress,
  isAddressEqual,
  Address,
} from "viem";
import contractabi from "../contractabi.json";
import {
  addDeployement,
  getDeployements,
  removeDeployement,
} from "../frontend-services/mongoServices";

import {
  Alchemy,
  AssetTransfersCategory,
  Network,
  AssetTransfersResult,
} from "alchemy-sdk";
import { element } from "@rainbow-me/rainbowkit/dist/css/reset.css";

export type Deployement = {
  address: string;
  j1: string;
  j2: string;
};
const Home: NextPage = () => {
  //states

  const [isBack, setIsBack] = useState(false);
  const [isCreator, setIsCreator] = useState<boolean>(false);
  const [diff, setDiff] = useState<number>(0);
  const publicClient = usePublicClient({ chainId: 5 });
  const [timer, setTimer] = useState<boolean>(false);
  const { address } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });
  const { data: client } = useWalletClient();
  const [target, setTarget] = useState<string | null>(null);
  const [radio, setRadio] = useState<number>(0);
  const [user, setUser] = useState<string>("select");
  const [userMove, setUserMove] = useState<string>("");
  const [selectedDeploy, setSelectedDeploy] = useState<Deployement | null>(
    null
  );
  const [stake, setStake] = useState<string>("");
  const [winner, setWinner] = useState<string>("");
  const [deployements, setDeployements] = useState<Array<Deployement> | null>(
    null
  );
  console.log("HEH", winner);

  const config = {
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
    network: Network.ETH_GOERLI,
  };
  const alchemy = new Alchemy(config);

  //references for buttons
  const refTimeout = useRef<HTMLButtonElement>(null);
  const refReveal = useRef<HTMLButtonElement>(null);
  const refPlay = useRef<HTMLButtonElement>(null);
  const refDeploy = useRef<HTMLButtonElement>(null);
  const refBack = useRef<HTMLButtonElement>(null);

  //contract read hooks and their respective sideEffect

  const { data: j1 } = useContractRead({
    address: selectedDeploy?.address as `0x${string}`,
    abi: contractabi.abi,
    functionName: "j1",
  });

  const { data: j2 } = useContractRead({
    address: selectedDeploy?.address as `0x${string}`,
    abi: contractabi.abi,
    functionName: "j2",
  });

  //last Action timestamp
  const { data: lastAction } = useContractRead({
    watch: true,
    address: selectedDeploy?.address as `0x${string}`,
    abi: contractabi.abi,
    functionName: "lastAction",
  });

  console.log("EBER", lastAction);
  useEffect(() => {
    const difference = Math.floor(Date.now() / 1000) - Number(lastAction);
    setDiff(difference);

    console.log("HEY LAST ACTION CHECK ", lastAction);

    if (selectedDeploy) fetchContractTx(selectedDeploy);
  }, [lastAction]);

  const { data: c2 } = useContractRead({
    watch: true,
    address: selectedDeploy?.address as `0x${string}`,
    abi: contractabi.abi,
    functionName: "c2",
  });

  //Amount staked in the game
  const { data: stakedAmount } = useContractRead({
    address: selectedDeploy?.address as `0x${string}`,
    abi: contractabi.abi,
    functionName: "stake",
  });
  useEffect(() => {
    if (typeof stakedAmount === "bigint") setStake(formatEther(stakedAmount));
  }, [stakedAmount]);

  const { data: dataReads, error: errorReads } = useContractReads({
    watch: true,
    contracts: [
      {
        address: selectedDeploy?.address as `0x${string}`,
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
        address: selectedDeploy?.address as `0x${string}`,
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
        address: selectedDeploy?.address as `0x${string}`,
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
        address: selectedDeploy?.address as `0x${string}`,
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
        address: selectedDeploy?.address as `0x${string}`,
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
        functionName: "j1",
      },
    ],
  });

  //contract write hooks
  const { writeAsync: writePlay } = useContractWrite({
    abi: contractabi.abi,
    address: selectedDeploy?.address as `0x${string}`,
    functionName: "play",
  });

  const { writeAsync: writeReveal } = useContractWrite({
    abi: contractabi.abi,
    address: selectedDeploy?.address as `0x${string}`,
    functionName: "solve",
  });
  const { writeAsync: writej1Timeout } = useContractWrite({
    abi: contractabi.abi,
    address: selectedDeploy?.address as `0x${string}`,
    functionName: "j1Timeout",
  });

  const { writeAsync: writej2Timeout } = useContractWrite({
    abi: contractabi.abi,
    address: selectedDeploy?.address as `0x${string}`,
    functionName: "j2Timeout",
  });

  console.log("MOVE", userMove);
  //sideEffects
  useEffect(() => {
    let intervalId: any;
    if (!selectedDeploy) return;
    console.log("TRACKING DIFF", diff);
    if (diff > 60 * 5) {
      console.log("lastAction", c2);
      if (Number(c2) === 0) setIsCreator(false);
      else setIsCreator(true);
      setTimer(true);
      return;
    } else {
      intervalId = setInterval(() => setDiff(diff + 1), 1000);
    }
    return () => {
      clearInterval(intervalId);
    };
  }, [diff]);

  useEffect(() => {
    if (user === "select") {
      loadDeployements();
      refBack.current?.setAttribute("disabled", "");
    }
  }, [user]);

  console.log("deployements", deployements);
  useEffect(() => {
    if (!selectedDeploy) {
      resetGameStates();
    } else {
      const move = localStorage.getItem(
        selectedDeploy.address + ":" + address + ":move:"
      );
      console.log("MOVEEE", move);
      if (move?.length) setUserMove(move);
    }
  }, [selectedDeploy]);

  const resetGameStates = () => {
    setWinner("");
    setUserMove("");
    setDiff(0);
    setTimer(false);
  };
  //Functions
  useEffect(() => {
    loadDeployements();
    if (selectedDeploy) {
      const move = localStorage.getItem(
        selectedDeploy.address + ":" + address + ":move:"
      );
      if (move?.length) setUserMove(move);
    }
  }, [address]);

  const fetchContractTx = async (deployement: Deployement) => {
    const data = await alchemy.core.getAssetTransfers({
      fromBlock: "0x0",
      fromAddress: deployement.address,
      category: [
        "external",
        "internal",
        "erc20",
        "erc721",
        "erc1155",
      ] as Array<AssetTransfersCategory>,
    });
    const dataTo = await alchemy.core.getAssetTransfers({
      fromBlock: "0x0",
      toAddress: deployement.address,
      category: [
        "internal",
      ] as Array<AssetTransfersCategory>,
    });

    console.log("ABC", data);
    if (data.transfers.length) {
      if (data.transfers.length === 2) {
        setWinner("tie");
      } else data.transfers[0].to && setWinner(data.transfers[0].to);
    }
  };

  const handleSelection = async (deployement: Deployement) => {
    await fetchContractTx(deployement);
    setSelectedDeploy(deployement);
    setUser("init");
    refBack.current?.removeAttribute("disabled");
  };

  const loadDeployements = async () => {
    const result = await getDeployements();
    console.log("HERE", result);
    const data = await Promise.all(
      result.data.map((data: Deployement) => {
        return new Promise(async (resolve, reject) => {
          const j2Inner = await readContract({
            address: data.address as `0x${string}`,
            abi: contractabi.abi,
            functionName: "j2",
          });
          const j1Inner = await readContract({
            address: data.address as `0x${string}`,
            abi: contractabi.abi,
            functionName: "j1",
          });

          const fetchData = { ...data, j2: j2Inner, j1: j1Inner };
          resolve(fetchData);
        });
      })
    );
    console.log("Unfiltered", data);
    const filteredData = data.filter((element) => {
      return element.j1 == address || element.j2 == address;
    });
    console.log("FilteredData", filteredData);
    setDeployements(filteredData);
  };

  const handleCommit = async () => {
    if (!radio) {
      alert("Please select a move");
      return;
    }
    if (!balance) {
      alert("Your wallet doesnt have any ether");
      return;
    }
    if (!stake || stake === "0") {
      alert("Please Enter a stake amount");
      return;
    }
    if (parseFloat(formatEther(balance.value)) < parseFloat(stake)) {
      alert("Your stake amount is higher than your balance");
      return;
    }

    if (!target) {
      alert("Please enter a target player to invite");
      return;
    }

    if (!isAddress(target)) {
      alert("Target is not a valid ethereum address");
      return;
    }
    if (isAddressEqual(target as `0x${string}`, address as `0x${string}`)) {
      alert("Target and creator are same");
      return;
    }
    refDeploy.current?.setAttribute("disabled", "");
    if (client?.chain.id !== 5 || !address) {
      return;
    }
    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
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
    const deployAddress = await getContractAddress({
      from: address,
      nonce: bigNonce,
    });

    localStorage.setItem(
      deployAddress + ":" + address + ":move:",
      radio.toString()
    );
    localStorage.setItem(deployAddress + ":" + address + ":salt:", saltHex);
    const hash = await client?.deployContract({
      abi: contractabi.abi,
      account: address,
      args: [c1Hash, target as `0x${string}`],
      value: parseEther(stake),
      bytecode: contractabi.bytecode as `0x${string}`,
    });

    if (!hash) return;
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: hash,
      confirmations: 1,
    });

    const newDeployement: Deployement = {
      address: deployAddress,
      j1: address,
      j2: target,
    };
    const updation = await addDeployement(newDeployement);
    await fetchContractTx(newDeployement);
    setSelectedDeploy(newDeployement);
    setRadio(0);
    refDeploy.current?.removeAttribute("disabled");
    setUser("init");
  };

  const handleBack = () => {
    console.log("HERE", user);
    resetGameStates();
    setSelectedDeploy(null);
    setUser("select");
    setIsCreator(false)
  };

  const handleStake = async (e: ChangeEvent<HTMLInputElement>) => {
    setStake(e.target.value.toString());
  };
  const handleReveal = async () => {
    if (!selectedDeploy) return;

    const move = localStorage.getItem(
      selectedDeploy.address + ":" + address + ":move:"
    );
    const saltHex = localStorage.getItem(
      selectedDeploy.address + ":" + address + ":salt:"
    );
    if (!move) return;
    if (!saltHex) return;

    const salt = hexToBigInt(saltHex as `0x${string}`);

    refReveal.current?.setAttribute("disabled", "");

    if (!saltHex) return;

    const { hash } = await writeReveal({
      args: [parseInt(move), salt],
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      confirmations: 1,
      hash: hash,
    });

    refReveal.current?.removeAttribute("disabled");
  };

  console.log("CHECK ME", j1, j2, typeof j1, typeof address);
  const handlePlay = async () => {
    if (radio === 0) {
      alert("No option Selected");
      return;
    }
    localStorage.setItem(
      selectedDeploy?.address + ":" + address + ":move:",
      radio.toString()
    );
    refPlay.current?.setAttribute("disabled", "");
    const { hash } = await writePlay({
      args: [radio],
      value: parseEther(stake),
    });

    await publicClient.waitForTransactionReceipt({
      confirmations: 1,
      hash: hash,
    });

    //const {data, isLoading,isError,isSuccess} = useContractWrite({
    //  address:selectedDeploy?.address,
    //  value:
    //
    //})

    refPlay.current?.removeAttribute("disabled");
  };
  console.log("HERERER", isCreator);
  const handleTimeout = async () => {
    if (!selectedDeploy) return;

    refTimeout.current?.setAttribute("disabled", "");
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
    refTimeout.current?.removeAttribute("disabled");
    fetchContractTx(selectedDeploy);
  };

  return (
    <div className="w-[100vw] h-[100vh] flex flex-col">
      <div className="flex flex-row-reverse mt-4 mr-4">
        <ConnectButton />
        <button
          className="border-2 bg-blue-400 rounded-[10px] mx-3 w-[150px] mr-4"
          onClick={() => {
            setUser("select");
          }}
        >
          Flush Storage
        </button>
      </div>
      <div className="flex w-3/4 h-max mt-40 self-center justify-center">
        <div className="flex w-3/4 justify-center self-center r">
          <div>
            <button
              ref={refBack}
              className="outline-2 rounded-[10px] bg-blue-300 w-[100px] ml-4 disabled:bg-gray-300"
              onClick={() => handleBack()}
            >
              Go Back
            </button>
            <br></br>
            <br></br>
            <br></br>
            {!client ? (
              <div className="text-[40px] text-red-400">
                Please Connect Your Wallet
              </div>
            ) : client.chain?.id !== 5 ? (
              <div className="text-[40px] text-red-400">
                Please Select The Correct Chain
              </div>
            ) : user === "select" ? (
              <div>
                {deployements &&
                  deployements.length > 0 && ( //List existing Games if in selection stage and previous deployements exists
                    <div>
                      <p>Select Existing Game </p>
                      {deployements.map((deployement, index) => (
                        <div className="flex flex-row my-2 " key={index}>
                          <p>{deployement.address}</p>
                          <button
                            className="outline-2 rounded-[10px] bg-blue-300 w-[100px] ml-4 disabled:bg-gray-300"
                            onClick={() => {
                              handleSelection(deployement);
                            }}
                          >
                            Select
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                <button
                  className="border-2 bg-blue-400 disabled:bg-gray-300 rounded-[10px] w-[200px]"
                  onClick={() => {
                    console.log(refBack.current);
                    refBack.current?.removeAttribute("disabled");
                    setSelectedDeploy(null);
                    setUser("init");
                  }}
                >
                  Start New Game
                </button>
              </div>
            ) : (
              //Initial user stage when a contract is selected or a new game is selected
              <div>
                {selectedDeploy?.address ? ( //If a selectedDeploy.address is selected and its data has been fetched i
                  <>
                    {userMove !== "0" && <div>Your move: {userMove}</div>}
                    {Number(c2) !== 0 && address == selectedDeploy.j1 && (
                      <div>Enemy move: {Number(c2).toString()}</div>
                    )}
                    {
                      winner !== "" ? <div></div> : <div></div>
                      /**winner !== "" ? (
                        winner === "tie" ? (
                          <div>Its a Tie</div>
                        ) : winner == address?.toLowerCase() ? (
                          <div>You Got the Funds</div>
                        ) : (
                          <div>{winner + " "}Received the Funds</div>
                        ) // Whether the timer has expired
                      )  */
                    }
                    {winner !== "" ? (
                      winner === "tie" ? (
                        <div>Its a Tie</div>
                      ) : winner == address?.toLowerCase() ? (
                        <div>You are the winner!</div>
                      ) : c2 && Number(c2) === 0 ? (
                        <div>You Didnt join the game and it timed out</div>
                      ) : (
                        <div>You lost</div>
                      )
                    ) : timer ? (
                      <>
                        <div className="flex flex-col items-center text-[30px] text-blue-600">
                          Turn has expired for the{" "}
                          {!isCreator ? "Player." : "Creator."} Please call the
                          timeout function
                          <button
                            ref={refTimeout}
                            className="mt-4 text-black border-2 rounded-[10px] bg-blue-700 w-[200px] disabled:bg-gray-300"
                            onClick={() => {
                              handleTimeout();
                            }}
                          >
                            Call Timeout
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>Time Elapsed in seconds : {diff} seconds</div>
                        {user === "init" && ( //If user is in init stage
                          <>
                            {address === j2 && (
                              <>
                                {!c2 && (
                                  <RadioGroup
                                    radio={radio}
                                    setRadio={setRadio}
                                  />
                                )}
                                <button
                                  className="border-2 bg-blue-400 disabled:bg-gray-300 rounded-[10px] w-[100px]"
                                  ref={refPlay}
                                  onClick={handlePlay}
                                  disabled={address !== j2 || Number(c2) !== 0}
                                >
                                  Play
                                </button>
                              </>
                            )}
                            {address === j1 && (
                              <button
                                onClick={handleReveal}
                                disabled={address !== j1 || Number(c2) === 0}
                                className="border-2 bg-blue-400 disabled:bg-gray-300 rounded-[10px] w-[100px]"
                              >
                                Reveal
                              </button>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  user === "init" && (
                    //if no contract address is selected then new game is to be started
                    <div className="flex flex-col">
                      <RadioGroup radio={radio} setRadio={setRadio} />

                      <label className="mt-4">Enter amount to Stake</label>
                      <input
                        value={stake}
                        className="border-2 rounded-[10px]"
                        type="number"
                        onChange={(e) => {
                          handleStake(e);
                        }}
                        step={0.001}
                      ></input>
                      <label className="mt-4">Enter address to challenge</label>
                      <input
                        className="border-2 rounded-[10px]"
                        type="string"
                        onChange={(e) => {
                          setTarget(e.currentTarget.value);
                        }}
                        step={0.001}
                      ></input>
                      <button
                        ref={refDeploy}
                        className="border-2 mt-4 bg-amber-300 disabled:bg-gray-300 rounded-[10px] w-[80px]"
                        onClick={() => {
                          handleCommit();
                        }}
                      >
                        Confirm
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(Home), { ssr: false });
