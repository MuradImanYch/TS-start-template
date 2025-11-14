import { Request, Response } from "express";
import {connect, sql} from '../utils/db.js';
import response from '../utils/response.js';
import toEmptyString from '../utils/toEmptyString.js';
import toNull from '../utils/toNull.js';

export async function test(req: Request, res: Response) {
  // const pool = await connect();
  // const result = await pool.request().query("SELECT * FROM TBL_PROPERTIES");

  type Object = {
    name: string,
    age: number,
    null: null 
  }

  const obj: Object = {
    name: "John Doe",
    age: 30,
    null: null
  }

  response(res, 200, "Query executed successfully", {data: {
    name: toEmptyString(obj && obj?.name),
    age: toEmptyString(obj && obj?.age),
    null: toEmptyString(obj && obj?.null),
    obj: toNull({
      name: toEmptyString(obj && obj?.name),
      age: toEmptyString(obj && obj?.age),
      null: toEmptyString(obj && obj?.null)
    })
  }});
}
