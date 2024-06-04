/**
 * This is the main server script that provides the API endpoints
 *
 * Uses sqlite.js to connect to db
 */

const fastify = require("fastify")({ logger: true });

const cors = require('@fastify/cors');
fastify.register(cors, {
  origin: true,
  credentials: true
});


fastify.register(require("@fastify/formbody"));

const db = require("./sqlite.js");
const errorMessage =
  "Error connecting to the database!";


const routes = { endpoints: [] };
fastify.addHook("onRoute", routeOptions => {
  routes.endpoints.push(routeOptions.method + " " + routeOptions.path);
});


fastify.get("/", (request, reply) => {
  const data = {
    title: "Youxue Server API",
    intro: "A database-backed API with the following endpoints",
    routes: routes.endpoints
  };
  reply.status(200).send(data);
});


// User registration
fastify.post("/register", async (request, reply) => {
  let data = {};
  const usernameExists = await db.checkUsername(request.body.username);
  if (usernameExists) {
    data.success = false;
    data.error = "Username is already taken.";
  } else {
    const userId = await db.addUser(request.body.username, request.body.password);
    if (userId) {
      data.success = true;
      data.userId = userId;  
    } else {
      data.success = false;
    }
  }
  const status = data.success ? 201 : 400;
  reply.status(status).send(data);
});



fastify.get("/checkUsername", async (request, reply) => {
  let data = {};
  const userId = await db.checkUsername(request.query.username);
  if (userId) {
    data.userId = userId;
  } else {
    data.error = "Username does not exist.";
  }
  const status = data.userId ? 200 : 400;
  reply.status(status).send(data);
});

// User login
fastify.post("/login", async (request, reply) => {
  let data = {};
  data.userId = await db.login(request.body.username, request.body.password);
  if (!data.userId) {
    data.error = "Invalid username or password.";
  }
  const status = data.userId ? 200 : 400;
  reply.status(status).send(data);
});

// 获取游记列表
fastify.get("/diaries", async (request, reply) => {
  let data = {};
  data.diaries = await db.getDiaries();
  const status = data.diaries ? 200 : 400;
  reply.status(status).send(data);
});

// 添加新的游记
fastify.post("/diaries", async (request, reply) => {
  let data = {};
  data.diaryId = await db.addDiary(request.body.diary, request.body.authorId);
  if (!data.diaryId) {
    data.error = "Failed to add diary!";
  }
  const status = data.diaryId ? 201 : 400;
  reply.status(status).send(data);
});

// 为游记增加浏览量
fastify.put("/diaries/:id/view", async (request, reply) => {
  let data = {};
  data.success = await db.viewDiary(request.params.id);
  if (!data.success) {
    data.error = "Failed to update view count.";
  }
  const status = data.success ? 200 : 400;
  reply.status(status).send(data);
});

// 为游记评分
fastify.put("/diaries/:id/rate", async (request, reply) => {
  let data = {};
  data.success = await db.rateDiary(request.params.id, request.body.rating);
  if (!data.success) {
    data.error = "Failed to update rating.";
  }
  const status = data.success ? 200 : 400;
  reply.status(status).send(data);
});

// 获取推荐的游记列表
fastify.get("/diaries/recommended", async (request, reply) => {
  let data = {};
  data.diaries = await db.getRecommendedDiaries();
  const status = data.diaries ? 200 : 400;
  reply.status(status).send(data);
});

// 删除日记
fastify.delete("/diaries/:id", async (request, reply) => {
  let data = {};
  data.success = await db.deleteDiary(request.params.id);
  if (!data.success) {
    data.error = "Failed to delete diary.";
  }
  const status = data.success ? 200 : 400;
  reply.status(status).send(data);
});

// 为地区增加浏览量
fastify.put("/area/:name/views", async (request, reply) => {
  let data = {};
  data.success = await db.incrementViews(request.params.name);
  if (!data.success) {
    data.error = "Failed to update view count.";
  }
  const status = data.success ? 200 : 400;
  reply.status(status).send(data);
});

// 为地区增加点赞量
fastify.put("/area/:name/goods", async (request, reply) => {
  let data = {};
  data.success = await db.incrementGoods(request.params.name);
  if (!data.success) {
    data.error = "Failed to update goods count.";
  }
  const status = data.success ? 200 : 400;
  reply.status(status).send(data);
});

// 为地区增加点踩量
fastify.put("/area/:name/bads", async (request, reply) => {
  let data = {};
  data.success = await db.incrementBads(request.params.name);
  if (!data.success) {
    data.error = "Failed to update bads count.";
  }
  const status = data.success ? 200 : 400;
  reply.status(status).send(data);
});

// 添加新的地区
fastify.post("/area", async (request, reply) => {
  let data = {};
  data.areaId = await db.addArea(request.body.name);
  if (!data.areaId) {
    data.error = "Failed to add area!";
  }
  const status = data.areaId ? 201 : 400;
  reply.status(status).send(data);
});


// 更新地区浏览量
fastify.put("/area/:name/updateViews", async (request, reply) => {
  let data = {};
  data.success = await db.updateViews(request.params.name, request.body.views);
  if (!data.success) {
    data.error = "Failed to update views.";
  }
  const status = data.success ? 200 : 400;
  reply.status(status).send(data);
});

// 更新地区点赞量
fastify.put("/area/:name/updateGoods", async (request, reply) => {
  let data = {};
  data.success = await db.updateGoods(request.params.name, request.body.goods);
  if (!data.success) {
    data.error = "Failed to update goods.";
  }
  const status = data.success ? 200 : 400;
  reply.status(status).send(data);
});

// 更新地区点踩量
fastify.put("/area/:name/updateBads", async (request, reply) => {
  let data = {};
  data.success = await db.updateBads(request.params.name, request.body.bads);
  if (!data.success) {
    data.error = "Failed to update bads.";
  }
  const status = data.success ? 200 : 400;
  reply.status(status).send(data);
});

// 获取地区浏览量
fastify.get("/area/:name/getViews", async (request, reply) => {
  let data = {};
  data.views = await db.getViews(request.params.name);
  if (!data.views) {
    data.error = "Failed to get views.";
  }
  const status = data.views ? 200 : 400;
  reply.status(status).send(data);
});

// 获取地区点赞量
fastify.get("/area/:name/getGoods", async (request, reply) => {
  let data = {};
  data.goods = await db.getGoods(request.params.name);
  if (!data.goods) {
    data.error = "Failed to get goods.";
  }
  const status = data.goods ? 200 : 400;
  reply.status(status).send(data);
});

// 获取地区点踩量
fastify.get("/area/:name/getBads", async (request, reply) => {
  let data = {};
  data.bads = await db.getBads(request.params.name);
  if (!data.bads) {
    data.error = "Failed to get bads.";
  }
  const status = data.bads ? 200 : 400;
  reply.status(status).send(data);
});

// Run the server and report out to the logs
fastify.listen({ port: 9000, host: '0.0.0.0' }, function (err, address) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Your app is listening on ${address}`);
});

