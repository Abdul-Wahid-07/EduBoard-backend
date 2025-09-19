import express from "express";
import authcontrollers from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", authcontrollers.register);
router.post("/login", authcontrollers.login);
router.post("/contact", authcontrollers.contact);

export default router;
