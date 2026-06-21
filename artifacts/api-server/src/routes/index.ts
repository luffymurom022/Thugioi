import { Router, type IRouter } from "express";
import healthRouter from "./health";
import creaturesRouter from "./creatures";
import zonesRouter from "./zones";
import historyRouter from "./history";
import dashboardRouter from "./dashboard";
import breedingRouter from "./breeding";
import evolutionRouter from "./evolution";

const router: IRouter = Router();

router.use(healthRouter);
router.use(creaturesRouter);
router.use(zonesRouter);
router.use(historyRouter);
router.use(dashboardRouter);
router.use(breedingRouter);
router.use(evolutionRouter);

export default router;
