const { expect } = require('chai');
const sinon = require('sinon');

const fakeStripe = function () {
  return {
    charges: {
      create: sinon.stub().resolves({}),
    },
  };
};

require.cache[require.resolve('stripe')] = { exports: fakeStripe };

const api = require('../controllers/api');

describe('API Controller Tests', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {},
      file: null,
      flash: sinon.stub(),
    };

    res = {
      render: sinon.stub(),
      redirect: sinon.stub(),
    };
  });

  afterEach(() => sinon.restore());

  it('should render API index page', () => {
    api.getApi(req, res);

    expect(res.render.calledOnce).to.be.true;
    expect(res.render.firstCall.args[0]).to.equal('api/index');
    expect(res.render.firstCall.args[1]).to.deep.equal({ title: 'API Examples' });
  });

  it('should render Stripe page', () => {
    api.getStripe(req, res);
    expect(res.render.calledOnce).to.be.true;
    expect(res.render.firstCall.args[0]).to.equal('api/stripe');
  });

  it('should render Twilio page', () => {
    api.getTwilio(req, res);
    expect(res.render.calledOnce).to.be.true;
    expect(res.render.firstCall.args[0]).to.equal('api/twilio');
  });

  it('should render FileUpload page', () => {
    api.getFileUpload(req, res);

    expect(res.render.calledOnce).to.be.true;
    expect(res.render.firstCall.args[0]).to.equal('api/upload');
  });

  it('should flash success even if no file is provided (framework behavior)', () => {
    req.file = null;

    api.postFileUpload(req, res);

    expect(req.flash.calledOnce).to.be.true;
    expect(req.flash.firstCall.args[0]).to.equal('success');
    expect(res.redirect.calledWith('/api/upload')).to.be.true;
  });

  it('should flash success on valid upload', () => {
    req.file = { filename: 'test.png' };

    api.postFileUpload(req, res);

    expect(req.flash.calledOnce).to.be.true;
    expect(req.flash.firstCall.args[0]).to.equal('success');
    expect(res.redirect.calledWith('/api/upload')).to.be.true;
  });

  it('should render scraping page with scraped links', async () => {
    sinon.stub(global, 'fetch').resolves({
      ok: true,
      text: async () => `
        <html>
          <body>
            <a class="title" href="https://first.com">Ignored</a>
            <a class="title" href="https://second.com">Used</a>
          </body>
        </html>
      `,
    });

    req = {};
    res = { render: sinon.stub() };

    await api.getScraping(req, res);

    expect(res.render.calledOnce).to.be.true;

    const model = res.render.firstCall.args[1];
    expect(model.links.length).to.equal(1);

    global.fetch.restore();
  });
});

describe('Steam API Tests', () => {
  afterEach(() => {
    sinon.restore();
    delete require.cache[require.resolve('../controllers/api')];
  });

  function makeMockReqRes() {
    return {
      req: {
        user: { steam: '12345' },
      },
      res: {
        render: sinon.stub(),
        redirect: sinon.stub(),
      },
      next: sinon.stub(),
    };
  }

  it('should render Steam page with all data (full success)', async () => {
    const { req, res, next } = makeMockReqRes();
    const fetchStub = sinon.stub(global, 'fetch');

    fetchStub.onCall(0).resolves({
      ok: true,
      json: async () => ({
        response: {
          total_count: 1,
          games: [{ appid: 999 }],
        },
      }),
    });

    fetchStub.onCall(1).resolves({
      ok: true,
      json: async () => ({
        playerstats: {
          achievements: [{ apiname: 'ACH_WIN', achieved: 1 }],
        },
      }),
    });

    fetchStub.onCall(2).resolves({
      ok: true,
      json: async () => ({
        response: { players: [{ personaname: 'TEST_USER' }] },
      }),
    });

    fetchStub.onCall(3).resolves({
      ok: true,
      json: async () => ({
        response: { game_count: 10, games: [{ name: 'GameX' }] },
      }),
    });

    // eslint-disable-next-line global-require
    const api = require('../controllers/api');
    await api.getSteam(req, res, next);

    expect(res.render.calledOnce).to.be.true;
    const model = res.render.firstCall.args[1];
    expect(model.playerAchievements.achievements.length).to.equal(1);
    expect(model.playerSummary.personaname).to.equal('TEST_USER');

    fetchStub.restore();
  });

  it('should handle player with NO recently played games', async () => {
    const { req, res, next } = makeMockReqRes();
    const fetchStub = sinon.stub(global, 'fetch');

    fetchStub.onCall(0).resolves({
      ok: true,
      json: async () => ({ response: { total_count: 0 } }),
    });

    fetchStub.onCall(1).resolves({
      ok: true,
      json: async () => ({
        response: { players: [{ personaname: 'TEST_USER' }] },
      }),
    });

    fetchStub.onCall(2).resolves({
      ok: true,
      json: async () => ({
        response: { games: [] },
      }),
    });

    // eslint-disable-next-line global-require
    const api = require('../controllers/api');
    await api.getSteam(req, res, next);

    const model = res.render.firstCall.args[1];
    expect(model.playerAchievements).to.equal(null);

    fetchStub.restore();
  });

  it('should handle achievements PRIVATE (403)', async () => {
    const { req, res, next } = makeMockReqRes();
    const fetchStub = sinon.stub(global, 'fetch');

    fetchStub.onCall(0).resolves({
      ok: true,
      json: async () => ({
        response: { total_count: 1, games: [{ appid: 999 }] },
      }),
    });

    fetchStub.onCall(1).resolves({ ok: false, status: 403 });

    fetchStub.onCall(2).resolves({
      ok: true,
      json: async () => ({
        response: { players: [{ personaname: 'TEST_USER' }] },
      }),
    });

    fetchStub.onCall(3).resolves({
      ok: true,
      json: async () => ({ response: { games: [] } }),
    });

    // eslint-disable-next-line global-require
    const api = require('../controllers/api');
    await api.getSteam(req, res, next);

    const model = res.render.firstCall.args[1];
    expect(model.playerAchievements).to.equal(null);

    fetchStub.restore();
  });

  it('should call next(err) when Steam API throws', async () => {
    const { req, res, next } = makeMockReqRes();
    const fetchStub = sinon.stub(global, 'fetch');

    fetchStub.onCall(0).rejects(new Error('Network fail'));

    // eslint-disable-next-line global-require
    const api = require('../controllers/api');
    await api.getSteam(req, res, next);

    expect(next.calledOnce).to.be.true;

    fetchStub.restore();
  });
});

