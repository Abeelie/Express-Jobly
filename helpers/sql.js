const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

/**
 * dataToUpdate contains the data to be updated in the database which are the values
 * jsToSql contains the column names to be matched with the datatoUpdate
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  //Creating a const key variable that containes the keys from the dataToUpdate
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  /** 
   * Mapping the keys to the columns
   * */
  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    /** 
     * setCols is the string result of mapping the keys to the column name
     * values is the actual values that correspond to the columns
     * */
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
