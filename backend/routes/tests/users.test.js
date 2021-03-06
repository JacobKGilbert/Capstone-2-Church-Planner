"use strict";

const request = require("supertest");

const db = require("../../db.js");
const app = require("../../app");
const User = require("../../models/user");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  adminToken,
  deptHeadToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /users */

describe("POST /users", function () {
  test("works for admins: create non-admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: false,
          isDeptHead: false
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        id: expect.any(Number),
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        needsNewPwd: true,
        isAdmin: false,
        isDeptHead: false
      }, token: expect.any(String),
    });
  });

  test("works for admins: create admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
          isDeptHead: false
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        id: expect.any(Number),
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        needsNewPwd: true,
        isAdmin: true,
        isDeptHead: false
      }, token: expect.any(String),
    });
  });

  test("unauth for users", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
          isDeptHead: false
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
          isDeptHead: false
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if missing data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({})
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "not-an-email",
          isAdmin: true,
          isDeptHead: false
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /users */

describe("GET /users", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      users: [
        {
          id: expect.any(Number),
          firstName: 'A1F',
          lastName: 'A1L',
          email: 'admin1@user.com',
          needsNewPwd: true,
          isAdmin: true,
          isDeptHead: false,
        },
        {
          id: expect.any(Number),
          firstName: 'D1F',
          lastName: 'D1L',
          email: 'deptHead1@user.com',
          needsNewPwd: true,
          isAdmin: false,
          isDeptHead: true,
        },
        {
          id: expect.any(Number),
          firstName: 'U1F',
          lastName: 'U1L',
          email: 'user1@user.com',
          needsNewPwd: true,
          isAdmin: false,
          isDeptHead: false,
        },
        {
          id: expect.any(Number),
          firstName: 'U2F',
          lastName: 'U2L',
          email: 'user2@user.com',
          needsNewPwd: true,
          isAdmin: false,
          isDeptHead: false,
        },
      ],
    })
  });

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get("/users");
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE users CASCADE");
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /users/:id */