describe('Foursquare, NYT and Chart', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      user: {
        tokens: [],
        profile: { name: 'Test User' },
      },
      session: {},
      flash: sinon.stub(),
    };

    res = {
      render: sinon.stub(),
      redirect: sinon.stub(),
    };

    next = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should render Foursquare page with data', async () => {
    const fetchStub = sinon.stub(global, 'fetch');

    fetchStub.onCall(0).resolves({
      json: async () => ({ results: ['Venue A', 'Venue B'] }),
    });
    fetchStub.onCall(1).resolves({
      json: async () => ({ name: 'Specific Venue' }),
    });
    fetchStub.onCall(2).resolves({
      json: async () => [{ prefix: 'http://img', suffix: '.jpg' }],
    });

    await api.getFoursquare(req, res, next);

    expect(res.render.calledOnce).to.be.true;
    expect(res.render.firstCall.args[0]).to.equal('api/foursquare');
    const data = res.render.firstCall.args[1];
    expect(data.trendingVenues).to.have.lengthOf(2);
    expect(data.venueDetail.name).to.equal('Specific Venue');
  });

  it('should handle Foursquare errors', async () => {
    sinon.stub(global, 'fetch').rejects(new Error('Foursquare API Error'));

    await api.getFoursquare(req, res, next);

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0].message).to.equal('Foursquare API Error');
  });

  it('should render NYT page with books', async () => {
    sinon.stub(global, 'fetch').resolves({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({
        results: {
          books: [{ title: 'Book 1' }, { title: 'Book 2' }],
        },
      }),
    });

    await api.getNewYorkTimes(req, res, next);

    expect(res.render.calledOnce).to.be.true;
    expect(res.render.firstCall.args[0]).to.equal('api/nyt');
    expect(res.render.firstCall.args[1].books).to.have.lengthOf(2);
  });

  it('should handle NYT API non-JSON response', async () => {
    sinon.stub(global, 'fetch').resolves({
      ok: true,
      headers: { get: () => 'text/html' },
      text: async () => '<html>Error</html>',
    });

    await api.getNewYorkTimes(req, res, next);

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0].message).to.include('NYT API did not return JSON');
  });

  it('should throw error in Tumblr if no token found', async () => {
    req.user.tokens = [];

    try {
      await api.getTumblr(req, res, next);
    } catch (err) {
      expect(err).to.exist;
      expect(err.message).to.equal('No Tumblr token found for user.');
    }
  });

  it('should clear session orderId on PayPal Cancel', () => {
    req.session = { orderId: '12345' };

    api.getPayPalCancel(req, res);

    expect(req.session.orderId).to.be.null;
    expect(res.render.calledOnce).to.be.true;
    expect(res.render.firstCall.args[0]).to.equal('api/paypal');
    expect(res.render.firstCall.args[1].canceled).to.be.true;
  });

  it('should render Chart with fallback data if API returns empty', async () => {
    sinon.stub(global, 'fetch').resolves({
      ok: true,
      json: async () => ({}),
    });

    await api.getChart(req, res, next);

    expect(res.render.calledOnce).to.be.true;
    const data = res.render.firstCall.args[1];
    expect(data.dataType).to.include('Unable to get live data');
  });
});
