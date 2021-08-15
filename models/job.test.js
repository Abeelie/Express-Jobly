"use strict";

const db = require("../db.js");
const Job = require("./job.js");
const { NotFoundError, BadRequestError } = require("../expressError");
const {commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    let newJob = {companyHandle: "c2", title: "CEO", salary: 100000, equity: "0.5"};

    test("works", async function () {
      let job = await Job.create(newJob);
      expect(job).toEqual({
          id: expect.any(Number), 
          companyHandle: "c2", 
          title: "CEO", 
          salary: 100000, 
          equity: "0.5"
        });
    });
});


/************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
      let companies = await Job.findAll();
      expect(companies).toEqual([
        {
          id: expect.any(Number),
          title: "j1",
          salary: 1,
          equity: "0.01",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "j2",
          salary: 2,
          equity: "0.02",
          companyHandle: "c2",
        },
        {
          id: expect.any(Number),
          title: "j3",
          salary: 3,
          equity: "0.03",
          companyHandle: "c3",
        },
      ]);
    });
  });


/************************************** get ID*/

describe("get ID", function () {
  test("works", async function () {
  const titles = "j1";
  const jobID = await db.query(`SELECT * FROM jobs WHERE title = $1`,[titles]);
  // console.log(jobID.rows[0].id)
 
  const job = await Job.get(jobID.rows[0].id);
  expect(job).toEqual({
    id: expect.any(Number),
    title: "j1",
    salary: 1,
    equity: "0.01",
    companyHandle: 'c1'
  });
});

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  let updateData = {title: "CFO", salary: 500000, equity: "0.5"};

  test("works", async function () {
    const titles = "j1";
    const jobID = await db.query(`SELECT * FROM jobs WHERE title = $1`,[titles]);
    
    let job = await Job.update(jobID.rows[0].id, updateData);
    expect(job).toEqual({
      id: expect.any(Number),
      companyHandle: "c1",
      title: "CFO",
      salary: 500000,
      equity: "0.5",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, {title: "test"});
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});



/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const titles = "j1";
    const jobID = await db.query(`SELECT * FROM jobs WHERE title = $1`,[titles]);
    
    await Job.remove(jobID.rows[0].id);
    const res = await db.query(`SELECT id FROM jobs WHERE id=$1`, [jobID.rows[0].id]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});



/****************************************filter */

describe("filter", function () {
test("works: by name", async function () {
  const jobs = await Job.filter({ title: "j1" });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 1,
        equity: "0.01",
        companyHandle: "c1",
      }
    ]);
  });

test("works: by min salary", async function () {
  const jobs = await Job.filter({ minSalary: 3 });
  expect(jobs).toEqual([
    {
      id: expect.any(Number),
      title: "j3",
      salary: 3,
      equity: "0.03",
      companyHandle: "c3",
    },
  ]);
});

test("works: by equity", async function () {
  const jobs = await Job.filter({ hasEquity: true });
  expect(jobs).toEqual([
    {
      id: expect.any(Number),
      title: "j1",
      salary: 1,
      equity: "0.01",
      companyHandle: "c1",
    },
    {
      id: expect.any(Number),
      title: "j2",
      salary: 2,
      equity: "0.02",
      companyHandle: "c2",
    },
    {
      id: expect.any(Number),
      title: "j3",
      salary: 3,
      equity: "0.03",
      companyHandle: "c3",
    },
  ]);
});

test("works: by min salary & equity", async function () {
  const jobs = await Job.filter({ minSalary: 3, hasEquity: true });
  expect(jobs).toEqual([
    {
      id: expect.any(Number),
      title: "j3",
      salary: 3,
      equity: "0.03",
      companyHandle: "c3",
    },
  ]);
});
});