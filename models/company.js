"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    const jobs = await db.query(
      `SELECT id, title, salary, equity
       FROM jobs
       WHERE company_handle = $1
       ORDER BY id`,
    [handle],
    );

    company.jobs = jobs.rows

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }


  static async filter(option){
 
    // creating a base Query SQL statement to be used later
    let baseQuery = `SELECT handle,
                      name,
                      description,
                      num_employees AS "numEmployees",
                      logo_url AS "logoUrl"
                      FROM companies`;

    /** Assigning the values from the req.query object keys to 
     *  name, maxEmployees, and minEmployees
    */
    let name = option.name;
    let maxEmployees = option.maxEmployees;
    let minEmployees  = option.minEmployees;
    
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


    // This is to prevent errors that can happen when a user
    // places a higher value for minEmployees than maxEmployees

    if (minEmployees > maxEmployees) {
      throw new BadRequestError("Min employees cannot be greater than max");
    }

 
    if (name) {
      value.push(name);
      addSQL.push(`name ILIKE $${value.length}`);
    }
 
    if (maxEmployees) {
      value.push(Number(maxEmployees));
      addSQL.push(`num_employees <= $${value.length}`);
    }
   
    if (minEmployees) {
      value.push(Number(minEmployees));
      addSQL.push(`num_employees >= $${value.length}`);
    }

   
    // If there are added SQL statements in the addSQL array
    // then combine the baseQuery with the addSQL and also include
    // the where clause and and clause for mutiple query request
    if (addSQL.length > 0) {
      baseQuery += " WHERE " + addSQL.join(" AND ");
      console.log(baseQuery)
    }

    // Performing the db query and returning the results
    const result = await db.query(baseQuery, value);
    return result.rows;
  }
 }







module.exports = Company;
