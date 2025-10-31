import { response_not_found, response_success } from "$utils/response.utils";
import { Request, Response, Router } from "express";
import RoutesRegistry from "./registry";
import { authMiddleware } from "../middlewares/auth.middleware";


const router = Router();

router.get("/", (req: Request, res: Response) => {
  return response_success(res, "main routes!");
})

router.get('/robots.txt', function (req:Request, res:Response) {
  res.type('text/plain')
  res.send(
    `User-agent: *\nAllow: /`);
});
router.get("/ping", (req: Request, res: Response) => {
  return response_success(res, "pong!");
});


// Authentication routes (no auth required)
router.use("/auth", RoutesRegistry.AuthRoutes);

// Protected routes
router.use("/todos", RoutesRegistry.TodoRoutes);
router.use("/file-process", RoutesRegistry.FileProcessRoutes);

// Example routes
router.use("/example", RoutesRegistry.ExampleRoutes);


router.all("*", (req: Request, res: Response) => {
  return response_not_found(res);
});

export default router;
