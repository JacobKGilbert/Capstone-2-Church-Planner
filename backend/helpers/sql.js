const { BadRequestError, NotFoundError } = require("../expressError");
const db = require("../db");

/**
 * Helper for making selective update queries.
 *
 * The calling function can use it to make the SET clause of an SQL UPDATE
 * statement.
 *
 * @param dataToUpdate {Object} {field1: newVal, field2: newVal, ...}
 * @param jsToSql {Object} maps js-style data fields to database column names,
 *   like { firstName: "first_name", age: "age" }
 *
 * @returns {Object} {sqlSetCols, dataToUpdate}
 *
 * @example {firstName: 'Aliya', age: 32} =>
 *   { setCols: '"first_name"=$1, "age"=$2',
 *     values: ['Aliya', 32] }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

async function updateUserQuery(id, setCols, values) {
  const userIdVarIdx = '$' + (values.length + 1)

  const querySql = `UPDATE users 
                    SET ${setCols} 
                    WHERE id = ${userIdVarIdx} 
                    RETURNING id,
                              first_name AS "firstName",
                              last_name AS "lastName",
                              email,
                              needs_new_pwd AS "needsNewPwd",
                              is_admin AS "isAdmin",
                              is_dept_head AS "isDeptHead"`
  const result = await db.query(querySql, [...values, id])
  const user = result.rows[0]

  if (!user) throw new NotFoundError(`No user: ${id}`)

  return user
}

async function updateDepartmentQuery(deptCode, setCols, values) {
  const userIdVarIdx = '$' + (values.length + 1)

  const querySql = `UPDATE departments 
                    SET ${setCols} 
                    WHERE code = ${userIdVarIdx} 
                    RETURNING code,
                              name,
                              dept_head AS "deptHead"`
  const result = await db.query(querySql, [...values, deptCode])
  const department = result.rows[0]

  if (!department) 
    throw new NotFoundError(`No department with code: ${deptCode}`)

  return department
}

async function updatePositionQuery(posCode, setCols, values) {
  const userIdVarIdx = '$' + (values.length + 1)

  const querySql = `UPDATE positions 
                    SET ${setCols} 
                    WHERE code = ${userIdVarIdx} 
                    RETURNING code,
                              name,
                              dept_code AS "deptCode"`
  const result = await db.query(querySql, [...values, posCode])
  const position = result.rows[0]

  if (!position) 
    throw new NotFoundError(`No position with code: ${posCode}`)

  return position
}

async function getUnavailable(id) {
  const userUnavailableRes = await db.query(
    `SELECT id, 
            start_date AS "startDate", 
            end_date AS "endDate"
     FROM unavailable
     WHERE user_id = $1`,
    [id]
  )

  const getDaysArray = (start, end) => {
    const daysArr = []
    for (
      let dt = new Date(start);
      dt <= new Date(end);
      dt.setDate(dt.getDate() + 1)
    ) {
      daysArr.push(new Date(dt))
    }
    return daysArr
  }

  const unavailable = userUnavailableRes.rows.map(u => {
    const dates = getDaysArray(u.startDate, u.endDate)
    return { id: u.id, dates: dates}
  }) || []

  return unavailable
}

module.exports = { 
  sqlForPartialUpdate, 
  updateUserQuery, 
  updateDepartmentQuery,
  updatePositionQuery,
  getUnavailable 
};
