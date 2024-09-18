var walletAddress;
var form__1 = document.getElementById("form__1");
var form__2 = document.getElementById("form__2");
var form__3 = document.getElementById("form__3");
var BALANCE;
let provider;

const weiToEther = (value) => Number(ethers.utils.formatEther(value)).toFixed(2);
const etherToWei = (value) => ethers.utils.parseEther(value.toString());

function formatNumber(value) {
  // Define the thresholds for thousands, millions, and billions
  const thresholds = {
    billion: 1e9,   // 1 billion
    million: 1e6,   // 1 million
    thousand: 1e3   // 1 thousand
  };

  // Check and format the value based on the thresholds
  if (value >= thresholds.billion) {
    return (value / thresholds.billion).toFixed(2) + ' Billion';
  } else if (value >= thresholds.million) {
    return (value / thresholds.million).toFixed(2) + ' Million';
  } else if (value >= thresholds.thousand) {
    return (value / thresholds.thousand).toFixed(2) + ' Thousand';
  } else {
    return value.toFixed(2); // If less than 1,000, just return the number with 2 decimal places
  }
}

function showNotification(message) {
  const notification = document.getElementById("notification");
  notification.innerText = message;
  notification.style.display = "block";

  setTimeout(() => {
    notification.style.display = "none";
  }, 10000);
}

function tnxNotification(message) {
  const notification = document.getElementById("notification");
  notification.innerText = message;
  notification.style.display = "block";

  setTimeout(() => {
    notification.style.display = "none";
  }, 100000);
}

document.addEventListener("DOMContentLoaded", async function () {
  await Connect();
});

async function Connect() {
  if (typeof window.ethereum !== "undefined") {
    try {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);

      const signer = provider.getSigner();
      walletAddress = await signer.getAddress();

      const network = await provider.getNetwork();
      // Check for BSC testnet (networkId 97)
      if (network.chainId !== 11155111) {
        showNotification("Please switch to Bsc Testnet.");
        return;
      }

      await Total(walletAddress);
      await getUserTokenBalance(walletAddress);
      await userData(walletAddress);

      const smallButton = document.getElementById("smallButtonText");
      smallButton.innerText = smShortenAddress(walletAddress);

      const buttonText = document.getElementById("buttonText");
      buttonText.innerText = shortenAddress(walletAddress);
    } catch (error) {
      console.error("Error connecting to wallet:", error);
    }
  } else {
    alert("MetaMask is not installed.");
  }
}

// HANDLE FORM SUBMISSION
form__1.addEventListener("submit", async function (event) {
  event.preventDefault();
  if (!walletAddress) {
    showNotification("Please connect your wallet first");
    return;
  }

  const stakingId = 0;
  const amount = document.getElementById("amount__1").value;

  if (amount < 100) {
    showNotification("Amount must be greater than 100");
    return;
  }
  if (Number(BALANCE) < Number(amount)) {
    showNotification("Insufficient balance");
    return;
  }

  try {
    await approveSpendingCap(amount, stakingId);
    await Total(walletAddress);
    await getUserTokenBalance(walletAddress);
    await userData(walletAddress);
  } catch (error) {
    console.error("Error staking:", error);
  }
});

form__2.addEventListener("submit", async function (event) {
  event.preventDefault();
  if (!walletAddress) {
    showNotification("Please connect your wallet first");
    return;
  }
  const stakingId = 1;
  const amount = document.getElementById("amount__2").value;

  if (amount < 10000000) {
    showNotification("Amount must be greater than 10,000,000");
    return;
  }
  if (Number(BALANCE) < Number(amount)) {
    showNotification("Insufficient balance");
    return;
  }

  try {
    await approveSpendingCap(amount, stakingId);
    await Total(walletAddress);
    await getUserTokenBalance(walletAddress);
    await userData(walletAddress);
  } catch (error) {
    console.error("Error staking:", error);
  }
});

form__3.addEventListener("submit", async function (event) {
  event.preventDefault();
  if (!walletAddress) {
    showNotification("Please connect your wallet first");
    return;
  }
  const stakingId = 2;
  const amount = document.getElementById("amount__3").value;

  if (amount < 25000000) {
    showNotification("Amount must be greater than 25,000,000");
    return;
  }
  if (Number(BALANCE) < Number(amount)) {
    showNotification("Insufficient balance");
    return;
  }

  try {
    await approveSpendingCap(amount, stakingId);
    await Total(walletAddress);
    await getUserTokenBalance(walletAddress);
    await userData(walletAddress);
  } catch (error) {
    console.error("Error staking:", error);
  }
});

