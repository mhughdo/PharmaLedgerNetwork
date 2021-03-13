/* eslint-disable class-methods-use-this */
const {Contract, Context} = require('fabric-contract-api')

class PharmaLedgerContract extends Contract {
  constructor() {
    super('org.pln.PharmaLedgerContract')
  }

  async makeEquipment(ctx, manufacturer, equipmentNumber, equipmentName, ownerName) {
    let dt = new Date().toString()
    const equipment = {
      equipmentNumber,
      manufacturer,
      equipmentName,
      ownerName,
      previousOwnerType: 'MANUFACTURER',
      currentOwnerType: 'MANUFACTURER',
      createDateTime: dt,
      lastUpdated: dt,
    }
    await ctx.stub.putState(equipmentNumber, Buffer.from(JSON.stringify(equipment)))
  }

  async wholesalerDistribute(ctx, equipmentNumber, ownerName) {
    const equipmentAsBytes = await ctx.stub.getState(equipmentNumber)
    if (!equipmentAsBytes || equipmentAsBytes.length === 0) {
      throw new Error(`${equipmentNumber} does not exist`)
    }
    let dt = new Date().toString()
    const strValue = Buffer.from(equipmentAsBytes).toString('utf8')
    let record
    try {
      record = JSON.parse(strValue)
      if (record.currentOwnerType !== 'MANUAFACTURER') {
        throw new Error(` equipment - ${equipmentNumber} owner must be MANUAFACTURER`)
      }
      record.previousOwnerType = record.currentOwnerType
      record.currentOwnerType = 'WHOLESALER'
      record.ownerName = ownerName
      record.lastUpdated = dt
    } catch (err) {
      throw new Error(`equipmet ${equipmentNumber} data can't be processed`)
    }
    await ctx.stub.putState(equipmentNumber, Buffer.from(JSON.stringify(record)))
  }

  async pharmacyReceived(ctx, equipmentNumber, ownerName) {
    const equipmentAsBytes = await ctx.stub.getState(equipmentNumber)
    if (!equipmentAsBytes || equipmentAsBytes.length === 0) {
      throw new Error(`${equipmentNumber} does not exist`)
    }
    let dt = new Date().toString()
    const strValue = Buffer.from(equipmentAsBytes).toString('utf8')
    let record
    try {
      record = JSON.parse(strValue)
      if (record.currentOwnerType !== 'WHOLESALER') {
        throw new Error(` equipment - ${equipmentNumber} owner must be WHOLESALER`)
      }
      record.previousOwnerType = record.currentOwnerType
      record.currentOwnerType = 'PHARMACY'
      record.ownerName = ownerName
      record.lastUpdated = dt
    } catch (err) {
      throw new Error(`equipmet ${equipmentNumber} data can't be processed`)
    }
    await ctx.stub.putState(equipmentNumber, Buffer.from(JSON.stringify(record)))
  }

  async queryHistoryByKey(ctx, key) {
    let iterator = await ctx.stub.getHistoryForKey(key)
    let result = []
    let res = await iterator.next()
    while (!res.done) {
      if (res.value) {
        const obj = JSON.parse(res.value.value.toString('utf8'))
        result.push(obj)
      }
      res = await iterator.next()
    }
    await iterator.close()
    console.info(result)
    return JSON.stringify(result)
  }
}
