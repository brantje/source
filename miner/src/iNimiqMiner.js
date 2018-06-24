const Nimiq = require('@nimiq/core');
const BasePoolMiner = Nimiq.BasePoolMiner;
const BufferUtils = Nimiq.BufferUtils;
const MerklePath = Nimiq.MerklePath;
const GenesisConfig = Nimiq.GenesisConfig;

class INimiqMiner extends BasePoolMiner {
    /**
     * @param {BaseChain} blockchain
     * @param {Accounts} accounts
     * @param {Mempool} mempool
     * @param {Time} time
     * @param {Address} address
     * @param {number} deviceId
     * @param {string} deviceName
     */
    constructor(blockchain, accounts, mempool, time, address, deviceId, deviceName) {
        let extraData = new Uint8Array(0);
        super(blockchain, accounts, mempool, time, address, deviceId, extraData);
        this._deviceName = deviceName;
        this.on('share', (block, fullValid) => this._onBlockMined(block, fullValid));
    }

    /**
     * @param {Block} block
     * @param {boolean} fullValid
     * @private
     */
    async _onBlockMined(block, fullValid) {
        this._send({
            message: 'share',
            blockHeader: BufferUtils.toBase64(block.header.serialize()),
            minerAddrProof: BufferUtils.toBase64((await MerklePath.compute(block.body.getMerkleLeafs(), block.minerAddr)).serialize()),
            extraDataProof: BufferUtils.toBase64((await MerklePath.compute(block.body.getMerkleLeafs(), block.body.extraData)).serialize()),
            block: fullValid ? BufferUtils.toBase64(block.serialize()) : undefined
        });
        Nimiq.Log.i(INimiqMiner, `Still connected to pool`);
    }

    _register() {
        const deviceName = this._deviceName || '';
        Nimiq.Log.i(INimiqMiner, `Registering to pool using device id ${this._deviceId} (${deviceName}) as a smart client.`);
        this._send({
            message: 'register',
            mode: 'smart',
            address: this._ourAddress.toUserFriendlyAddress(),
            deviceId: this._deviceId,
            deviceName: deviceName,
            genesisHash: BufferUtils.toBase64(GenesisConfig.GENESIS_HASH.serialize())
        });
    }
}

module.exports = INimiqMiner;