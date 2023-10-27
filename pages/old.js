/*{!address || !client ? (
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
          )}*/