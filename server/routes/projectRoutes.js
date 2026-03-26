import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  createProject,
  getProjects,
} from "../controllers/projectController.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, authorizeRoles("admin", "manager"), createProject);
router.get("/", protect,  authorizeRoles("admin", "manager"), getProjects);

export default router;