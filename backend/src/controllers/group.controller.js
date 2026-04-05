import { z } from 'zod';

import * as groupService from '../services/group.service.js';
import { successResponse } from '../utils/apiResponse.js';

const userIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

const groupIdParamSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
});

export async function createGroup(req, res, next) {
  try {
    const group = await groupService.createGroup(req.user.userId, req.body);
    return successResponse(res, { group }, 'Group created successfully', 201);
  } catch (err) {
    return next(err);
  }
}

export async function getMyGroup(req, res, next) {
  try {
    const group = await groupService.getMyGroup(req.user.userId);
    return successResponse(res, { group }, '', 200);
  } catch (err) {
    return next(err);
  }
}

export async function addMember(req, res, next) {
  try {
    const group = await groupService.addMember(req.user.userId, req.body);
    return successResponse(res, { group }, 'Member added successfully', 200);
  } catch (err) {
    return next(err);
  }
}

export async function removeMember(req, res, next) {
  try {
    const { userId } = userIdParamSchema.parse(req.params);
    const group = await groupService.removeMember(req.user.userId, userId);
    return successResponse(res, { group }, 'Member removed successfully', 200);
  } catch (err) {
    return next(err);
  }
}

export async function leaveGroup(req, res, next) {
  try {
    await groupService.leaveGroup(req.user.userId);
    return successResponse(
      res,
      { group: null },
      'Left group successfully',
      200
    );
  } catch (err) {
    return next(err);
  }
}

export async function deleteGroup(req, res, next) {
  try {
    await groupService.deleteGroup(req.user.userId);
    return successResponse(res, null, 'Group deleted successfully', 200);
  } catch (err) {
    return next(err);
  }
}

export async function getAllGroups(req, res, next) {
  try {
    const result = await groupService.getAllGroups(
      req.query.page,
      req.query.limit
    );

    return res.status(200).json({
      success: true,
      data: result.groups,
      pagination: result.pagination,
      message: '',
    });
  } catch (err) {
    return next(err);
  }
}

export async function getGroupDetail(req, res, next) {
  try {
    const { groupId } = groupIdParamSchema.parse(req.params);
    const group = await groupService.getGroupDetail(groupId);
    return successResponse(res, { group }, '', 200);
  } catch (err) {
    return next(err);
  }
}
