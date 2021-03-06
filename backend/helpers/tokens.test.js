const jwt = require("jsonwebtoken");
const { createToken } = require("./tokens");
const { SECRET_KEY } = require("../config");

describe("createToken", function () {
  test("works: not admin", function () {
    const token = createToken({ id: 1, isAdmin: false, isDeptHead: false });
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      iat: expect.any(Number),
      id: 1,
      isAdmin: false,
      isDeptHead: false
    });
  });

  test("works: admin", function () {
    const token = createToken({ id: 1, isAdmin: true, isDeptHead: false })
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      iat: expect.any(Number),
      id: 1,
      isAdmin: true,
      isDeptHead: false,
    })
  });

  test("works: dept head", function () {
    const token = createToken({ id: 1, isAdmin: false, isDeptHead: true })
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      iat: expect.any(Number),
      id: 1,
      isAdmin: false,
      isDeptHead: true,
    })
  });

  test("works: default not admin/deptHead", function () {
    // given the security risk if this didn't work, checking this specifically
    const token = createToken({ id: 1 })
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      iat: expect.any(Number),
      id: 1,
      isAdmin: false,
      isDeptHead: false,
    })
  });
});