describe("GET /users/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .get(`/users/1`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        id: 1,
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        needsNewPwd: true,
        isAdmin: false,
        isDeptHead: false,
        positions: expect.any(Array),
        unavailable: expect.any(Array),
        events: expect.any(Array),
      },
    });
  });

  test("works for correct user", async function () {
    const resp = await request(app)
        .get(`/users/1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        id: 1,
        firstName: 'U1F',
        lastName: 'U1L',
        email: 'user1@user.com',
        needsNewPwd: true,
        isAdmin: false,
        isDeptHead: false,
        positions: expect.any(Array),
        unavailable: expect.any(Array),
        events: expect.any(Array),
      },
    })
  });

  test("unauth for other users", async function () {
    const resp = await request(app)
        .get(`/users/1`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get(`/users/1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user not found", async function () {
    const resp = await request(app)
        .get(`/users/0`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /users/:id */

describe("PATCH /users/:id", () => {
  test("works for admins", async function () {
    const resp = await request(app)
        .patch(`/users/1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        id: 1,
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        needsNewPwd: true,
        isAdmin: false,
        isDeptHead: false
      },
    });
  });

  test("works for correct user", async function () {
    const resp = await request(app)
        .patch(`/users/1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        id: 1,
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        needsNewPwd: true,
        isAdmin: false,
        isDeptHead: false
      },
    });
  });

  test("unauth if incorrect user", async function () {
    const resp = await request(app)
        .patch(`/users/1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/users/1`)
        .send({
          firstName: "New",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if no such user", async function () {
    const resp = await request(app)
        .patch(`/users/0`)
        .send({
          firstName: "Nope",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .patch(`/users/1`)
        .send({
          firstName: 42,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /users/:id */

describe("DELETE /users/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .delete(`/users/1`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: "1" });
  });

  test("unauth for user", async function () {
    const resp = await request(app)
        .delete(`/users/1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401)
  });

  test("unauth if incorrect user", async function () {
    const resp = await request(app)
        .delete(`/users/1`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/users/1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user missing", async function () {
    const resp = await request(app)
        .delete(`/users/0`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /users/:id/password */

describe('PATCH /users/:id/password', function () {
  test('works: for admin', async function () {
    const resp = await request(app)
      .patch(`/users/1/password`)
      .send({
        password: 'password1',
        newPassword: 'newPassword1'
      })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.body).toEqual({
      user: {
        id: 1,
        firstName: 'U1F',
        lastName: 'U1L',
        email: 'user1@user.com',
        needsNewPwd: false,
        isAdmin: false,
        isDeptHead: false,
      },
    })
  })

  test('works: for correct user', async function () {
    const resp = await request(app)
      .patch(`/users/1/password`)
      .send({
        password: 'password1',
        newPassword: 'newPassword1',
      })
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.body).toEqual({
      user: {
        id: 1,
        firstName: 'U1F',
        lastName: 'U1L',
        email: 'user1@user.com',
        needsNewPwd: false,
        isAdmin: false,
        isDeptHead: false,
      },
    })
  })

  test('unauth if incorrect user', async function () {
    const resp = await request(app)
      .patch(`/users/1/password`)
      .send({
        password: 'password1',
        newPassword: 'newPassword1',
      })
      .set('authorization', `Bearer ${u2Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test('unauth if incorrect password', async function () {
    const resp = await request(app)
      .patch(`/users/1/password`)
      .send({
        password: 'wrongPassword',
        newPassword: 'newPassword1',
      })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(401)
  })

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/users/1/password`)
        .send({
          password: 'password1',
          newPassword: 'newPassword1',
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if no such user", async function () {
    const resp = await request(app)
        .patch(`/users/0/password`)
        .send({
          password: 'password1',
          newPassword: 'newPassword1',
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request if missing password", async function () {
    const resp = await request(app)
        .patch(`/users/1/password`)
        .send({
          newPassword: 'newPassword1',
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  })

  test('bad request if missing newPassword', async function () {
    const resp = await request(app)
      .patch(`/users/1/password`)
      .send({
        password: 'password1',
      })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(400)
  })

  test('bad request if empty newPassword', async function () {
    const resp = await request(app)
      .patch(`/users/1/password`)
      .send({
        password: 'password1',
        newPassword: ''
      })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(400)
  })
})

/************************************** PATCH /user/:id/auth */

describe('PATCH /user/:id/auth', function() {

  test('works: makes user admin', async function () {
    const resp = await request(app)
      .patch('/users/1/auth')
      .send({
        isAdmin: true,
      })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.body).toEqual({
      user: {
        id: 1,
        firstName: 'U1F',
        lastName: 'U1L',
        email: 'user1@user.com',
        needsNewPwd: true,
        isAdmin: true,
        isDeptHead: false,
      },
    })
  })

  test('works: makes user deptHead', async function () {
    const resp = await request(app)
      .patch('/users/1/auth')
      .send({
        isDeptHead: true,
      })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.body).toEqual({
      user: {
        id: 1,
        firstName: 'U1F',
        lastName: 'U1L',
        email: 'user1@user.com',
        needsNewPwd: true,
        isAdmin: false,
        isDeptHead: true,
      },
    })
  })

  test('works: makes user admin and deptHead', async function () {
    const resp = await request(app)
      .patch('/users/1/auth')
      .send({
        isAdmin: true,
        isDeptHead: true,
      })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.body).toEqual({
      user: {
        id: 1,
        firstName: 'U1F',
        lastName: 'U1L',
        email: 'user1@user.com',
        needsNewPwd: true,
        isAdmin: true,
        isDeptHead: true,
      },
    })
  })

  test('fails: no such user', async function () {
    const resp = await request(app)
      .patch('/users/0/auth')
      .send({
        isAdmin: true,
      })
      .set('authorization', `Bearer ${adminToken}`)

    expect(resp.statusCode).toEqual(404)
  })

  test('fails: no data', async function () {
    const resp = await request(app)
      .patch('/users/1/auth')
      .send({})
      .set('authorization', `Bearer ${adminToken}`)

    expect(resp.statusCode).toEqual(400)
  })
})

/************************************** POST /users/:id/unavailable */

describe('POST /users/:id/unavailable', function () {
  const startDate = new Date(2022, 6, 16).toISOString().split('T')[0]
  const endDate = new Date(2022, 6, 17).toISOString().split('T')[0]

  test('works: for admin', async function () {
    const resp = await request(app)
      .post(`/users/1/unavailable`)
      .send({ dates: [startDate, endDate] })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.body).toEqual({ msg: "Successfully made unavailable."})

    const user = await User.get(1)
    expect(user).toEqual({
      id: 1,
      firstName: 'U1F',
      lastName: 'U1L',
      email: 'user1@user.com',
      needsNewPwd: true,
      isAdmin: false,
      isDeptHead: false,
      positions: expect.any(Array),
      events: expect.any(Array),
      unavailable: [
        {
          id: 1,
          dates: expect.any(Array),
        },
        {
          id: 2,
          dates: expect.any(Array),
        },
      ],
    })
  })

  test('works: for correct user', async function () {
    const resp = await request(app)
      .post(`/users/1/unavailable`)
      .send({ dates: [startDate, endDate] })
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.body).toEqual({ msg: 'Successfully made unavailable.' })

    const user = await User.get(1)
    expect(user).toEqual({
      id: 1,
      firstName: 'U1F',
      lastName: 'U1L',
      email: 'user1@user.com',
      needsNewPwd: true,
      isAdmin: false,
      isDeptHead: false,
      positions: expect.any(Array),
      events: expect.any(Array),
      unavailable: [
        {
          id: 1,
          dates: expect.any(Array),
        },
        {
          id: 3,
          dates: expect.any(Array),
        },
      ],
    })
  })

  test('unauth if incorrect user', async function () {
    const resp = await request(app)
      .post(`/users/1/unavailable`)
      .send({ dates: [startDate, endDate] })
      .set('authorization', `Bearer ${u2Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test('unauth for anon', async function () {
    const resp = await request(app)
      .post(`/users/1/unavailable`)
      .send({ dates: [startDate, endDate] })
    expect(resp.statusCode).toEqual(401)
  })

  test('not found if no such user', async function () {
    const resp = await request(app)
      .post(`/users/0/unavailable`)
      .send({ dates: [startDate, endDate] })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(404)
  })

  test('bad request if invalid data', async function () {
    const resp = await request(app)
      .post(`/users/1/unavailable`)
      .send({ date: 2 })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(400)
  })
})

/************************************** DELETE /users/:id/unavailable/:unvlId */

describe('DELETE /users/:id/unavailable/:unvlId', function () {
  test('works: for admin', async function () {
    const resp = await request(app)
      .delete(`/users/1/unavailable/1`)
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.body).toEqual({ msg: 'Successfully made available.' })
  })

  test('works: for user', async function () {
    const resp = await request(app)
      .delete(`/users/1/unavailable/1`)
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.body).toEqual({ msg: 'Successfully made available.' })
  })

  test('unauth if incorrect user', async function () {
    const resp = await request(app)
      .delete(`/users/1/unavailable/1`)
      .set('authorization', `Bearer ${u2Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test('unauth for anon', async function () {
    const resp = await request(app).delete(`/users/1/unavailable/1`)
    expect(resp.statusCode).toEqual(401)
  })

  test('not found if user missing', async function () {
    const resp = await request(app)
      .delete(`/users/0/unavailable/1`)
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(404)
  })

  test('not found if unavailable missing', async function () {
    const resp = await request(app)
      .delete(`/users/1/unavailable/0`)
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(404)
  })
})