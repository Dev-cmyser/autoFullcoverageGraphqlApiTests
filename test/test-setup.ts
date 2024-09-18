type Constants = {
  app: any;
  rawServer: any;
  accesToken: string;
  refreshToken: string;
};

export const consts: Constants = {
  app: '',
  rawServer: '',
  accesToken: '',
  refreshToken: '',
};

beforeAll(async () => {
  // creating testing module
  //
  // const app = ;
  // await app.init();
  // const rawServer = app.getHttpServer();
  //
  // some getting login data nedeed for all tests
  //
  // const [accesToken, refreshToken] = await getLoginData(app);
  // consts.app = app;
  // consts.rawServer = rawServer;
  // consts.accesToken = accesToken;
  // consts.refreshToken = refreshToken;
});

afterAll(async () => {
  await consts.app.close();
});
