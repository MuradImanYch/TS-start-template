import { Router } from "express";
import { login, reg, logout, users } from "../controllers/auth";
import { checkToken } from "../../utils/checkToken";

const router = Router();

router.post("/login", login);
router.post("/reg", reg);
router.post("/logout", logout);

router.use(checkToken);

router.get("/users", users);

export default router;
