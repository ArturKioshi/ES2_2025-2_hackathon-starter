const request = require('supertest');
const chai = require('chai');
const { expect } = chai;
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const sinon = require('sinon');
const User = require('../models/User');
const { extractCsrfToken } = require('./utils/csrfToken');

let app;

describe('Profile Picture Upload', () => {
  let mongoServer;

  const testUser = {
    email: 'test-upload@example.com',
    password: 'password123',
    name: 'Test User',
  };

  before(async () => {
    await mongoose.disconnect();

    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    process.env.MONGODB_URI = mongoUri;

    const mongooseOpts = {
      autoIndex: false,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 20000,
    };

    await mongoose.connect(mongoUri, mongooseOpts);

    /* eslint-disable global-require */
    app = require('../app');
  });

  beforeEach(async () => {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
  });

  afterEach(() => {
    sinon.restore();
  });

  after(async () => {
    // Clean upload files
    const uploadDir = path.join(__dirname, '../uploads');
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }

    if (mongoose.connection) {
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('should login and upload profile picture successfully', (done) => {
    const agent = request.agent(app);

    agent
      .get('/signup')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        const signupCsrf = extractCsrfToken(res);
        if (!signupCsrf) return done(new Error('CSRF Signup Token not found'));

        agent
          .post('/signup')
          .send({
            email: testUser.email,
            password: testUser.password,
            confirmPassword: testUser.password,
            _csrf: signupCsrf,
          })
          .expect(302)
          .end((err) => {
            if (err) return done(err);

            agent
              .get('/account')
              .expect(200)
              .end((err, res) => {
                if (err) return done(err);

                const uploadCsrf = extractCsrfToken(res);
                if (!uploadCsrf) return done(new Error('CSRF Account Token not found'));

                const imagePath = path.resolve(__dirname, 'uploads-test/test-avatar.jpg');
                if (!fs.existsSync(imagePath)) return done(new Error(`Image not found: ${imagePath}`));

                agent
                  .post('/account/profile')
                  .field('name', testUser.name)
                  .field('email', testUser.email)
                  .field('_csrf', uploadCsrf)
                  .attach('photo', imagePath)
                  .expect(302)
                  .end(async (err) => {
                    if (err) return done(err);

                    try {
                      const user = await User.findOne({ email: testUser.email });
                      if (!user) return done(new Error('User not found'));

                      expect(user.profile.picture).to.be.a('string');
                      expect(user.profile.picture).to.match(/^\/avatars\//);
                      done();
                    } catch (e) {
                      done(e);
                    }
                  });
              });
          });
      });
  });

  it('should replace profile picture and delete the old file from disk', async () => {
    const agent = request.agent(app);

    const signupPage = await agent.get('/signup').expect(200);
    const signupCsrf = extractCsrfToken(signupPage);

    await agent
      .post('/signup')
      .send({
        email: testUser.email,
        password: testUser.password,
        confirmPassword: testUser.password,
        _csrf: signupCsrf,
      })
      .expect(302);

    // First Upload
    const accountPage = await agent.get('/account').expect(200);
    const uploadCsrf = extractCsrfToken(accountPage);
    const imagePath = path.resolve(__dirname, 'uploads-test/test-avatar.jpg');

    await agent.post('/account/profile').field('name', testUser.name).field('email', testUser.email).field('_csrf', uploadCsrf).attach('photo', imagePath).expect(302);

    const userV1 = await User.findOne({ email: testUser.email });
    const pathV1 = userV1.profile.picture;

    // Converts virtual URL (/avatars/..) to physical path (../uploads/..)
    // LocalStorage saves to: path.join(__dirname, '../../uploads') (relative to the provider's file)
    const relativePathV1 = pathV1.replace('/avatars/', '');
    const physicalPathV1 = path.join(__dirname, '../uploads', relativePathV1);

    expect(fs.existsSync(physicalPathV1)).to.be.true;

    // Second Upload
    const accountPage2 = await agent.get('/account').expect(200);
    const uploadCsrf2 = extractCsrfToken(accountPage2);

    await agent.post('/account/profile').field('name', testUser.name).field('email', testUser.email).field('_csrf', uploadCsrf2).attach('photo', imagePath).expect(302);

    const userV2 = await User.findOne({ email: testUser.email });
    const pathV2 = userV2.profile.picture;

    expect(pathV1).to.not.equal(pathV2);
    expect(fs.existsSync(physicalPathV1)).to.be.false;

    const relativePathV2 = pathV2.replace('/avatars/', '');
    const physicalPathV2 = path.join(__dirname, '../uploads', relativePathV2);
    expect(fs.existsSync(physicalPathV2)).to.be.true;
  });
});
