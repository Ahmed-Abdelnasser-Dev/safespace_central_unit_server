/**
 * users.controller.js — Users controller
 * Thin layer: extract input → call service → return response.
 */

const catchAsync     = require('../../middleware/catchAsync');
const usersService   = require('./users.service');
const AppError       = require('../../utils/AppError');

exports.listUsers = catchAsync(async (req, res) => {
  const { page, limit, role, isActive, search } = req.query;
  const result = await usersService.listUsers({
    page:     page     ? parseInt(page, 10)  : 1,
    limit:    limit    ? parseInt(limit, 10) : 20,
    role,
    search,
    isActive: isActive !== undefined ? isActive === 'true' : undefined,
  });
  res.status(200).json({ status: 'success', data: result });
});

exports.getUser = catchAsync(async (req, res) => {
  const user = await usersService.getUserById(req.params.id, req.user);
  res.status(200).json({ status: 'success', data: user });
});

exports.getMe = catchAsync(async (req, res) => {
  const user = await usersService.getUserById(req.user.id, req.user);
  res.status(200).json({ status: 'success', data: user });
});

exports.createUser = catchAsync(async (req, res) => {
  const { email, roleId, nationalId, employeeId } = req.body;
  const result = await usersService.createUser({
    email, roleId, nationalId, employeeId,
    createdByUserId: req.user.id,
  });
  res.status(201).json({ status: 'success', data: result });
});

exports.updateMe = catchAsync(async (req, res) => {
  const updated = await usersService.updateMyProfile(req.user.id, req.body);
  res.status(200).json({ status: 'success', data: updated });
});

exports.updateProfilePhoto = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);
  const photoUrl = `/uploads/${req.file.filename}`;
  const result = await usersService.updateProfilePhoto(req.user.id, photoUrl);
  res.status(200).json({ status: 'success', data: result });
});

exports.updateUser = catchAsync(async (req, res) => {
  const updated = await usersService.updateUserByAdmin(
    req.params.id,
    req.body,
    req.user.id
  );

  res.status(200).json({ status: 'success', data: updated });
});

exports.deactivateUser = catchAsync(async (req, res) => {
  await usersService.deactivateUser(req.params.id, req.user.id);

  res.status(200).json({
    status: 'success',
    message: 'User deactivated'
  });
});



exports.reactivateUser = catchAsync(async (req, res) => {
  await usersService.reactivateUser(req.params.id, req.user.id);
  res.status(200).json({ status: 'success', message: 'User reactivated' });
});