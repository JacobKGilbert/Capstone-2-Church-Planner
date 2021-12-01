'use strict'

const db = require('../db')
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require('../expressError')

/** Related functions for Positions. */
class Position {
  /** Create a new position.
   * Accepts code (max length of four char), name, and deptCode (may not be null)
   */
  static async create(code, name, deptCode) {
    const duplicateCheck = await db.query(
      `SELECT code, name
       FROM positions
       WHERE code = $1`,
      [code]
    )

    if (duplicateCheck.rows[0])
      throw new BadRequestError('A position with that code already exists.')

    const result = await db.query(
      `INSERT INTO positions (code, name, dept_code)
       VALUES ($1, $2, $3)
       RETURNING code, name, dept_code AS deptCode`,
      [code, name, deptCode]
    )

    const position = result.rows[0]

    return position
  }

  static async getForUser(userId) {
    const userPositionsRes = await db.query(
      `SELECT p.code, p.name
       FROM positions AS p
       INNER JOIN user_position AS up
          ON up.position_code = p.code
       INNER JOIN users AS u
          ON u.id = up.user_id
       WHERE id = $1`,
       [userId]
    )

    const positions = userPositionsRes.rows.map((p) => p.name) || []

    return positions
  }

  static async getForDepartment(deptCode) {
    const positionResult = await db.query(
      `SELECT code, name
       FROM positions
       WHERE dept_code = $1`,
      [deptCode]
    )

    const positions =
      positionResult.rows.map((p) => {
        return { id: p.id, name: p.name }
      }) || []

    return positions
  }

  static async update() {}

  static async delete() {}
}

module.exports = Position