const request = require('supertest');
const chai = require('chai');
const { expect } = chai;
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const sinon = require('sinon');
const User = require('../models/User');

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
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('should log in and upload profile picture successfully', (done) => {
    const agent = request.agent(app);

    // GET signup to take the CSRF token
    agent
      .get('/signup')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        const signupCsrfMatch = res.text.match(/name="_csrf" value="([^"]+)"/);
        if (!signupCsrfMatch) {
          return done(new Error('Token CSRF não encontrado na página de signup'));
        }
        const signupCsrf = signupCsrfMatch[1];

        // 2. Signup with Token
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

            // 3. GET /account to take session CSRF token
            agent
              .get('/account')
              .expect(200)
              .end((err, res) => {
                if (err) return done(err);

                const csrfTokenMatch = res.text.match(/name="_csrf" value="([^"]+)"/);

                if (!csrfTokenMatch) {
                  return done(new Error('The CSRF token could not be found on the /account page.'));
                }

                const uploadCsrf = csrfTokenMatch[1];

                const imagePath = path.resolve(__dirname, 'uploads-test/test-avatar.jpg');

                if (!fs.existsSync(imagePath)) {
                  return done(new Error(`Test image not found at: ${imagePath}`));
                }

                // 4. Upload with Token
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

                      if (!user) {
                        return done(new Error('User not found in database'));
                      }

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
});