async function userData(address) {
  if (!address) {
    showNotification("Please connect your wallet first");
    return;
  }
  try {
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    const stakeA = await contract.canWithdrawAmount(0, address);
    const stakeB = await contract.canWithdrawAmount(1, address);
    const stakeC = await contract.canWithdrawAmount(2, address);

    document.getElementById("planAStake").innerText = weiToEther(stakeA[0]);
    document.getElementById("planA1Stake").innerText = weiToEther(stakeA[0]);
    document.getElementById("planBStake").innerText = weiToEther(stakeB[0]);
    document.getElementById("planB2Stake").innerText = weiToEther(stakeB[0]);
    document.getElementById("planCStake").innerText = weiToEther(stakeC[0]);
    document.getElementById("planC3Stake").innerText = weiToEther(stakeC[0]);

    const planA = await contract.earnedToken(0, address);
    const planB = await contract.earnedToken(1, address);
    const planC = await contract.earnedToken(2, address);

    document.getElementById("planA").innerText = weiToEther(planA);
    document.getElementById("planB").innerText = weiToEther(planB);
    document.getElementById("planC").innerText = weiToEther(planC);
  } catch (e) {
    console.log(e);
    showNotification("Error fetching user data");
  }
}

async function unStake(stakingId, planId) {
  if (walletAddress) {
    try {
      const amount = document.getElementById(planId).innerText;
      if (amount <= 0) {
        showNotification("You have no stake in this plan");
        return;
      }

      const adjustedAmountStr = (parseFloat(amount) - parseFloat(amount) * 0.001).toFixed(18);
      const weiValue = ethers.utils.parseEther(adjustedAmountStr);

      tnxNotification("Transaction sent to wallet, please confirm...");
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      await contract.unstake(stakingId, weiValue);

      showNotification("Unstaked successfully");
      await Total(walletAddress);
      await getUserTokenBalance(walletAddress);
      await userData(walletAddress);
    } catch (err) {
      console.error("Error unstaking:", err);
      tnxNotification("Error unstaking");
    }
  } else {
    showNotification("Please connect your wallet first");
  }
}

async function reStake(stakingId) {
  if (walletAddress) {
    try {
      const signer = provider.getSigner();
      showNotification("Restaking, please don't close the window. This may take a while.");
      const contract = new ethers.Contract(contractAddress, abi, signer);
      await contract.reStake(stakingId);
      showNotification("Restaked successfully");
      await Total(walletAddress);
      await getUserTokenBalance(walletAddress);
      await userData(walletAddress);
    } catch (err) {
      console.error("Error restaking:", err);
      showNotification("Error restaking");
    }
  } else {
    showNotification("Please connect your wallet first");
  }
}

async function withdraw(stakingId) {
  if (walletAddress) {
    try {
      showNotification("Withdrawing, please don't close the window. This may take a while.");
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      await contract.claimEarned(stakingId);
      showNotification("Claimed successfully");
      await Total(walletAddress);
      await getUserTokenBalance(walletAddress);
      await userData(walletAddress);
    } catch (err) {
      console.error("Error claiming:", err);
      tnxNotification("Error claiming");
    }
  } else {
    showNotification("Please connect your wallet first");
  }
}

async function approveSpendingCap(amount, stakingId) {
  if (walletAddress) {
    try {
      const signer = provider.getSigner();
      const TokenContract = new ethers.Contract(tokenContract, tokenAbi, signer);
      const amountInWei = ethers.utils.parseEther(amount);

      tnxNotification("Approving spending cap, please don't close the window. This may take a while.");
     const spendingTnx = await TokenContract.approve(contractAddress, amountInWei);
     await spendingTnx.wait();
      showNotification("Spending cap approved");

      showNotification("Staking in process, please don't close the window. This may take a while.");
      const contract = new ethers.Contract(contractAddress, abi, signer);
     const tnx = await contract.stake(stakingId, amountInWei);
     await tnx.wait();
      showNotification("Staked successfully");
      await Total(walletAddress);
      await getUserTokenBalance(walletAddress);
      await userData(walletAddress);

    } catch (err) {
      console.error("Error approving spending cap:", err);
      tnxNotification("Error approving spending cap");
    }
  } else {
    showNotification("Please connect your wallet first");
  }
}

async function getUserStakes(address) {
  try {
    // Create a contract instance using ethers.js
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    // Fetch the user's stakes from the contract
    const stakes = await contract.getUserStakes(address);

    // Convert the stake amount from wei to ether
    return ethers.utils.formatEther(stakes);
  } catch (error) {
    console.error("Error fetching user stakes:", error);
    return 0; // Handle error gracefully
  }
}
async function Total(address) {
  try {
    // Check if ethers is initialized by checking if a provider exists
    const signer = provider.getSigner();
    // Create a contract instance using ethers.js
    const contract = new ethers.Contract(contractAddress, abi, signer);

    // Fetch the total balance and stakable amounts from the contract
    const total = await contract.getBalance();
    const stake1 = await contract.canWithdrawAmount(0, address);
    const stake2 = await contract.canWithdrawAmount(1, address);
    const stake3 = await contract.canWithdrawAmount(2, address);

    // Convert the values from BigNumber and calculate user's total stakable amount
    let userTotal =
      BigInt(stake1[0]) + BigInt(stake2[0]) + BigInt(stake3[0]);

      

    // Update the total staked tokens on the UI
    const totalTokenStakedButton = document.getElementById("totalTokenStaked");
    totalTokenStakedButton.innerText = formatNumber(ethers.utils.formatEther(total));

    // Update the user's total stakable amount on the UI
    const userTotalElement = document.getElementById("userTotal");
    userTotalElement.innerText = formatNumber(ethers.utils.formatEther(userTotal.toString()));
  } catch (error) {
    console.error("Error fetching total rewards:", error);
  }
}

