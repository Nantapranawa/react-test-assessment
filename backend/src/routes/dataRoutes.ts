import { Router } from 'express';
import { getRoot, getData, uploadExcel } from '../controllers/dataController';
import { upload } from '../middleware/upload';

const router = Router();

router.get("/", getRoot); //hello world
router.get("/list", getData); // cuman array alice bob charlie
router.post("/upload-excel", upload.single('file'), uploadExcel);

export default router;
