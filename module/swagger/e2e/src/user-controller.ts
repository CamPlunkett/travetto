import { Controller, Get, Post, Put, Delete, Request, Response } from '@travetto/rest';
import { SchemaQuery, SchemaBody } from '@travetto/schema/src/extension/rest';

import { User, UserSearch } from './model';

/**
 * User oriented operations.
 */
@Controller('/user')
export class UserController {

  /**
   * Get user by full name
   * @param name {String} User name
   * @returns A user by name
   */
  @Get('/:name')
  async getByName(req: Request, res: Response): Promise<User> {
    return undefined as any;
  }

  /**
   * Get user by age
   * @param age {Number} User age
   * @returns Users by age
   */
  @Get('/age/:age')
  async getByAge(req: Request, res: Response): Promise<User[]> {
    return undefined as any;
  }

  /**
   * Get all users
   * @returns A list of users
   */
  @Get('/')
  @SchemaQuery(UserSearch)
  async getAll(req: Request, res: Response): Promise<User[]> {
    return [];
  }

  @Post('/')
  @SchemaBody(User)
  async createUser(req: Request, res: Response): Promise<User> {
    return undefined as any;
  }

  /**
   * Update user by id
   * @param id {Number} User id
   */
  @Put('/:id')
  @SchemaBody(User)
  async updateUser(req: Request, res: Response): Promise<void> {

  }
  /**
   * Delete user by id
   * @param id {Number} User id
   */
  @Delete('/:id')
  async removeUser(req: Request, res: Response): Promise<void> {

  }
}