import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import { reset } from "./frontend-services/localServices";
import dynamic from "next/dynamic";
const web3 = require("web3");
import Head from "next/head";
import RadioGroup from "./components/Radio";
import { ChangeEvent, useEffect, useState, useRef } from "react";
import {
  useAccount,
  useBalance,
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
  isAddress,
  isAddressEqual,
} from "viem";
import contractabi from "../contractabi.json";
import {
  addDeployement,
  getDeployements,
  removeDeployement,
} from "./frontend-services/mongoServices";

export type Deployement = {
  creator: string;
  address: string;
};
const Home: NextPage = () => {
  //states
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
  const [selectedDeploy, setSelectedDeploy] = useState<Deployement | null>(
    null
  );
  const [stake, setStake] = useState<string>("");
  const [deployements, setDeployements] = useState<Array<Deployement> | null>(
    null
  );

  //references for buttons
  const refTimeout = useRef<HTMLButtonElement>(null);
  const refReveal = useRef<HTMLButtonElement>(null);
  const refPlay = useRef<HTMLButtonElement>(null);
  const refDeploy = useRef<HTMLButtonElement>(null);
  const refBack = useRef<HTMLButtonElement>(null);

  //contract reads
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

  //sideEffects
  useEffect(() => {
    if (!dataReads) return;
    if (dataReads[0] && typeof dataReads[0].result === "bigint")
      setStake(formatEther(dataReads[0].result));
    if (dataReads[2] && typeof dataReads[2].result === "bigint") {
      const difference =
        Math.floor(Date.now() / 1000) - Number(dataReads[2].result);

      setDiff(difference);
    }
  }, [dataReads]);

  useEffect(() => {
    const intervalId = setInterval(() => setDiff(diff + 1), 1000);

    if (diff > 60 * 5 && dataReads) {
      if (dataReads[1] && Number(dataReads[1].result) === 0)
        setIsCreator(false);
      else setIsCreator(true);
      setTimer(true);
    }
    return () => {
      clearInterval(intervalId);
    };
  }, [diff]);

  useEffect(() => {
    loadDeployements();
  }, []);

  //Functions
  const loadDeployements = async () => {
    const result = await getDeployements();
    setDeployements(result.data);
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
    refDeploy.current?.setAttribute("disabled", "true");
    if (client?.chain.id !== 5 || !address) {
      return;
    }
    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

    localStorage.setItem("c1Move", radio.toString());
    const signature = await client?.signMessage({ message: nonce });
    if (!signature) return;
    const saltHex = hashMessage(signature);
    const salt = hexToBigInt(saltHex);
    const c1Hash = web3.utils.soliditySha3(
      { t: "uint8", v: radio },
      { t: "uint256", v: salt }
    );
    localStorage.setItem("salt:" + address, saltHex);
    const txNonce = await publicClient.getTransactionCount({
      address: address,
    });
    const bigNonce = BigInt(txNonce);
    const deployAddress = await getContractAddress({
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

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: hash,
      confirmations: 1,
    });

    const newDeployement: Deployement = {
      creator: address,
      address: deployAddress,
    };
    const updation = await addDeployement(newDeployement);
    setUser("select");
    await loadDeployements();
    setRadio(0);
    refDeploy.current?.setAttribute("disabled", "false");
  };

  const handleBack = () => {
    if (user !== "init") setUser("init");
    else {
      setSelectedDeploy(null);
      setUser("select");
      refBack.current?.setAttribute("disabled","true")
    }
  };

  const handleStake = async (e: ChangeEvent<HTMLInputElement>) => {
    setStake(e.target.value.toString());
  };
  const handleReveal = async () => {
    if (!selectedDeploy) return;

    const move = localStorage.getItem("c1Move");
    const saltHex = localStorage.getItem("salt:" + address);
    if (!move) return;
    if (!saltHex) return;

    const salt = hexToBigInt(saltHex as `0x${string}`);

    refReveal.current?.setAttribute("disabled", "true");

    if (!saltHex) return;

    const { hash } = await writeReveal({
      args: [parseInt(move), salt],
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      confirmations: 1,
      hash: hash,
    });

    await removeDeployement(selectedDeploy);
    loadDeployements();
    reset();
    setUser("select");

    refReveal.current?.setAttribute("disabled", "false");
  };

  const handlePlay = async () => {
    if (radio === 0) {
      alert("No option Selected");
      return;
    }

    refPlay.current?.setAttribute("disabled", "true");
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
    setUser("select");
    refPlay.current?.setAttribute("disabled", "false");
  };

  const handleTimeout = async () => {
    if (!selectedDeploy) return;

    refTimeout.current?.setAttribute("disabled", "true");
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
    await removeDeployement(selectedDeploy);
    reset();
    setUser("select");
    loadDeployements();
    refTimeout.current?.setAttribute("disabled", "false");
  };

  return (
    <div className="w-[100vw] h-[100vh] flex flex-col">
      <div className="flex flex-row-reverse mt-4 mr-4">
        <ConnectButton />
        <button
          className="border-2 bg-blue-400 rounded-[10px] mx-3 w-[150px] mr-4"
          onClick={() => {
            setUser("select");
            reset();
          }}
        >
          Flush Storage
        </button>
      </div>
      <div className="flex w-3/4 h-max mt-40 self-center justify-center">
        <div className="flex w-3/4 justify-center self-center r">
          <div>
          <button className="outline-2 rounded-[10px] bg-blue-300 w-[100px] ml-4 disabled:bg-gray-300" disabled={true} onClick={handleBack}>
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
            ) : user === "select" && client?.chain?.id === 5 ? (
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
                              setSelectedDeploy(deployement);
                              setUser("init");
                              refBack.current?.setAttribute("disabled","false")
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
                {selectedDeploy?.address && dataReads ? ( //If a selectedDeploy.address is selected and its data has been fetched i
                  <>
                    {timer ? ( // Whether the timer has expired
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
                        {user === "init" ? ( //If user is in init stage
                          <>
                            {address === dataReads[3].result && (
                              <button
                                className="border-2 bg-blue-400 disabled:bg-gray-300 rounded-[10px] w-[100px]"
                                onClick={() => {
                                  setUser("play");
                                }}
                                disabled={
                                  address !== dataReads[3].result ||
                                  Number(dataReads[1].result) !== 0
                                }
                              >
                                Play
                              </button>
                            )}
                            {address === dataReads[4].result && (
                              <button
                                onClick={() => setUser("reveal")}
                                disabled={
                                  address !== dataReads[4].result ||
                                  Number(dataReads[1].result) === 0
                                }
                                className="border-2 bg-blue-400 disabled:bg-gray-300 rounded-[10px] w-[100px]"
                              >
                                Reveal
                              </button>
                            )}
                          </>
                        ) : user === "play" ? (
                          <>
                            <RadioGroup radio={radio} setRadio={setRadio} />
                            <button
                              ref={refPlay}
                              onClick={handlePlay}
                              className="border-2 bg-blue-400 disabled:bg-gray-300 rounded-[10px] w-[100px]"
                            >
                              Play
                            </button>
                          </>
                        ) : (
                          user === "reveal" && (
                            <div>
                              Reveal Choice
                              <button
                                ref={refReveal}
                                onClick={handleReveal}
                                className="border-2 bg-blue-400 disabled:bg-gray-300 rounded-[10px] w-[100px]"
                              >
                                Reveal
                              </button>
                            </div>
                          )
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
