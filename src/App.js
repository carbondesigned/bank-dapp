import { useState, useEffect } from 'react';
import { ethers, utils } from 'ethers';
import abi from './contracts/Bank.json';

function App() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isBankerOwner, setIsBankerOwner] = useState(false);
  const [inputValue, setInputValue] = useState({
    withdraw: '',
    deposit: '',
    bankName: '',
  });
  const [bankOwnerAddress, setBankOwnerAddress] = useState(null);
  const [customerTotalBalance, setCustomerTotalBalance] = useState(null);
  const [currentBankName, setCurrentBankName] = useState(null);
  const [customerAddress, setCustomerAddress] = useState(null);
  const [error, setError] = useState(null);

  const contractAddress = '0x913C3FCF7340d9Df6BCFA063f363d5aA58226dA7';
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        const account = accounts[0];
        setIsWalletConnected(true);
        setCustomerAddress(account);
      } else {
        setError('Please install a MetaMask wallet to use our bank.');
        console.log('No MetaMask detected.');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getBankName = async () => {
    try {
      if (window.ethereum) {
        /* 
          A provider lets us connect to the ethereum blockchain, in this case the Rinkeby testnet via an ethereum node. We're using MetaMask's provider which uses Infura behind the scenes. You can read more about providers here. It's important to know providers that can only complete read-only actions.

        * https://docs.ethers.io/v5/api/providers/#:~:text=A%20Provider%20is%20an%20abstraction,  to%20standard%20Ethereum%20node%20functionality.
        */
        const provider = new ethers.providers.Web3Provider(window.ethereum);

        /* 
          Now with our provider we get a signer which is an abtraction of your MetaMask wallet that lets you interact with the blockchain without revealing your private keys. As a signer, you can write to the ethereum blockchain via transactions. You can read more on signers here.
        * https://docs.ethers.io/v5/api/signer/#:~:text=A%20Signer%20in%20ethers%20is,on%20the%20sub%2Dclass%20used.
        */
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let bankName = await bankContract.bankName();
        bankName = utils.parseBytes32String(bankName);
        setCurrentBankName(bankName.toString());
      } else {
        console.log('Ethereum object not found, install Metamask.');
        setError('Please install a MetaMask wallet to use our bank.');
      }
    } catch (error) {
      console.log(error);
    }
  };

  /* setter function | costs gas */
  const setBankNameHandler = async (event) => {
    event.preventDefault();
    event.preventDefault();
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const txn = await bankContract.setBankName(
          utils.formatBytes32String(inputValue.bankName)
        );
        await txn.wait();
        console.log('Bank Name Changed', txn.hash);
        await getBankName();
      } else {
        console.log('Ethereum object not found, install Metamask.');
        setError('Please install a MetaMask wallet to use our bank.');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getBankOwnerHandler = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let owner = await bankContract.bankOwner();
        setBankOwnerAddress(owner);

        const [account] = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });

        if (owner.toLowerCase() === account.toLowerCase()) {
          setIsBankerOwner(true);
        }
      } else {
        console.log('Ethereum object not found, install Metamask.');
        setError('Please install a MetaMask wallet to use our bank.');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const customerBalanceHandler = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let balance = await bankContract.getCustomerBalance();
        setCustomerTotalBalance(utils.formatEther(balance));
        console.log('Retrieved balance: ', balance);
      } else {
        console.log('Ethereum object not found, install Metamask.');
        setError('Please install a MetaMask wallet to use our bank.');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleInputChange = (event) => {
    setInputValue((prevFormData) => ({
      ...prevFormData,
      [event.target.name]: event.target.value,
    }));
  };

  const depositMoneyHandler = async (event) => {
    try {
      event.preventDefault();
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const txn = await bankContract.depositMoney({
          value: ethers.utils.parseEther(inputValue.deposit),
        });
        console.log('Depositing money...');
        await txn.wait();
        console.log('Deposited money: ', txn.hash);

        customerBalanceHandler();
      } else {
        console.log('Ethereum object not found, install Metamask.');
        setError('Please install a MetaMask wallet to use our bank.');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const withdrawMoneyHandler = async (event) => {
    try {
      event.preventDefault();
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let myAddress = await signer.getAddress();
        console.log('Provider signer...', myAddress);

        const txn = await bankContract.withdrawMoney(
          myAddress,
          ethers.utils.parseEther(inputValue.withdraw)
        );
        console.log('Withdrawing money...');
        await txn.wait();
        console.log('Withdrew money: ', txn.hash);

        customerBalanceHandler();
      } else {
        console.log('Ethereum object not found, install Metamask.');
        setError('Please install a MetaMask wallet to use our bank.');
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    getBankName();
    getBankOwnerHandler();
    customerBalanceHandler();
  }, [isWalletConnected]);

  return (
    <main className='main-container'>
      <h2 className='headline'>
        <span className='headline-gradient'>Bank Contract Project</span> 💰
      </h2>
      <section className='customer-section px-10 pt-5 pb-10'>
        {error && <p className='text-2xl text-red-700'>{error}</p>}
        <div className='mt-5'>
          {currentBankName === '' && isBankerOwner ? (
            <p>"Setup the name of your bank." </p>
          ) : (
            <p className='text-3xl font-bold'>{currentBankName}</p>
          )}
        </div>
        <div className='mt-7 mb-9'>
          <form className='form-style'>
            <input
              type='text'
              className='input-style'
              onChange={handleInputChange}
              name='deposit'
              placeholder='0.0000 ETH'
              value={inputValue.deposit}
            />
            <button className='btn-purple' onClick={depositMoneyHandler}>
              Deposit Money In ETH
            </button>
          </form>
        </div>
        <div className='mt-10 mb-10'>
          <form className='form-style'>
            <input
              type='text'
              className='input-style'
              onChange={handleInputChange}
              name='withdraw'
              placeholder='0.0000 ETH'
              value={inputValue.withdraw}
            />
            <button className='btn-purple' onClick={withdrawMoneyHandler}>
              Withdraw Money In ETH
            </button>
          </form>
        </div>
        <div className='mt-5'>
          <p>
            <span className='font-bold'>Customer Balance: </span>
            {customerTotalBalance}
          </p>
        </div>
        <div className='mt-5'>
          <p>
            <span className='font-bold'>Bank Owner Address: </span>
            {bankOwnerAddress}
          </p>
        </div>
        <div className='mt-5'>
          {isWalletConnected && (
            <p>
              <span className='font-bold'>Your Wallet Address: </span>
              {customerAddress}
            </p>
          )}
          <button className='btn-connect' onClick={checkIfWalletIsConnected}>
            {isWalletConnected ? 'Wallet Connected 🔒' : 'Connect Wallet 🔑'}
          </button>
        </div>
      </section>
      {isBankerOwner && (
        <section className='bank-owner-section'>
          <h2 className='text-xl border-b-2 border-indigo-500 px-10 py-4 font-bold'>
            Bank Admin Panel
          </h2>
          <div className='p-10'>
            <form className='form-style'>
              <input
                type='text'
                className='input-style'
                onChange={handleInputChange}
                name='bankName'
                placeholder='Enter a Name for Your Bank'
                value={inputValue.bankName}
              />
              <button className='btn-grey' onClick={setBankNameHandler}>
                Set Bank Name
              </button>
            </form>
          </div>
        </section>
      )}
    </main>
  );
}
export default App;
