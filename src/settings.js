if (window) {
    window.global = {}
    window.process = { env: {} }
    window.exports = {}
    window.Buffer = window.BufferUMD.Buffer
    window.nearOptions = {
        networkID: 'testnet',
        appName: 'test-app',
        contract: {
            id: 'devtest.testnet',
            viewMethods: ['whoSaidHi'],
            changeMethods: ['sayHi'],
        },
        successUrl: 'http://localhost:2368/near',
        signOutUrl: '/near',
        signInText: 'SignIn',
        signOutText: 'SignOut',
    }
    window.selectors = {
        signInSignOutBtn: 'near-signin-signout',
        getAccountBalanceInput: 'near-get-account-balance',
        getAccountDetailsInput: 'near-get-account-details',
        balance: {
            total: 'total',
            stateStaked: 'staked',
            staked: 'staked',
            available: 'available',
        },
        walletDataWrapper: 'wallet-data-wrapper',
        detailsDataWrapper: 'details-data-wrapper',
        callViewMethod: 'call-view-method',
        viewMethodData: 'view-method-data',
        sendTokensWrapper: 'send-tokens-wrapper',
        senderBalance: 'sender-balance',
        receiverId: 'receiver-id',
        tokensToSend: 'tokens-to-send',
        sendTokens: 'send-tokens',
        checkTransaction: 'check-transaction',
    }
}