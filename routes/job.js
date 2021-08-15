"use strict";

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jsonschema = require("jsonschema");
const express = require("express");
const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");
const router = express.Router({ mergeParams: true });



/** GET / 
 * Search filter in includes:
 * - title 
 * - minSalary
 * - hasEquity 
 * Authorization required: none
 */

 router.get("/", async function (req, res, next) {
    try {
      if (req.query.title || req.query.minSalary || req.query.hasEquity){
        const jobs = await Job.filter(req.query);
        return res.json({ jobs });
      } else {
        const jobs = await Job.findAll();
        return res.json({ jobs });
      }
    } catch (err) {
      return next(err);
    }
  });
  

  /** POST / { job } 
   * Create a job
   * Authorization required: admin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      const job = await Job.create(req.body);
      return res.status(201).json({ job });
    } catch (err) {
      return next(err);
    }
  });



/** GET /[jobId]
 * Authorization required: none
 */

 router.get("/:id", async function (req, res, next) {
    try {
      const job = await Job.get(req.params.id);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  });




  /** PATCH /[jobId]
   * Authorization required: admin
  */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      const job = await Job.update(req.params.id, req.body);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  });


  /** DELETE /[handle]  =>  { deleted: id }
   * Authorization required: admin
  */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
    try {
      await Job.remove(req.params.id);
      return res.json({ deleted: +req.params.id });
    } catch (err) {
      return next(err);
    }
  });
  
  
  module.exports = router;
  