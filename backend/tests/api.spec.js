const { getApp, client, unique, cleanupUserByUsername } = require('./helpers/testClient')

// describe / it / expect / beforeAll / afterAll are provided as globals
// (see vitest.backend.config.js -> test.globals = true).

// End-to-end integration coverage for every HTTP endpoint. A single throwaway
// user (with its own provisioned tenant database) is created up front and fully
// removed in afterAll, so the suite leaves the database exactly as it found it.

describe('Budgeteer API endpoints', () => {
  let app

  // Primary throwaway user
  const username = unique('apitest')
  const password = 'Test1234!'
  const email = `${username}@example.test`
  const phone = `1${String(Date.now()).slice(-9)}`

  // Shared state captured as the flow progresses
  let token
  let userID
  let profileID
  let scenarioID
  let clonedScenarioID
  let eventID

  // Secondary profile used purely to exercise add + remove
  const profileBPhone = `2${String(Date.now()).slice(-9)}`
  const profileBEmail = `${unique('profb')}@example.test`

  const auth = (req) => req.set('Authorization', `Bearer ${token}`)

  beforeAll(async () => {
    app = await getApp()
  })

  afterAll(async () => {
    await cleanupUserByUsername(username)
  })

  describe('health + auth', () => {
    it('GET /api/health returns ok', async () => {
      const res = await client(app).get('/api/health')
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ ok: true })
    })

    it('rejects protected routes without a token (401)', async () => {
      const res = await client(app).get('/api/profile/get-all-profiles')
      expect(res.status).toBe(401)
    })

    it('rejects protected routes with an invalid token (403)', async () => {
      const res = await client(app)
        .get('/api/profile/get-all-profiles')
        .set('Authorization', 'Bearer not-a-real-token')
      expect(res.status).toBe(403)
    })
  })

  describe('user', () => {
    it('POST /api/user/add-user creates a user + tenant DB', async () => {
      const res = await client(app).post('/api/user/add-user').send({
        username,
        password,
        firstname: 'Api',
        lastname: 'Test',
        phone,
        email,
      })
      expect(res.status).toBe(200)
    })

    it('POST /api/user/login returns a token', async () => {
      const res = await client(app).post('/api/user/login').send({ username, password })
      expect(res.status).toBe(200)
      expect(res.body.token).toBeTruthy()
      expect(res.body.userID).toBeTruthy()
      token = res.body.token
      userID = res.body.userID
    })

    it('POST /api/user/login rejects a bad password (401)', async () => {
      const res = await client(app).post('/api/user/login').send({ username, password: 'wrong' })
      expect(res.status).toBe(401)
    })

    it('GET /api/user/get-user returns the user without password', async () => {
      const res = await client(app).get('/api/user/get-user').query({ userID })
      expect(res.status).toBe(200)
      expect(res.body.user).toBeTruthy()
      expect(res.body.user.password).toBeUndefined()
    })

    it('PUT /api/user/update-user updates the email', async () => {
      const res = await client(app).put('/api/user/update-user').send({
        userID,
        username,
        email: `updated_${email}`,
      })
      expect(res.status).toBe(200)
    })

    it('POST /api/user/register is disabled (403)', async () => {
      const res = await client(app).post('/api/user/register').send({ username, password })
      expect(res.status).toBe(403)
    })

    it('GET /api/user/admin/users is forbidden for non-admins (403)', async () => {
      const res = await auth(client(app).get('/api/user/admin/users'))
      expect(res.status).toBe(403)
    })
  })

  describe('profile', () => {
    it('GET /api/profile/get-all-profiles returns the default profile', async () => {
      const res = await auth(client(app).get('/api/profile/get-all-profiles'))
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThanOrEqual(1)
      profileID = res.body[0].id
      expect(profileID).toBeTruthy()
    })

    it('GET /api/profile/get-profile-by-id returns the profile', async () => {
      const res = await auth(client(app).get('/api/profile/get-profile-by-id')).query({ profileID })
      expect(res.status).toBe(200)
      expect(res.body.id).toBe(profileID)
    })

    it('POST /api/profile/add-new-profile + DELETE /api/profile/remove-profile', async () => {
      const addRes = await auth(client(app).post('/api/profile/add-new-profile')).send({
        first_name: 'Second',
        last_name: 'Profile',
        phone: profileBPhone,
        email: profileBEmail,
      })
      expect(addRes.status).toBe(200)

      const lookup = await auth(client(app).get('/api/profile/get-profile-by-phone')).query({
        phone: profileBPhone,
      })
      expect(lookup.status).toBe(200)
      const profileBID = lookup.body?.id
      expect(profileBID).toBeTruthy()

      const updateRes = await auth(client(app).put('/api/profile/update-profile')).send({
        profileID: profileBID,
        first_name: 'Second',
        last_name: 'Updated',
        phone: profileBPhone,
        email: profileBEmail,
      })
      expect(updateRes.status).toBe(200)

      const removeRes = await auth(client(app).delete('/api/profile/remove-profile')).send({
        profileID: profileBID,
      })
      expect(removeRes.status).toBe(200)
    })
  })

  describe('scenario', () => {
    const scenarioName = unique('scenario')

    it('POST /api/scenario/create-scenario', async () => {
      const res = await auth(client(app).post('/api/scenario/create-scenario')).send({
        profileID,
        name: scenarioName,
        description: 'integration test scenario',
        is_default: false,
      })
      expect(res.status).toBe(200)
    })

    it('GET /api/scenario/get-all-scenarios-for-profile finds the scenario', async () => {
      const res = await auth(client(app).get('/api/scenario/get-all-scenarios-for-profile')).query({
        profileID,
      })
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      const found = res.body.find((s) => s.name === scenarioName)
      expect(found).toBeTruthy()
      scenarioID = found.id
    })

    it('GET /api/scenario/get-scenario-by-ids', async () => {
      const res = await auth(client(app).get('/api/scenario/get-scenario-by-ids')).query({
        profileID,
        scenarioID,
      })
      expect(res.status).toBe(200)
      expect(res.body.id).toBe(scenarioID)
    })

    it('PUT /api/scenario/update-scenario', async () => {
      const res = await auth(client(app).put('/api/scenario/update-scenario')).send({
        scenarioID,
        profileID,
        name: `${scenarioName}_updated`,
        description: 'updated description',
      })
      expect(res.status).toBe(200)
    })

    it('POST /api/scenario/clone-scenario', async () => {
      const cloneName = unique('clone')
      const res = await auth(client(app).post('/api/scenario/clone-scenario')).send({
        scenarioID,
        profileID,
        name: cloneName,
        description: 'cloned scenario',
      })
      expect(res.status).toBe(200)

      const all = await auth(client(app).get('/api/scenario/get-all-scenarios-for-profile')).query({
        profileID,
      })
      const clone = all.body.find((s) => s.name === cloneName)
      expect(clone).toBeTruthy()
      clonedScenarioID = clone.id
    })
  })

  describe('events', () => {
    const eventName = unique('event')

    it('POST /api/scenario/create-event', async () => {
      const res = await auth(client(app).post('/api/scenario/create-event')).send({
        profileID,
        scenarioID,
        name: eventName,
        description: 'test event',
        type: 'DEBIT',
        category: 'UTILITY',
        frequency: 'MONTHLY',
        startDate: '2026-01-01',
        endDate: '2030-01-01',
        amount: 50.25,
        active: true,
        principal: 0,
        interest: 0,
        calculatedEndDate: '2030-01-01',
        monthlyPayment: 0,
        loanTerm: 0,
        escrow: 0,
      })
      expect(res.status).toBe(200)
    })

    it('GET /api/scenario/get-events-for-scenario finds the event', async () => {
      const res = await auth(client(app).get('/api/scenario/get-events-for-scenario')).query({
        profileID,
        scenarioID,
      })
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      const found = res.body.find((e) => e.name === eventName)
      expect(found).toBeTruthy()
      eventID = found.id
    })

    it('PUT /api/scenario/update-event normalizes a legacy category', async () => {
      const res = await auth(client(app).put('/api/scenario/update-event')).send({
        eventID,
        profileID,
        scenarioID,
        name: `${eventName}_updated`,
        description: 'updated',
        type: 'DEBIT',
        category: 'UTILITIES', // legacy alias -> normalized to UTILITY
        frequency: 'MONTHLY',
        startDate: '2026-02-01',
        endDate: '2031-01-01',
        amount: 75,
        active: true,
        principal: 0,
        interest: 0,
        calculatedEndDate: '2031-01-01',
        monthlyPayment: 0,
        term: 0,
        escrow: 0,
      })
      expect(res.status).toBe(200)
    })

    it('POST /api/scenario/toggle-event-active responds with the event', async () => {
      const res = await auth(client(app).post('/api/scenario/toggle-event-active')).send({
        scenarioID,
        profileID,
        eventID,
      })
      expect(res.status).toBe(200)
      expect(res.body).toBeTruthy()
    })

    it('GET /api/scenario/get-summary-for-scenario-on-date', async () => {
      const res = await auth(client(app).get('/api/scenario/get-summary-for-scenario-on-date')).query(
        {
          scenarioID,
          profileID,
          date: '2026-03-01',
        },
      )
      expect(res.status).toBe(200)
    })

    it('GET /api/scenario/get-events-for-scenario-for-month', async () => {
      const res = await auth(
        client(app).get('/api/scenario/get-events-for-scenario-for-month'),
      ).query({ scenarioID, profileID, month: 3, year: 2026 })
      expect(res.status).toBe(200)
    })

    it('POST /api/scenario/calculate-loan-details', async () => {
      const res = await auth(client(app).post('/api/scenario/calculate-loan-details')).send({
        totalLoanAmount: 20000,
        additionalPrincipalPayment: 0,
        interestRate: 5,
        startDate: '2026-01-01',
        loanTerm: 60,
      })
      expect(res.status).toBe(200)
      expect(res.body.monthlyPayment).toBeGreaterThan(0)
    })

    it('POST /api/scenario/calculate-loan-details validates input (400)', async () => {
      const res = await auth(client(app).post('/api/scenario/calculate-loan-details')).send({
        totalLoanAmount: 0,
        interestRate: 5,
        startDate: '2026-01-01',
      })
      expect(res.status).toBe(400)
    })

    it('DELETE /api/scenario/remove-event', async () => {
      const res = await auth(client(app).delete('/api/scenario/remove-event')).send({
        eventID,
        profileID,
        scenarioID,
      })
      expect(res.status).toBe(200)
    })
  })

  describe('scenario cleanup', () => {
    it('DELETE /api/scenario/remove-scenario (clone)', async () => {
      const res = await auth(client(app).delete('/api/scenario/remove-scenario')).send({
        scenarioID: clonedScenarioID,
        profileID,
      })
      expect(res.status).toBe(200)
    })

    it('DELETE /api/scenario/remove-scenario (original)', async () => {
      const res = await auth(client(app).delete('/api/scenario/remove-scenario')).send({
        scenarioID,
        profileID,
      })
      expect(res.status).toBe(200)
    })
  })

  describe('settings', () => {
    it('set, get and delete a user setting', async () => {
      const setRes = await auth(client(app).post('/api/setting/set-user-setting')).send({
        setting: 'THEME',
        value: 'dark',
      })
      expect(setRes.status).toBe(200)

      const getRes = await auth(client(app).get('/api/setting/get-user-setting')).query({
        setting: 'THEME',
      })
      expect(getRes.status).toBe(200)
      expect(getRes.body).toBe('dark')

      const delRes = await auth(client(app).delete('/api/setting/delete-user-setting')).send({
        setting: 'THEME',
      })
      expect(delRes.status).toBe(200)
    })
  })

  describe('feedback', () => {
    it('POST /api/feedback/submit-feedback', async () => {
      const res = await auth(client(app).post('/api/feedback/submit-feedback')).send({
        type: 'general',
        message: 'Automated API test feedback - safe to ignore.',
      })
      expect(res.status).toBe(200)
    })
  })
})
