import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import dynamic from "next/dynamic";
const web3 = require("web3");
import RadioGroup from "./components/Radio";
import { ChangeEvent, useEffect, useState, useRef } from "react";
import {
  useAccount,
  useBalance,
  useContractRead,
  useContractWrite,
  usePublicClient,
  useWalletClient,
  useWaitForTransaction,
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
} from "viem";
import contractabi from "../contractabi.json";
import {
  addDeployement,
  getDeployements,
} from "../frontend-services/mongoServices";

import { Alchemy, AssetTransfersCategory, Network } from "alchemy-sdk";
import { commitValidation } from "../frontend-services/validationServices";

export type Deployement = {
  address: string;
  j1: string;
  j2?: string;
};

const Home: NextPage = () => {
  //Wagi Hook States

  //UI States
  const [pendingTx, setPendingTx] = useState<`0x${string}` | undefined>();
  const [isBack, setIsBack] = useState(false);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [deployements, setDeployements] = useState<Deployement[] | null>(null);

  //Form states
  const [target, setTarget] = useState<string | null>(null);
  const [radio, setRadio] = useState<number>(0);

  //Selected Contract states
  const [timer, setTimer] = useState<boolean>(false);
  const [diff, setDiff] = useState<number>(0);
  const [isCreator, setIsCreator] = useState<boolean>(false);
  const [user, setUser] = useState<string>("select");
  const [userMove, setUserMove] = useState<string>("");
  const [selectedDeploy, setSelectedDeploy] = useState<Deployement | null>(
    null
  );
  const [stake, setStake] = useState<string>("");
  const [winner, setWinner] = useState<string>("");

  //Wagmi Hooks

  //State Initialise Hooks
  const publicClient = usePublicClient({ chainId: 5 });
  const { data: client } = useWalletClient();
  const { address } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });

  //Pending transaction watcher
  const { data: txData, error: pendingError } = useWaitForTransaction({
    hash: pendingTx,
    onReplaced: async (data) => {
      console.log("REPLACED", data);
    },
    onSuccess: async (data) => {
      console.log("SUCCESS", data);
      if (data.to === null) {
        if (!data.from || !data.contractAddress) return;
        const newDeployement: Deployement = {
          address: data.contractAddress as string,
          j1: data.from as string,
        };
        const updation = await addDeployement(newDeployement);
        setSelectedDeploy(newDeployement);
      }
      setPendingTx(undefined);
      localStorage.setItem("pendingTx", "");
    },
    onError: (data) => {
      console.log("Error", data);
      setIsDisabled(false);
      setPendingTx(undefined);
      localStorage.setItem("pendingTx", "");
    },
  });

  //Contract Read Hooks

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

  const { data: lastAction } = useContractRead({
    watch: true,
    address: selectedDeploy?.address as `0x${string}`,
    abi: contractabi.abi,
    functionName: "lastAction",
  });

  const { data: c2 } = useContractRead({
    watch: true,
    address: selectedDeploy?.address as `0x${string}`,
    abi: contractabi.abi,
    functionName: "c2",
  });

  const { data: stakedAmount } = useContractRead({
    watch: true,
    address: selectedDeploy?.address as `0x${string}`,
    abi: contractabi.abi,
    functionName: "stake",
  });

  //Contract Write Hooks
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

  //Constants
  const moveKey =
    selectedDeploy?.address.toLowerCase() +
    ":" +
    address?.toLowerCase() +
    ":move:";
  const saltHexKey =
    selectedDeploy?.address.toLowerCase() +
    ":" +
    address?.toLowerCase() +
    ":salt:";

  const config = {
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
    network: Network.ETH_GOERLI,
  };
  const alchemy = new Alchemy(config);

  //Side Effects

  useEffect(() => {
    if (pendingTx) {
      setIsDisabled(true);
    } else {
      const abc = localStorage.getItem("pendingTx");
      if (abc && abc !== "") {
        setPendingTx(abc as `0x${string}`);
      }
      setIsDisabled(false);
    }
  }, [pendingTx]);

  useEffect(() => {
    let intervalId: any;
    if (!selectedDeploy) return;
    if (diff > 60 * 5 + 2) {
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
      setIsBack(false);
    } else {
      setIsBack(true);
    }
  }, [user]);

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

  useEffect(() => {
    if (typeof stakedAmount === "bigint") setStake(formatEther(stakedAmount));
    if (selectedDeploy) fetchContractTx(selectedDeploy);
  }, [stakedAmount]);

  useEffect(() => {
    loadDeployements();
    loadMove();
  }, [address]);

  useEffect(() => {
    const difference = Math.floor(Date.now() / 1000) - Number(lastAction);
    setDiff(difference);
    loadMove();
  }, [lastAction]);

  //Functions

  //UI-Workers
  const handleBack = () => {
    resetGameStates();
    setSelectedDeploy(null);
    setUser("select");
    setIsCreator(false);
  };

  const loadMove = () => {
    if (selectedDeploy) {
      const move = localStorage.getItem(
        selectedDeploy.address + ":" + address + ":move:"
      );
      if (move?.length) setUserMove(move);
    }
  };

  //Form update Handlers

  const handleStake = async (e: ChangeEvent<HTMLInputElement>) => {
    setStake(e.target.value.toString());
  };

  const handleSelection = async (deployement: Deployement) => {
    await fetchContractTx(deployement);
    setSelectedDeploy(deployement);
    setUser("init");
    setIsBack(true);
  };

  const resetGameStates = () => {
    setWinner("");
    setUserMove("");
    setDiff(0);
    setTimer(false);
  };

  //Data Fetching Functions

  const loadDeployements = async () => {
    const result = await getDeployements();
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
    const filteredData = data.filter((element) => {
      return element.j1 == address || element.j2 == address;
    });
    setDeployements(filteredData);
  };

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
    if (data.transfers.length) {
      if (data.transfers.length === 2) {
        setWinner("tie");
      } else data.transfers[0].to && setWinner(data.transfers[0].to);
    }
  };

  //Transaction submit Button Handlers
  const handleCommit = async () => {
    if (!balance) {
      alert("Cannot Fetch your balance");
      return;
    }
    if (client?.chain.id !== 5 || !address) {
      return;
    }
    const isValidated = commitValidation(
      radio,
      balance.value,
      stake,
      target,
      address as string
    );
    if (!isValidated) return;

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

    const deployAddress = getContractAddress({
      from: address,
      nonce: BigInt(txNonce),
    });

    localStorage.setItem(
      deployAddress.toLowerCase() + ":" + address.toLowerCase() + ":move:",
      radio.toString()
    );
    localStorage.setItem(
      deployAddress.toLowerCase() + ":" + address.toLowerCase() + ":salt:",
      saltHex
    );
    let hash;
    try {
      const txHash = await client?.deployContract({
        abi: contractabi.abi,
        account: address,
        args: [c1Hash, target as `0x${string}`],
        value: parseEther(stake),
        bytecode: contractabi.bytecode as `0x${string}`,
      });
      hash = txHash;
    } catch (error) {
      return;
    }

    if (!hash) return;

    setPendingTx(hash);
  };

  const handleReveal = async () => {
    if (!selectedDeploy) return;
    const move = localStorage.getItem(moveKey);
    const saltHex = localStorage.getItem(saltHexKey);
    if (!move) return;
    if (!saltHex) return;

    const salt = hexToBigInt(saltHex as `0x${string}`);
    let hash;
    try {
      const { hash: txHash } = await writeReveal({
        args: [parseInt(move), salt],
      });
      hash = txHash;
    } catch (error) {
      return;
    }

    setPendingTx(hash);
    localStorage.setItem("pendingTx", hash as string);
  };

  const handlePlay = async () => {
    if (radio === 0) {
      alert("No option Selected");
      return;
    }
    localStorage.setItem(moveKey, radio.toString());
    let hash;
    try {
      const { hash: txHash } = await writePlay({
        args: [radio],
        value: parseEther(stake),
      });
      hash = txHash;
    } catch (error) {
      return;
    }

    setPendingTx(hash);
    localStorage.setItem("pendingTx", hash as string);
  };
  
  const handleTimeout = async () => {
    if (!selectedDeploy) return;

    let txHash;

    if (isCreator) {
      try {
        const { hash } = await writej1Timeout();
        txHash = hash;
      } catch (error) {
        return;
      }
    } else {
      try {
        const { hash } = await writej2Timeout();
        txHash = hash;
      } catch (error) {
        return;
      }
    }
    setPendingTx(txHash);
    localStorage.setItem("pendingTx", txHash as string);
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
              disabled={!isBack}
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
                    <div>
                      Staked amount is{" "}
                      {typeof stakedAmount === "bigint"
                        ? formatEther(stakedAmount)
                        : "0"}
                    </div>
                    {userMove !== "0" && <div>Your move: {userMove}</div>}
                    {Number(c2) !== 0 && address == selectedDeploy.j1 && (
                      <div>Enemy move: {Number(c2).toString()}</div>
                    )}
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
                            disabled={isDisabled}
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
                                  onClick={handlePlay}
                                  disabled={
                                    address !== j2 ||
                                    Number(c2) !== 0 ||
                                    isDisabled
                                  }
                                >
                                  Play
                                </button>
                              </>
                            )}
                            {address === j1 && (
                              <button
                                onClick={handleReveal}
                                disabled={
                                  address !== j1 ||
                                  Number(c2) === 0 ||
                                  isDisabled
                                }
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
                        disabled={isDisabled}
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
