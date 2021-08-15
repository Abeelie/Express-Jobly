"use strict";

const db = require("../db");
const { NotFoundError} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


class Job {
  /** Create a job from the data.
   * Returns { id, title, salary, equity, companyHandle }
   **/

  static async create(data) {
    const result = await db.query(
          `INSERT INTO jobs (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [data.title, data.salary, data.equity, data.companyHandle]);

    return result.rows[0];
  }


  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * */

  static async findAll() {
    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           ORDER BY id`);

    return result.rows;
  }  


// Update job data with data. Throws NotFoundError if not found.

 static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;

    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

// Return data about job by id. Throws NotFoundError if not found.
   
 static async get(id) {
    const jobRes = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }


// Delete given job from database. Throws NotFoundError if job not found.

 static async remove(id) {
    const result = await db.query(
          `DELETE FROM jobs WHERE id = $1
           RETURNING id, title, company_handle AS "companyHandle"`,
        [id]);

    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }



  /** 
  *Filter jobs by title, minSalary, and hasEquity 
  *Returns [{id, title, salary, equity, company_handle}, ...]
  */
  
  static async filter(option){
    // creating a base Query SQL statement to be used later
    let baseQuery = `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs`;


    /** Assigning the values from the req.query object keys to 
     *  title, minSalary, and hasEquity
    */
     let title = option.title;
     let minSalary = option.minSalary;
     let hasEquity  = option.hasEquity;

    /**
     *  Creating the addSQL array is for added SQL statements based on 
     *  if there is values for name, maxEmployees or minEmployees or
     *  all three. This query is combined later with the baseQuery
     * 
     *  The value array is for the actual value to be used in place of the
     *  $1 parameter.
     */
     const addSQL = [];
     const value = [];
    
    
    if(title) {
      value.push(title)
      addSQL.push(`title ILIKE $${value.length}`)
    }

    if(minSalary){
      value.push(minSalary)
      addSQL.push(`salary >= $${value.length}`)
    }


    if(hasEquity === 'true'){
      addSQL.push(`equity > 0`)
    }

   
    if(addSQL.length > 0){
      baseQuery += " WHERE " + addSQL.join(" AND ")
    }
    
  
    const result = await db.query(baseQuery, value);
    return result.rows;
  }
}




module.exports = Job;
