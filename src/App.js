import React, { useState, useEffect } from 'react';
import './App.css';
import backgroundImage from './BG.avif';
import Web3 from 'web3';
import contractABI from './CoinFlipGameABI.json';
import tozzerTokenABI from './TozzerTokenABI.json';
import MetaMaskIcon from './metaMaskIcon.png';

function App() {

  const containerStyle = {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    opacity: 0.8,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    minHeight: '100vh', 
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column', 
  };

  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gameData, setGameData] = useState(null);
  const [inputBetAmount, setInputBetAmount] = useState('');
  const [inputChoice, setInputChoice] = useState('');
  const [walletAddress, setWalletAddress] = useState('');


  useEffect(() => {
    connectMetaMask();
    extractGameDataFromLink();
  }, []);

  const extractGameDataFromLink = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const betAmount = urlParams.get('betAmount');
    const choice = urlParams.get('choice');
    const gameId = urlParams.get('gameId');

    if (betAmount && choice && gameId) {
      setGameData({ betAmount, choice, gameId });
    }
  };

  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.enable();
        setConnected(true);
        const web3 = new Web3(window.ethereum);
        const accounts = await web3.eth.getAccounts();
        setWalletAddress(accounts[0]);
      } catch (error) {
        console.error('Failed to connect MetaMask:', error);
      }
    } else {
      console.error('MetaMask not installed.');
    }
  };

  const disconnectMetaMask = () => {
    setConnected(false);
    setWalletAddress('');
  };

  const confirmGame = async () => {
    if (!gameData && (!inputBetAmount || !inputChoice)) {
      alert('Please input valid game data.');
      return;
    }

    setLoading(true);

    const contractAddress = '0xCB8110E5B30C3369Afac5Af8F63970720F3DC173'; // Address of deployed Coin Flip game contract
    const tozzerTokenAddress = '0xacB3e23Fb4F8DB9C5bEC3Bd0f8026A7C8d7Ce5c7'; // Address of TOZZER token contract

    if (window.ethereum) {
      try {
        await window.ethereum.enable();
        setConnected(true);

        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(contractABI, contractAddress);
        const tozzerTokenContract = new web3.eth.Contract(tozzerTokenABI, tozzerTokenAddress);

        const accounts = await web3.eth.getAccounts();

        let betAmount = gameData ? gameData.betAmount : inputBetAmount;
        const weiAmount = web3.utils.toWei(betAmount.toString(), 'ether'); 
        betAmount = weiAmount;
        const choice = gameData ? gameData.choice : inputChoice;
        const gameId = gameData ? gameData.gameId : Date.now().toString();

        // Approve transaction
        const approveGasEstimate = await tozzerTokenContract.methods.approve(contractAddress, betAmount).estimateGas({ from: accounts[0] });
        const approveTxData = tozzerTokenContract.methods.approve(contractAddress, betAmount).encodeABI();
        const approveTx = {
          from: accounts[0],
          to: tozzerTokenAddress,
          data: approveTxData,
          gas: approveGasEstimate,
        };
        await web3.eth.sendTransaction(approveTx);

        // PlayCoinFlip transaction
        const gasEstimate = await contract.methods.playCoinFlip(choice === 'heads', betAmount, gameId).estimateGas({ from: accounts[0] });
        const txData = contract.methods.playCoinFlip(choice === 'heads', betAmount, gameId).encodeABI();
        const tx = {
          from: accounts[0],
          to: contractAddress,
          data: txData,
          gas: gasEstimate,
        };
        await web3.eth.sendTransaction(tx);

        alert('Transactions completed successfully.');
      } catch (error) {
        console.error('Transaction failed:', error);
        alert('Transaction failed. Please check the console for details.');
      }
    } else {
      console.error('MetaMask not installed.');
    }

    setLoading(false);
  };

  return (
    <div className="container" style={containerStyle}>
      <header className="App-header">
      <div className="wallet-info">
          {connected ? (
            <div className="connected-wallet">
              <img src={MetaMaskIcon} alt="MetaMask" width="20" height="20" />
              <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
              <button class="disconnect" onClick={disconnectMetaMask}>
              <i class="fa fa-sign-out" ></i>
              </button>
            </div>
          ) : (
            <br/>
          )}
        </div>
        <h1>FlipWin Game</h1>
        <img src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=148,fit=crop,q=95/Yg2Lgnv8bbfJa6RQ/d4450753-bb95-44ac-babe-4b6ebc35a845-dJoeExVQ00SR1ErV.png" alt="logo" width="150" height="150" />
        {connected ? (
          <div className='container'>
            {gameData ? (
              <div>
                <p>Bet Amount: {gameData.betAmount}</p>
                <p>Choice: {gameData.choice}</p>
              </div>
            ) : (
              <div>
                <label>
                  <span>Bet Amount:</span>
                  <input type="number" value={inputBetAmount} onChange={(e) => setInputBetAmount(e.target.value)} />
                </label>
                <br />
                <label>
                <span>Choice:</span>
                  <select value={inputChoice} onChange={(e) => setInputChoice(e.target.value)}>
                    <option placeholder="Choose" value="heads"></option>
                    <option value="heads">Heads</option>
                    <option value="tails">Tails</option>
                  </select>
                </label>
              </div>
            )}
            <div className='button-space'>
              <button onClick={confirmGame} disabled={loading}>
                {loading ? 'Flipping...' : 'Confirm'}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={connectMetaMask}>Connect</button>
        )}
      </header>
    </div>
  );
}

export default App;
