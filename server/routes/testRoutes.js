import express from "express";
import Tenant from "../models/Tenant.js";
import User from "../models/User.js";

const router = express.Router();

// Create tenant + user
router.get("/seed", async (req, res) => {
  try {
    const tenant = await Tenant.create({
      name: "Test Company",
    });

    const user = await User.create({
      name: "Mohan",
      email: "mohan@test.com",
      password: "123456",
      tenantId: tenant._id,
      role: "admin",
    });

    res.json({ tenant, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;