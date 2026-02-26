/**
 * users.schema.js — Zod validation schemas for User endpoints
 */

const { z } = require('zod');

const createUserSchema = {
  body: z.object({
    email:      z.string().email('Invalid email format'),
    roleId:     z.number().int().positive('Invalid role'),
    nationalId: z.string().min(5).max(20),
    employeeId: z.string().min(3).max(20),
  }),
};

const updateProfileSchema = {
  body: z.object({
    username:       z.string().min(3).max(30).optional(),
    fullName:       z.string().min(2).max(100).optional(),
    phone:          z.string().max(20).optional(),
    birthdate:      z.string().optional(),
    address:        z.string().max(255).optional(),
    gender:         z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    department:     z.string().max(100).optional(),
    officeLocation: z.string().max(255).optional(),
  }),
};

const userIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
};

const listUsersSchema = {
  query: z.object({
    page:     z.string().optional(),
    limit:    z.string().optional(),
    role:     z.enum(['admin', 'emergency_dispatcher', 'road_observer', 'node_maintenance_crew']).optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }),
};

module.exports = { createUserSchema, updateProfileSchema, userIdParamSchema, listUsersSchema };