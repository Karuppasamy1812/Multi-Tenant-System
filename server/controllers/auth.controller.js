import { registerOrg, registerMember, loginUser } from '../services/auth.service.js';
import catchAsync from '../middleware/catchAsync.js';

const register = catchAsync(async (req, res) => {
  const { type } = req.body;
  const result = type === 'org'
    ? await registerOrg(req.body)
    : await registerMember(req.body);
  res.status(201).json(result);
});

const login = catchAsync(async (req, res) => {
  const result = await loginUser(req.body);
  res.json(result);
});

const getMe = (req, res) => res.json(req.user);

const logout = (req, res) => res.json({ message: 'Logged out successfully' });

export { register, login, getMe, logout };
