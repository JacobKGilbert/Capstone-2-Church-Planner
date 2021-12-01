'use strict'

const db = require('../db')
const {
  NotFoundError,
  BadRequestError,
} = require('../expressError')
const User = require("../models/user")
const Position = require("../models/position")
const { sqlForPartialUpdate, updateDepartmentQuery} = require("../helpers/sql")

/** Related functions for departments. */
class Department {
  /** Create a new department.
   * Accepts code (max length of three char), name, and deptHead (may be null)
   */
  static async create(code, name, deptHead) {
    const duplicateCheck = await db.query(
      `SELECT code, name
       FROM departments
       WHERE code = $1`,
      [code]
    )

    if (duplicateCheck.rows[0])
      throw new BadRequestError('A department with that code already exists.')

    const result = await db.query(
      `INSERT INTO departments (code, name, dept_head)
       VALUES ($1, $2, $3)
       RETURNING code, name, dept_head AS deptHead`,
      [code, name, deptHead]
    )

    const department = result.rows[0]

    return department
  }

  /** Get All Departments
   *  Returns a list of all departments [{ code, name, deptHead }, ...]
   */
  static async getAll() {
    const result = await db.query(
      `SELECT code,
              name, 
              dept_head AS "deptHead"
       FROM departments`
    )

    const departments = result.rows

    return departments
  }

  static async get(code) {
    const deptResult = await db.query(
      `SELECT code, name, dept_head
       FROM departments
       WHERE code = $1`,
      [code]
    )
    const department = deptResult.rows[0]

    const eventResult = await db.query(
      `SELECT id, date
       FROM events
       WHERE dept_code = $1`,
      [code]
    )

    department.events =
      eventResult.rows.map((e) => {
        return { id: e.id, date: e.date }
      }) || []

    department.positions = await Position.getForDepartment(code)

    department.voluteers = await User.findAllVolunteers(code)

    return department
  }

  /** Update Department
   *  Data may include { name [str], deptHead [int] }
   *  Returns { code, name, deptHead }
   */
  static async update(code, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      deptHead: 'dept_head',
    })

    const department = await updateDepartmentQuery(code, setCols, values)

    return department
  }

  /** Delete given department from database; returns undefined. */
  static async delete(code) {
    const result = await db.query(
      `DELETE 
       FROM departments
       WHERE code = $1
       RETURNING code`,
      [code]
    )
    const department = result.rows[0]

    if (!department)
      throw new NotFoundError(`No department with code: ${code}`)
  }
}

module.exports = Department;