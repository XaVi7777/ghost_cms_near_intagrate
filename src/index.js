(() => {
    const { selectors, nearOptions } = window;

    let $signInSignOutBtn, $getAccountBalanceInput, $getAccountDetailsInput,
        $nearUserID, $sendTokensWrapper, $receiverInput, $tokensInput, $sendTokensButton,
        $checkTransactionButton,
        tokensToSend, receiver;
    let isFetching = false;

    const getConfig = env => {
        switch (env) {
            case 'production':
            case 'mainnet':
                return {
                    networkId: 'mainnet',
                    nodeUrl: 'https://rpc.mainnet.near.org',
                    walletUrl: 'https://wallet.near.org',
                    helperUrl: 'https://helper.mainnet.near.org'
                }
            case 'development':
            case 'testnet':
                return {
                    networkId: 'testnet',
                    nodeUrl: 'https://rpc.testnet.near.org',
                    walletUrl: 'https://wallet.testnet.near.org',
                    helperUrl: 'https://helper.testnet.near.org'
                }
            default:
                throw Error(`Unconfigured environment '${env}'`)
        }
    }

    const createDataSelector = dataID => `[data-id="${dataID}"]`;

    const onClickHandler = async (event) => {
        const id = $(event.target).data('id');

        if (!isFetching) {
            isFetching = true;
            if (id === selectors.signInSignOutBtn) {
                if (!nearIsAuthentificated) {
                    nearWallet.requestSignIn({
                        contractId: nearContract.contractId,
                        successUrl: nearOptions.successUrl,
                    });
                } else {
                    nearWallet.signOut();
                    window.location.replace(nearOptions.signOutUrl || '/');
                }
            } else if (id === selectors.callViewMethod) {
                const method = $(event.target).data('view-method');
                const data = await nearContract[method]();
                const $dataWrapper = $(createDataSelector(`${selectors.viewMethodData}-${method}`));
                if ($dataWrapper.length) {
                    $dataWrapper.text(typeof data === 'string' ? data : data.toString())
                }
            }
            isFetching = false;
        }
    }

    const showingBalance = async (id) => {
        const accountID = id || nearWallet.getAccountId();
        const account = await nearAPI.account(accountID)
        window.nearData = window.nearData
            ? {
                ...window.nearData,
                balance: await account.getAccountBalance(),
            } : {
                balance: await account.getAccountBalance()
            }
        const balanceNodes = [
            $(createDataSelector(selectors.balance.total)),
            $(createDataSelector(selectors.balance.stateStaked)),
            $(createDataSelector(selectors.balance.staked)),
            $(createDataSelector(selectors.balance.available)),
        ]
        balanceNodes.forEach($node => {
            if ($node.length) {
                $($node).text(nearData?.balance[$node.data('id')])
            }
        });
        $(createDataSelector(selectors.walletDataWrapper)).css({ display: 'block' })
    }

    const showingDetails = async (id) => {
        const accountID = id || nearWallet.getAccountId();
        const account = await nearAPI.account(accountID);
        const details = await account.getAccountDetails();
        const $detailsNode = $(createDataSelector(selectors.detailsDataWrapper));
        if ($detailsNode.length) {
            const $detailsNodeHeader = $(document.createElement('thead'))
                .append($(document.createElement('tr'))
                    .append([
                        $(document.createElement('td')).text('Contract'),
                        $(document.createElement('td')).text('Amount'),
                        $(document.createElement('td')).text('Public key'),
                    ])
                );
            const $detailsNodeBody = $(document.createElement('tbody'));
            details.authorizedApps.forEach(detail => {
                const $detailNode = $(document.createElement('tr'))
                    .append([
                        $(document.createElement('td')).text(detail.contractId),
                        $(document.createElement('td')).text(detail.amount),
                        $(document.createElement('td')).text(detail.publicKey),
                    ])
                $detailsNodeBody.append($detailNode)
            })

            $detailsNode.append([
                $detailsNodeHeader,
                $detailsNodeBody,
            ])
        }
    }

    const toggleSignInSignOut = () => {
        if (nearIsAuthentificated) {
            const accountID = nearWallet.getAccountId();
            if ($signInSignOutBtn.length) {
                $signInSignOutBtn.text(nearOptions.signOutText);
            }
            if ($nearUserID.length) {
                $nearUserID.text(accountID);
            }
            if ($sendTokensWrapper.length) {
                $sendTokensWrapper.css({ display: 'block' })
            }
            showingBalance();
        } else {
            $(createDataSelector(selectors.walletDataWrapper)).css({ display: 'none' });
            $sendTokensWrapper.css({ display: 'none' })
        }
    }

    const connectNear = () => {
        try {
            // connect to NEAR
            window.nearAPI = new nearApi.Near({
                keyStore: new nearApi.keyStores.BrowserLocalStorageKeyStore(),
                ...getConfig(window.nearOptions.networkID)
            });

            // connect to the NEAR Wallet
            window.nearWallet = new nearApi.WalletConnection(nearAPI, nearOptions.appName);
            // connect to a NEAR smart contract
            window.nearContract = new nearApi.Contract(
                nearWallet.account(),
                window.nearOptions.contract.id, {
                viewMethods: window.nearOptions.contract.viewMethods,
                changeMethods: window.nearOptions.contract.changeMethods,
            });

            window.nearIsAuthentificated = nearWallet.isSignedIn();
            toggleSignInSignOut();
        } catch (error) {
            console.error('Error with connect to near', error)
        }
    }

    const onKeyDownHandler = event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const dataID = $(event.target).data('id');
            if (dataID === selectors.getAccountBalanceInput) {
                showingBalance(event.target.value.trim())
            }
            if (dataID === selectors.getAccountDetailsInput) {
                showingDetails(event.target.value.trim())
            }
        }
    }

    const onInputHandler = event => {
        const dataID = $(event.target).data('id');
        if (dataID === selectors.receiverId) {
            receiver = event.target.value;
        }
        if (dataID === selectors.tokensToSend) {
            tokensToSend = event.target.value;
        }
    }

    const onClickSendTokensHandler = async (event) => {
        if (receiver && tokensToSend) {
            const result = await nearWallet.account().functionCall({
                contractId: 'pay.w-adalo.testnet',
                methodName: "sendNear",
                args: { receiver },
                attachedDeposit: nearApi.utils.format.parseNearAmount(tokensToSend),
            })
            console.log(result.transaction.hash);
        }
    }

    const onClickCheckTransactionHandler = () => {
        window.open(`https://explorer.testnet.near.org/accounts/${nearWallet.getAccountId()}`)
    }

    const sendTokensPlugin = async () => {
        if (nearIsAuthentificated) {
            if ($sendTokensWrapper.length) {
                $receiverInput = $(createDataSelector(selectors.receiverId));
                $tokensInput = $(createDataSelector(selectors.tokensToSend));
                $sendTokensButton = $(createDataSelector(selectors.sendTokens));
                $checkTransactionButton = $(createDataSelector(selectors.checkTransaction));
                const balance = ((await nearWallet.account().state()).amount / 1e24).toFixed(2);
                $sendTokensWrapper
                    .css({ display: 'block' })
                    .find(createDataSelector(selectors.senderBalance))
                    .text(balance.toString());

                if ($receiverInput.length) {
                    $receiverInput.on('input', onInputHandler)
                }
                if ($tokensInput.length) {
                    $tokensInput.on('input', onInputHandler)
                }
                if ($sendTokensButton) {
                    $sendTokensButton.on('click', onClickSendTokensHandler)
                }
                if ($checkTransactionButton.length) {
                    $checkTransactionButton.on('click', onClickCheckTransactionHandler)
                }
            }
        } else {
            $sendTokensWrapper.css({ display: 'none' })
        }
    }

    const onReadyHandler = () => {
        $signInSignOutBtn = $(createDataSelector(selectors.signInSignOutBtn));
        $getAccountBalanceInput = $(createDataSelector(selectors.getAccountBalanceInput));
        $getAccountDetailsInput = $(createDataSelector(selectors.getAccountDetailsInput));
        $callViewMethod = $(createDataSelector(selectors.callViewMethod))
        $nearUserID = $(createDataSelector(selectors.nearUserID));
        $sendTokensWrapper = $(createDataSelector(selectors.sendTokensWrapper))
        connectNear();
        sendTokensPlugin();

        if ($signInSignOutBtn.length) {
            $signInSignOutBtn.on('click', onClickHandler)
        }
        if ($getAccountBalanceInput.length) {
            $getAccountBalanceInput.on('keydown', onKeyDownHandler)
        }
        if ($getAccountDetailsInput.length) {
            $getAccountDetailsInput.on('keydown', onKeyDownHandler)
        }
        if ($callViewMethod.length) {
            $callViewMethod.on('click', onClickHandler)
        }
    }
    $(onReadyHandler);
})();