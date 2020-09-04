const express = require('express')
const env = require('../env')
const {
  getIoTAuthorization,
  createIoTAuthorization,
  getIoTAuthorizations,
  getDeviceId,
  deleteAuthorization,
} = require('../influxdb/authorizations')
const router = express.Router()

// return environment for a specific device by its ID
router.get('/env/:deviceId', async (req, res) => {
  const deviceId = req.params.deviceId
  let authorization = await getIoTAuthorization(deviceId)
  let registered = false
  if (!authorization) {
    authorization = await createIoTAuthorization(deviceId)
    registered = true
  }
  const result = {
    influx_url: env.INFLUX_URL,
    influx_org: env.INFLUX_ORG,
    influx_token: authorization.token,
    influx_bucket: env.INFLUX_BUCKET,
    id: req.params.deviceId,
    registered,
  }
  res.json(result)
})

// return all devices as []{key: string, deviceId:string, createdAt: string}
router.get('/devices', async (_req, res) => {
  const authorizations = await getIoTAuthorizations()
  res.json(
    authorizations.map((a) => ({
      key: a.id,
      deviceId: getDeviceId(a),
      createdAt: a.createdAt,
    }))
  )
})

// return all devices as []{key: string, deviceId:string, createdAt: string}
router.delete('/devices/:deviceId', async (req, res) => {
  await deleteAuthorization(req.params.deviceId)
  res.status(201)
  res.send('Device authorization removed')
})

// all other routes are not supported!
router.all('*', (_, res) => {
  res.status(404)
  res.send('Not Found!')
})

module.exports = router
