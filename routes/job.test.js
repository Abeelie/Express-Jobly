"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


 /************************************** GET /jobs */

 describe("GET /jobs", function () {
    test("ok for anon", async function () {
      
      const resp = await request(app).get("/jobs");
      expect(resp.body).toEqual({
        jobs:
            [
              {
                id: expect.any(Number),
                title: "VP",
                salary: 50000,
                equity: "0.3",
                companyHandle: "c2"
              },
              {
                id: expect.any(Number),
                title: "CEO",
                salary: 80000,
                equity: "0.5",
                companyHandle: "c2"
              }
            ],
      });
    });
  
    test("filtering", async function (){
      const resp = await request(app).get("/jobs?title=CEO&minSalary=80000");
      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({
        jobs: [
          {
            id: expect.any(Number),
            title: "CEO",
            salary: 80000,
            equity: "0.5",
            companyHandle: "c2"
          }
        ]
      })
    })
  });

  /************************************** GET ID /jobs */

  describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
      const titles = "VP";
      const jobID = await db.query(`SELECT * FROM jobs WHERE title = $1`,[titles]);
 
      const resp = await request(app).get(`/jobs/${jobID.rows[0].id}`);
      expect(resp.body).toEqual({
        job: {
          id: expect.any(Number),
          title: "VP",
          salary: 50000,
          equity: "0.3",
          companyHandle: "c2"
        },
      });
    });
  
    test("not found for no such job", async function () {
      const resp = await request(app).get(`/jobs/0`);
      expect(resp.statusCode).toEqual(404);
    });
  });


  /************************************** POST /jobs */

  describe("POST /jobs", function () {
    test("ok for admin", async function () {
      const resp = await request(app)
          .post(`/jobs`)
          .send({
            companyHandle: "c3",
            title: "amazon",
            salary: 100000,
            equity: "0.5",
          })
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(201);
      expect(resp.body).toEqual({
        job: {
          id: expect.any(Number),
          title: "amazon",
          salary: 100000,
          equity: "0.5",
          companyHandle: "c3",
        },
      });
    });
  
    test("unauth for users", async function () {
      const resp = await request(app)
          .post(`/jobs`)
          .send({
            companyHandle: "c2",
            title: "amazon",
            salary: 100000,
            equity: "0.5",
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  });


  /************************************** PATCH /jobs */
  describe("PATCH /jobs/:id", function () {
    test("works for admin", async function () {
      const titles = "VP";
      const jobID = await db.query(`SELECT * FROM jobs WHERE title = $1`,[titles]);
      const resp = await request(app)
          .patch(`/jobs/${jobID.rows[0].id}`)
          .send({title: "Developer"})
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.body).toEqual({
        job: {
          id: expect.any(Number),
          title: "Developer",
          salary: 50000,
          equity: "0.3",
          companyHandle: "c2",
        },
      });
    });
  
    test("unauth for others", async function () {
      const titles = "VP";
      const jobID = await db.query(`SELECT * FROM jobs WHERE title = $1`,[titles]);
      const resp = await request(app)
          .patch(`/jobs/${jobID.rows[0].id}`)
          .send({
            title: "Manager",
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("not found on no such job", async function () {
      const resp = await request(app)
          .patch(`/jobs/0`)
          .send({
            handle: "new",
          })
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  });


  /************************************** DELETE /jobs */

  
describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    const titles = "VP";
    const jobID = await db.query(`SELECT * FROM jobs WHERE title = $1`,[titles]);

    const resp = await request(app)
        .delete(`/jobs/${jobID.rows[0].id}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: jobID.rows[0].id });
  });

  test("unauth for others", async function () {
    const titles = "VP";
    const jobID = await db.query(`SELECT * FROM jobs WHERE title = $1`,[titles]);
    
    const resp = await request(app)
        .delete(`/jobs/${jobID.rows[0].id}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