async function getUserTokenBalance(address) {
  try {
    const signer = provider.getSigner();
    const tokwn = new ethers.Contract(tokenContract, St, signer);

    const balanceWei = await tokwn.balanceOf(address);


    const balanceEth = ethers.utils.formatEther(balanceWei);

    updateUserBalanceDisplay(balanceEth);

    BALANCE = balanceEth;
  } catch (error) {
    console.error("Error fetching user token balance:", error);
  }
}

function updateUserBalanceDisplay(balance) {
  // Get all elements with the class 'userBalance'
  const balanceElements = document.getElementsByClassName("userBalance");

  // Iterate over each element and update the inner HTML with the user's balance
  Array.from(balanceElements).forEach((element) => {
    if (element) {
      element.innerHTML = balance;
    }
  });
}





function shortenAddress(address) {
  if (address.length <= 9) {
    return address; // Address is already short
  }
  const firstFour = address.slice(0, 4);
  const lastFive = address.slice(-5);
  return `${firstFour}...${lastFive}`;
}

function smShortenAddress(address) {
  if (address.length <= 9) {
    return address; // Address is already short
  }
  const firstFour = address.slice(0, 3);
  const lastFive = address.slice(-3);
  return `${firstFour}...${lastFive}`;
}

const contractAddress = "0xefc86ED17cD8740503b4ffEDcF4429ae98e9110E";
const abi = [
  {
    inputs: [
      { internalType: "address", name: "_stakingToken", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [{ internalType: "address", name: "_address", type: "address" }],
    name: "addToBlacklist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "blacklist",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_stakingId", type: "uint256" },
      { internalType: "address", name: "account", type: "address" },
    ],
    name: "canWithdrawAmount",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_stakingId", type: "uint256" }],
    name: "claimEarned",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_stakingId", type: "uint256" },
      { internalType: "address", name: "account", type: "address" },
    ],
    name: "earnedToken",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_account", type: "address" }],
    name: "getStakedPlans",
    outputs: [{ internalType: "bool[]", name: "", type: "bool[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_wallet", type: "address" }],
    name: "getTotalEarnedRewardsPerWallet",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalRewards",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_stakingId", type: "uint256" }],
    name: "getTotalRewardsPerPlan",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "periodicTime",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "planLimit",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "plans",
    outputs: [
      { internalType: "uint256", name: "overallStaked", type: "uint256" },
      { internalType: "uint256", name: "stakesCount", type: "uint256" },
      { internalType: "uint256", name: "apr", type: "uint256" },
      { internalType: "uint256", name: "stakeDuration", type: "uint256" },
      { internalType: "bool", name: "initialPool", type: "bool" },
      { internalType: "bool", name: "conclude", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_stakingId", type: "uint256" }],
    name: "reStake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_address", type: "address" }],
    name: "removeFromBlacklist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_stakingId", type: "uint256" },
      { internalType: "uint256", name: "_percent", type: "uint256" },
    ],
    name: "setAPR",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_stakingId", type: "uint256" },
      { internalType: "bool", name: "_conclude", type: "bool" },
    ],
    name: "setStakeConclude",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_stakingId", type: "uint256" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
    ],
    name: "stake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_stakingId", type: "uint256" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
      { internalType: "address", name: "_beneficiary", type: "address" },
    ],
    name: "stakeFor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "stakedBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "stakes",
    outputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "stakeAt", type: "uint256" },
      { internalType: "uint256", name: "endstakeAt", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "stakingToken",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "totalEarnedRewardsPerWallet",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalRewards",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "totalRewardsPerPlan",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "address", name: "", type: "address" },
    ],
    name: "totalRewardsPerWalletPerPlan",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_stakingId", type: "uint256" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
    ],
    name: "unstake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_tokenContract", type: "address" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
    ],
    name: "withdrawToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  { stateMutability: "payable", type: "receive" },
];
const tokenContract = "0x29c18373aA68Bf94301b5C11E4ddbd47181FC438";
const tokenAbi = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "name": "balance",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "spender",
        "type": "address"
      },
      {
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "name": "success",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
]


const St = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "name": "balance",
        "type": "uint256"
      }
    ],
    "type": "function"
  }
]


